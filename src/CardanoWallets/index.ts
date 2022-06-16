import { WalletKey } from '../enums/WalletName';
import { EnabledWallet, Wallet } from '../interfaces/Wallet';
import { Buffer } from 'buffer';
import { Utxo } from '../interfaces/Utxo';
import { Paginate } from '../interfaces/Paginate';
import { Blockfrost } from '../lib/blockfrost';
import { WalletError } from '../enums/WalletError';
import { loadCardanoWasm } from '../lib/serialize';

export class CardanoWallets {
    public static _enabledWallet: EnabledWallet;
    public static wallet: Wallet;
    public static localStorageKey = 'cardanoWallet';

    public static supportedWalletNames: string[] = [
        WalletKey.Nami,
        WalletKey.Eternl,
        WalletKey.GeroWallet,
        WalletKey.Flint
    ];

    // Private methods

    /**
     *
     * Used to set the wallet in local storage
     *
     * @param walletKey string
     */
    private static async _setWallet(walletKey: string) {
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

    /**
     *
     * Gets the wallet from local storage if available. If not, method will return null
     *
     * @returns an enabled wallet or null
     */
    public static async getWallet() {
        const wallet = window.localStorage.getItem(this.localStorageKey);
        if (!wallet) {
            return null;
        }

        const walletDetails = JSON.parse(wallet);
        if (!walletDetails) {
            return null;
        }

        return await this.connect(walletDetails.key);
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
    public static getNetworkId = async (): Promise<string> => {
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
        return changeAddress;
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
    public static signTx = async (tx: string, partialSign = false): Promise<unknown> => {
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
    public static isMainnet = async (): Promise<boolean> => {
        const networkId = await this._enabledWallet.getNetworkId();
        return networkId === '1';
    };

    /**
     *
     * Used to verify that a wallet has the minimum necessary funds
     *
     * @param minimumBalance number
     */
    public static verifyBalance = async (minimumBalance: number): Promise<void> => {
        if (minimumBalance <= 0) {
            throw new Error(WalletError.MinimumBalanceIsZero);
        }

        const balanceHex = (await this.getBalance()) as string;

        const serializationLib = await loadCardanoWasm();
        const balance = serializationLib.Value.from_bytes(Buffer.from(balanceHex, 'hex')).coin().to_str();
        if (parseInt(balance) / 1000000 <= minimumBalance) {
            throw new Error(WalletError.InsufficientBalance);
        }
    };

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

            let assetNameString;
            let assetNameHex;
            let policyHex;

            if (multiasset) {
                const keys = multiasset.keys();
                const keysLength = keys.len();

                for (let i = 0; i < keysLength; i++) {
                    const policy = keys.get(i);
                    const policyBytes = policy.to_bytes() as unknown as string;
                    policyHex = Buffer.from(policyBytes, 'utf8').toString('hex');

                    const assets = multiasset.get(policy);
                    const assetNames = assets.keys();
                    const assetLenth = assetNames.len();

                    for (let j = 0; j < assetLenth; j++) {
                        const assetName = assetNames.get(j);
                        const assetNameBytes = assetName.name() as unknown as string;
                        assetNameString = Buffer.from(assetNameBytes, 'utf8').toString();
                        assetNameHex = Buffer.from(assetNameBytes, 'utf8').toString('hex');
                    }
                }
            }

            utxoDetails.push({
                txId,
                txIndx,
                lovelaceAmount,
                policyHex,
                assetNameHex,
                assetName: assetNameString
            });
        }

        return utxoDetails;
    }
}
