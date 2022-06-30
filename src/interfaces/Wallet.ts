import { Paginate } from './Paginate';

export interface Wallet {
    apiVersion: string;
    enable: () => Promise<EnabledWallet>;
    isEnabled: () => Promise<boolean>;
    experimental: Record<string, unknown>;
    icon: string;
    name: string;
}

export interface EnabledWallet {
    wallet: Wallet;
    getBalance: () => Promise<string>;
    getNetworkId: () => Promise<number>;
    getUtxos: (amount?: string, paginate?: Paginate) => Promise<string[]>;
    getCollateral: () => Promise<string[]>;
    getUnusedAddresses: () => Promise<string[]>;
    getChangeAddress: () => Promise<string>;
    getRewardAddresses: () => Promise<string[]>;
    signTx: (tx: string, partialSign: boolean) => Promise<unknown>;
    submitTx: (tx: string) => Promise<string>;
}
