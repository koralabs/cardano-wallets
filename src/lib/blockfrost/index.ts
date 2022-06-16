import axios from 'axios';
import { WalletError } from '../../enums/WalletError';
import { AccountsHistoryResult, AccountsRegistrationResult } from './interfaces/accounts';
import { BlockfrostResult } from './interfaces/Result';
import { API_VERSION } from './lib/consts';

export class Blockfrost {
    public static BLOCKFROST_URL = process.env.BLOCKFROST_URL ?? '';
    public static PUBLIC_BLOCKFROST_PROJECT_ID = process.env.PUBLIC_BLOCKFROST_PROJECT_ID ?? '';

    public static async getAccountsHistory(stakeAddress: string) {
        const { data } = await axios
            .get<BlockfrostResult<AccountsHistoryResult[]>>(
                `${this.BLOCKFROST_URL}/api/${API_VERSION}/accounts/${stakeAddress}/history?order=desc`,
                {
                    headers: { project_id: this.PUBLIC_BLOCKFROST_PROJECT_ID as string }
                }
            )
            .catch((err) => {
                throw new Error(WalletError.BlockfrostGetRewardsHistoryError);
            });

        return data;
    }

    public static async getAccountsRegistrations(stakeAddress: string) {
        const { data } = await axios
            .get<BlockfrostResult<AccountsRegistrationResult[]>>(
                `${this.BLOCKFROST_URL}/api/${API_VERSION}/accounts/${stakeAddress}/registrations?order=desc`,
                {
                    headers: { project_id: this.PUBLIC_BLOCKFROST_PROJECT_ID as string }
                }
            )
            .catch((err) => {
                throw new Error(WalletError.BlockfrostGetRegistrationsError);
            });

        return data;
    }
}
