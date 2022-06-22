export interface Asset {
    policyId: string;
    name: string;
    hex: string;
}

export interface Utxo {
    txId: string;
    txIndx: number;
    lovelaceAmount: string;
    assets: Asset[];
}
