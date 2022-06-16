export interface AccountsHistoryResult {
    active_epoch: number;
    amount: string;
    pool_id: string;
}

export interface AccountsRegistrationResult {
    tx_hash: string;
    action: 'registered' | 'deregistered';
}
