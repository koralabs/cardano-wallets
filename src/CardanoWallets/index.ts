import { WalletKey } from '../enums/WalletKey';
import { EnabledWallet, Wallet } from '../interfaces/Wallet';
import { Buffer } from 'buffer';
import { Asset, Utxo } from '../interfaces/Utxo';
import { Paginate } from '../interfaces/Paginate';
import { Blockfrost } from '../lib/blockfrost';
import { WalletError } from '../enums/WalletError';
import { loadCardanoWasm } from '../lib/serialize';
import { BuildTransactionInput } from '../interfaces/BuildTransactionInput';
// import * as lib from '@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib';

export class CardanoWallets {
    public static _enabledWallet: EnabledWallet;
    public static wallet: Wallet;
    public static localStorageKey = 'cardanoWallet';

    public static supportedWalletNames: string[] = [
        WalletKey.Nami,
        WalletKey.Eternl,
        WalletKey.GeroWallet,
        WalletKey.Flint,
        WalletKey.Yoroi,
        WalletKey.NuFi,
        WalletKey.Typhon,
        WalletKey.Begin,
        WalletKey.Exodus
    ];

    // Private methods

    /**
     *
     * Used to set the wallet in local storage
     *
     * @param walletKey string
     */
    private static async _setWallet(walletKey: string) {
        const details = this.getWalletDetailsFromStorage();
        if (!details) {
            window.localStorage.setItem(
                this.localStorageKey,
                JSON.stringify({
                    name: this.wallet.name,
                    icon: this.wallet.icon,
                    apiVersion: this.wallet.apiVersion,
                    key: walletKey
                })
            );
        }
    }

    public static setAdditionalWalletData(data: Record<string, string>) {
        const item = window.localStorage.getItem(this.localStorageKey);
        if (!item) {
            throw new Error(`No data saved to local storage. Missing ${this.localStorageKey}`);
        }

        const jsonItem = JSON.parse(item);
        const updatedItem = {
            ...jsonItem,
            ...data
        };
        window.localStorage.setItem(this.localStorageKey, JSON.stringify(updatedItem));
    }

    /**
     *
     * Uses CIP-30 'enable' function to enable the wallet
     *
     * @param wallet Wallet to enable
     * @returns
     */

    private static _enableWallet = async (wallet: Wallet): Promise<void> => {
        this._enabledWallet = await wallet.enable();
    };

    // Public methods

    /**
     *
     * Validation method used to check if the wallet is supported
     *
     * @param walletKey string
     */
    private static validateSupportedWallet(walletKey: string): void {
        if (!this.supportedWalletNames.includes(walletKey)) {
            throw new Error(
                `${walletKey} is not supported. Only ${this.supportedWalletNames.join(', ')} are supported.`
            );
        }
    }

    /**
     *
     * Validation method used to check the window.cardano object
     *
     * @param walletKey string
     */
    public static validateWallet(walletKey: string): void {
        if (!window) {
            throw new Error(WalletError.WindowNotDefined);
        }

        if (!window.cardano) {
            throw new Error(WalletError.NoWalletsFound);
        }

        if (!window.cardano[walletKey]) {
            throw new Error(WalletError.SpecificWalletNotFound);
        }
    }

    /**
     *
     * Used to enable the wallet and set the wallet in local storage
     *
     * @param walletKey string e.g. 'nami', 'eternal', etc
     * @returns an enabled wallet
     */
    public static async connect(walletKey: string): Promise<Wallet> {
        this.validateSupportedWallet(walletKey);
        this.validateWallet(walletKey);

        const wallet = window.cardano[walletKey];
        await this._enableWallet(wallet);

        this.wallet = wallet;

        this._setWallet(walletKey);

        return this.wallet;
    }

    public static getWalletDetailsFromStorage() {
        const wallet = window.localStorage.getItem(this.localStorageKey);
        if (!wallet) {
            return null;
        }

        const walletDetails = JSON.parse(wallet);
        if (!walletDetails) {
            return null;
        }

        return walletDetails;
    }

    public static disableWallet = async (): Promise<void> => {
        localStorage.removeItem(this.localStorageKey);
    };

    // CIP-30 methods

    /**
     *
     * CIP-30 method to check if wallet is enabled
     * https://cips.cardano.org/cips/cip30/#cardanowalletnameisenabledpromisebool
     *
     * @returns CIP-30 Wallet
     */
    public static isWalletEnabled = async (): Promise<boolean> => {
        return this.wallet.isEnabled();
    };

