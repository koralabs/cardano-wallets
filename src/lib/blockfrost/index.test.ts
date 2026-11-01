import axios from 'axios';
import { WalletError } from '../../enums/WalletError';
import { Blockfrost } from './index';

jest.mock('axios');
const get = axios.get as jest.Mock;

// Invariant: reward history and registrations are requested newest-first from the configured Blockfrost
// project with its id header, and the response body is returned.
// Failure: wrong path/header silently queries the wrong account data or is rejected by Blockfrost.
// Negative: change `order=desc` or the endpoint name and the URL assertion fails.
describe('Blockfrost', () => {
    beforeEach(() => {
        get.mockReset();
        Blockfrost.BLOCKFROST_URL = 'https://bf.test';
        Blockfrost.PUBLIC_BLOCKFROST_PROJECT_ID = 'proj123';
    });

    test.each([
        ['getAccountsHistory', 'history'],
        ['getAccountsRegistrations', 'registrations']
    ] as const)('%s queries the account endpoint with the project id and returns the body', async (method, endpoint) => {
        get.mockResolvedValue({ data: [{ id: 1 }] });
        await expect(Blockfrost[method]('stake1abc')).resolves.toEqual([{ id: 1 }]);
        expect(get).toHaveBeenCalledTimes(1);
        const [url, config] = get.mock.calls[0];
        expect(url).toMatch(new RegExp(`^https://bf\\.test/api/v\\d+/accounts/stake1abc/${endpoint}\\?order=desc$`));
        expect(config).toEqual({ headers: { project_id: 'proj123' } });
    });

    // Failure mode: raw network errors leaking to callers instead of the typed wallet error.
    test.each([
        ['getAccountsHistory', WalletError.BlockfrostGetRewardsHistoryError],
        ['getAccountsRegistrations', WalletError.BlockfrostGetRegistrationsError]
    ] as const)('%s maps request failure to its typed error', async (method, message) => {
        get.mockRejectedValue(new Error('ECONNRESET'));
        await expect(Blockfrost[method]('stake1abc')).rejects.toThrow(message);
    });
});
