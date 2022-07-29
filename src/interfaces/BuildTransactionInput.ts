export interface OutputParams {
    address: string;
    lovelaceAmount: string;
}

export interface MainOutputParams extends OutputParams {
    changeAddress: string;
}

export interface BuildTransactionInput {
    paymentDetails: MainOutputParams;
    feeDetails?: OutputParams;
}
