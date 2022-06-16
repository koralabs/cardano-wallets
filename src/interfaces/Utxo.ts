export interface Utxo {
    txId: string;
    txIndx: number;
    lovelaceAmount: string;
    policyHex?: string;
    assetName?: string;
    assetNameHex?: string;
}