    /**
     *
     * CIP-30 method to get the balance of the wallet
     * https://cips.cardano.org/cips/cip30/#apigetbalancepromisecborvalue
     *
     * @returns balanceHex
     */
    public static getBalance = async (): Promise<string> => {
        const balanceHex = await this._enabledWallet.getBalance();
        return balanceHex;
    };

    /**
     *
     * CIP-30 method to get the network id of the wallet
     * https://cips.cardano.org/cips/cip30/#apigetnetworkidpromisenumber
     *
     * @returns 0 or 1 (0 = testnet, 1 = mainnet)
     */
    public static getNetworkId = async (): Promise<number> => {
        const networkId = await this._enabledWallet.getNetworkId();
        return networkId;
    };

    /**
     *
     * CIP-30 method to get the UTXOs of the wallet
     * https://cips.cardano.org/cips/cip30/#apigetutxosamountcborvalueundefinedpaginatepaginateundefinedpromisetransactionunspentoutputnull
     *
     * @returns an array of hex encoded utxos
     */
    public static getUtxos = async (amount?: string, paginate?: Paginate): Promise<string[]> => {
        const rawUtxos = await this._enabledWallet.getUtxos(amount, paginate);
        return rawUtxos;
    };

    /**
     *
     * CIP-30 method to get wallet collateral
     * https://cips.cardano.org/cips/cip30/#apigetcollateralparamsamountcborcoinpromisetransactionunspentoutputnull
     *
     * @returns list of Utxos
     */
    public static getCollateral = async (): Promise<string[]> => {
        const collateral = await this._enabledWallet.getCollateral();
        return collateral;
    };

    /**
     *
     * CIP-30 method to get unused addresses
     * https://cips.cardano.org/cips/cip30/#apigetunusedaddressespromiseaddress
     *
     * @returns list of unused addresses
     */
    public static getUnusedAddresses = async (): Promise<string[]> => {
        const unusedAddresses = await this._enabledWallet.getUnusedAddresses();
        return unusedAddresses;
    };

    /**
     *
     * CIP-30 method to get a change address
     * https://cips.cardano.org/cips/cip30/#apigetchangeaddresspromiseaddress
     *
     * @returns change address
     */
    public static getChangeAddress = async (): Promise<string> => {
        const changeAddress = await this._enabledWallet.getChangeAddress();

        const serializationLib = await loadCardanoWasm();
        const bech32Address = serializationLib.Address.from_bytes(Buffer.from(changeAddress, 'hex')).to_bech32();
        return bech32Address;
    };

    /**
     *
     * CIP-30 method to get a reward address
     * https://cips.cardano.org/cips/cip30/#apigetrewardaddressespromiseaddress
     *
     * @returns a reward address
     */
    public static getRewardAddresses = async (): Promise<string[]> => {
        const rewardAddresses = await this._enabledWallet.getRewardAddresses();

        const serializationLib = await loadCardanoWasm();
        const bech32RewardAddress = rewardAddresses.map((addr) =>
            serializationLib.Address.from_bytes(Buffer.from(addr, 'hex')).to_bech32()
        );
        return bech32RewardAddress;
    };

    /**
     *
     * CIP-30 method to get a sign a transaction
     * https://cips.cardano.org/cips/cip30/#apisigntxtxcbortransactionpartialsignboolfalsepromisecbortransaction_witness_set
     *
     * @param tx hex encoded transaction
     * @param partialSign boolean
     * @returns
     */
    public static signTx = async (tx: string, partialSign = false): Promise<any> => {
        const result = await this._enabledWallet.signTx(tx, partialSign);
        return result;
    };

    // public static signData = async (): Promise<string[]> => {
    //     const rawUtxos = await this._enabledWallet.signData();
    //     return rawUtxos;
    // };

    /**
     *
     * CIP-30 method to submit a transaction
     * https://cips.cardano.org/cips/cip30/#apisubmittxtxcbortransactionpromisehash32
     *
     * @param tx hex encoded transaction
     * @returns transaction id
     */
    public static submitTx = async (tx: string): Promise<string> => {
        const transactionId = await this._enabledWallet.submitTx(tx);
        return transactionId;
    };

    // Custom Methods

