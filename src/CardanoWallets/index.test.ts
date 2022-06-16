import { CardanoWallets } from '.';

describe('CardanoWallets Tests', () => {
    describe('connect Tests', () => {
        it('Should throw error if window is not defined', async () => {
            try {
                await CardanoWallets.connect('nami');
            } catch (error) {
                expect((error as any).message).toEqual('window is not defined');
            }
        });

        it('Should throw error if window.cardano is not defined', async () => {
            // @ts-ignore
            global.window = {};

            try {
                await CardanoWallets.connect('nami');
            } catch (error) {
                expect((error as any).message).toEqual('No wallets found');
            }
        });

        it('Should throw error if window.cardano.nami is not defined', async () => {
            // @ts-ignore
            global.window = {
                cardano: {
                    eternl: {}
                }
            };

            try {
                await CardanoWallets.connect('nami');
            } catch (error) {
                expect((error as any).message).toEqual('Specific wallet not found');
            }
        });

        it('Should connect and save wallet details', async () => {
            // @ts-ignore
            global.window = {
                // @ts-ignore
                localStorage: {
                    setItem: jest.fn()
                },
                cardano: {
                    nami: {
                        icon: 'some-icon.jpg',
                        name: 'Nami',
                        enable: () => jest.fn(),
                        isEnabled: () => true
                    }
                }
            };

            await CardanoWallets.connect('nami');
            expect(CardanoWallets.wallet.name).toEqual('Nami');
        });
    });

    describe('buildUtxos tests', () => {
        it('Should build it', async () => {
            const result = await CardanoWallets.buildUtxos(['test1', 'test2']);
            expect(result).toEqual(null);
        });
    });
});