    /**
     *
     * Uses the CIP-30 getNetworkId to check if wallet is in mainnet or testnet
     *
     * @returns boolean
     */
    public static async isMainnet(): Promise<boolean> {
        const networkId = await this._enabledWallet.getNetworkId();
        return networkId === 1;
    }

    /**
     *
     * Fetches the wallet balance and converts it to ADA
     *
     * @returns number
     */
    public static async getAdaBalance(): Promise<number> {
        const balanceHex = await this.getBalance();

        const serializationLib = await loadCardanoWasm();
        const balance = serializationLib.Value.from_bytes(Buffer.from(balanceHex, 'hex')).coin().to_str();
        return parseInt(balance) / 1000000;
    }

    /**
     *
     * Used to verify that a wallet has the minimum necessary funds
     *
     * @param minimumBalance number
     */
    public static async verifyBalance(minimumBalance: number): Promise<void> {
        if (minimumBalance <= 0) {
            throw new Error(WalletError.MinimumBalanceIsZero);
        }

        const adaBalance = await this.getAdaBalance();

        if (adaBalance <= minimumBalance) {
            throw new Error(WalletError.InsufficientBalance);
        }
    }

    /**
     *
     * Used to verify a wallet is actively staked
     *
     * @param { rewardAddress: string }
     * @returns void if staked, throws NotDelegated error if not
     *
     */
    public static async verifyStaking({ rewardAddress }: { rewardAddress: string }): Promise<void> {
        const result = await Blockfrost.getAccountsRegistrations(rewardAddress);
        if (result.error) throw new Error(WalletError.NotDelegated);
        if (!result.data) throw new Error(WalletError.NotDelegated);

        const {
            data: [currentRegistration]
        } = result;

        if (!currentRegistration) {
            throw new Error(WalletError.NotDelegated);
        }
    }

    /**
     *
     * Gets bech32 addresses from UTxOs
     *
     * @returns string[]
     */
    public static async getUtxoBech32Addresses(): Promise<string[]> {
        const serializationLib = await loadCardanoWasm();
        const rawUtxos = await this.getUtxos();
        const bech32Address = rawUtxos.map((rawUtxo) => {
            const utxo = serializationLib.TransactionUnspentOutput.from_bytes(Buffer.from(rawUtxo, 'hex'));
            const output = utxo.output();
            return output.address().to_bech32();
        });

        return bech32Address;
    }

    /**
     *
     * Uses the serialization library to convert hex encoded utxos to human readable values
     *
     * @param rawUtxos Raw utxos from getUtxos()
     * @returns Utxo[]
     */
    public static async buildUtxos(rawUtxos: string[]): Promise<Utxo[]> {
        const serializationLib = await loadCardanoWasm();

        const utxoDetails = [];

        for (const rawUtxo of rawUtxos) {
            const utxo = serializationLib.TransactionUnspentOutput.from_bytes(Buffer.from(rawUtxo, 'hex'));
            const input = utxo.input();
            const txIdBytes = input.transaction_id().to_bytes() as unknown as string;
            const txId = Buffer.from(txIdBytes, 'utf8').toString('hex');
            const txIndx = input.index();
            const output = utxo.output();
            const lovelaceAmount = output.amount().coin().to_str();
            const multiasset = output.amount().multiasset();

            const allAssets: Asset[] = [];

            if (multiasset) {
                const keys = multiasset.keys();
                const keysLength = keys.len();

                for (let i = 0; i < keysLength; i++) {
                    const policy = keys.get(i);
                    const policyBytes = policy.to_bytes() as unknown as string;
                    const policyHex = Buffer.from(policyBytes, 'utf8').toString('hex');

                    const assets = multiasset.get(policy);
                    const assetNames = assets.keys();
                    const assetLenth = assetNames.len();

                    for (let j = 0; j < assetLenth; j++) {
                        const assetName = assetNames.get(j);
                        const assetNameBytes = assetName.name() as unknown as string;
                        const assetNameString = Buffer.from(assetNameBytes, 'utf8').toString();
                        const assetNameHex = Buffer.from(assetNameBytes, 'utf8').toString('hex');

                        allAssets.push({ policyId: policyHex, name: assetNameString, hex: assetNameHex });
                    }
                }
            }

            utxoDetails.push({
                txId,
                txIndx,
                lovelaceAmount,
                assets: allAssets
            });
        }

        return utxoDetails;
    }

    public static async buildTransaction({
        paymentDetails,
        feeDetails
    }: BuildTransactionInput): Promise<{ txHash: string; tx: string }> {
        try {
            //const serializationLib = lib;
            const serializationLib = await loadCardanoWasm();

            const protocolParams = {
                linearFee: {
                    minFeeA: '44',
                    minFeeB: '155381'
                },
                minUtxo: '34482',
                poolDeposit: '500000000',
                keyDeposit: '2000000',
                maxValSize: 5000,
                maxTxSize: 16384,
                priceMem: 0.0577,
                priceStep: 0.0000721,
                coinsPerUtxoWord: '34482'
            };

            const txBuilder = serializationLib.TransactionBuilder.new(
                serializationLib.TransactionBuilderConfigBuilder.new()
                    .fee_algo(
                        serializationLib.LinearFee.new(
                            serializationLib.BigNum.from_str(protocolParams.linearFee.minFeeA),
                            serializationLib.BigNum.from_str(protocolParams.linearFee.minFeeB)
                        )
                    )
                    .pool_deposit(serializationLib.BigNum.from_str(protocolParams.poolDeposit))
                    .key_deposit(serializationLib.BigNum.from_str(protocolParams.keyDeposit))
                    .coins_per_utxo_word(serializationLib.BigNum.from_str(protocolParams.coinsPerUtxoWord))
                    .max_value_size(protocolParams.maxValSize)
                    .max_tx_size(protocolParams.maxTxSize)
                    .prefer_pure_change(true)
                    .build()
            );

            const { address, lovelaceAmount, changeAddress } = paymentDetails;
            const shelleyOutputAddress = serializationLib.Address.from_bech32(address);

            txBuilder.add_output(
                serializationLib.TransactionOutput.new(
                    shelleyOutputAddress,
                    serializationLib.Value.new(serializationLib.BigNum.from_str(lovelaceAmount))
                )
            );

            if (feeDetails) {
                const feeOutputAddress = serializationLib.Address.from_bech32(feeDetails.address);
                txBuilder.add_output(
                    serializationLib.TransactionOutput.new(
                        feeOutputAddress,
                        serializationLib.Value.new(serializationLib.BigNum.from_str(feeDetails.lovelaceAmount))
                    )
                );
            }

            const rawUtxos = await this.getUtxos();
            const txUnspentOutputs = rawUtxos.reduce((acc, utxo) => {
                const fromBytes = serializationLib.TransactionUnspentOutput.from_bytes(Buffer.from(utxo, 'hex'));
                acc.add(fromBytes);
                return acc;
            }, serializationLib.TransactionUnspentOutputs.new());

            txBuilder.add_inputs_from(txUnspentOutputs, 0);

            const shelleyChangeAddress = serializationLib.Address.from_bech32(changeAddress);
            txBuilder.add_change_if_needed(shelleyChangeAddress);

            const builtTransaction = txBuilder.build();
            const txHash = Buffer.from(serializationLib.hash_transaction(builtTransaction).to_bytes()).toString('hex');

            const transaction = serializationLib.Transaction.new(
                builtTransaction,
                serializationLib.TransactionWitnessSet.new()
            );

            return {
                txHash,
                tx: Buffer.from(transaction.to_bytes()).toString('hex')
            };
        } catch (error: any) {
            console.log(error);
            throw new Error(error);
        }
    }

    public static async signTransaction(tx: string): Promise<string> {
        const serializationLib = await loadCardanoWasm();
        let txVkeyWitnesses = await this.signTx(tx, true);

        txVkeyWitnesses = serializationLib.TransactionWitnessSet.from_bytes(Buffer.from(txVkeyWitnesses, 'hex'));

        const transactionWitnessSet = serializationLib.TransactionWitnessSet.new();
        transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

        const txBody = serializationLib.Transaction.from_bytes(Buffer.from(tx, 'hex'));

        const signedTx = serializationLib.Transaction.new(txBody.body(), transactionWitnessSet);

        const signedTxHex = Buffer.from(signedTx.to_bytes()).toString('hex');
        return signedTxHex;
    }

    public static async submitSignedTransaction(signedTxHex: string): Promise<string> {
        const submittedTxHash = await this.submitTx(signedTxHex);
        return submittedTxHash;
    }

    public static async signAndSubmitTransaction(tx: string): Promise<string> {
        const signedTxHex = await this.signTransaction(tx);
        const submittedTxHash = await this.submitTx(signedTxHex);
        return submittedTxHash;
    }
}
