const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// CSL10 ships ESM syntax without package type metadata. Transpile its real JS in
// memory for this CommonJS test process, never replace its API or edit node_modules.
const original = require.extensions['.js'];
require.extensions['.js'] = (module, filename) => {
  if (filename.includes('@emurgo/cardano-serialization-lib-asmjs/')) {
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2016 }
    }).outputText, filename);
  } else original(module, filename);
};
const CSL = require('@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib');
const { default: Wallets } = require(process.env.WALLET_PACKAGE || '../lib/index');
const expectedAddress = 'addr_test1vq3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygswahgq5';
let storage;
beforeEach(() => {
  storage = new Map();
  delete global.window;
  Wallets.wallet = undefined;
  Wallets._enabledWallet = undefined;
});
function provider(api = {}) {
  global.window = { localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  }, cardano: { nami: { name: 'Nami', icon: 'fixture.svg', apiVersion: '1.0.0', enable: async () => api } } };
}
function cbor(withAsset, lovelace = '1234567') {
  const address = CSL.Address.from_bytes(Buffer.from('60' + '22'.repeat(28), 'hex'));
  const value = CSL.Value.new(CSL.BigNum.from_str(lovelace));
  if (withAsset) {
    const entries = CSL.Assets.new();
    entries.insert(CSL.AssetName.new(Buffer.from('fixture')), CSL.BigNum.from_str('7'));
    const multi = CSL.MultiAsset.new();
    multi.insert(CSL.ScriptHash.from_bytes(Buffer.from('33'.repeat(28), 'hex')), entries);
    value.set_multiasset(multi);
  }
  return Buffer.from(CSL.TransactionUnspentOutput.new(
    CSL.TransactionInput.new(CSL.TransactionHash.from_bytes(Buffer.from('11'.repeat(32), 'hex')), 3),
    CSL.TransactionOutput.new(address, value)
  ).to_bytes()).toString('hex');
}
// These tests exercise the built original source and real CSL10. Their negative
// controls are wrong decoded values, invented fallback results or swallowed errors.
test('missing browser rejects instead of silently succeeding', async () => {
  await assert.rejects(Wallets.connect('nami'), /window is not defined/);
});
test('missing provider rejects', async () => {
  global.window = {};
  await assert.rejects(Wallets.connect('nami'), /No wallets found/);
});
test('missing selected provider rejects', async () => {
  provider(); delete window.cardano.nami;
  await assert.rejects(Wallets.connect('nami'), /Specific wallet not found/);
});
test('original eight-wallet allowlist stays exact and unsupported wallets reject', async () => {
  assert.deepEqual(Wallets.supportedWalletNames, ['nami','eternl','gerowallet','flint','yoroi','nufi','typhoncip30','begin']);
  provider();
  await assert.rejects(Wallets.connect('unlisted'), /not supported/i);
});
test('connect persists exact wallet details and exposes enabled API', async () => {
  const api = { getNetworkId: async () => 0 }; provider(api);
  const wallet = await Wallets.connect('nami');
  assert.equal(wallet.name, 'Nami');
  assert.equal(Wallets._enabledWallet, api);
  assert.deepEqual(JSON.parse(storage.get('cardanoWallet')), { name:'Nami', icon:'fixture.svg', apiVersion:'1.0.0', key:'nami' });
  assert.equal(Wallets.getWalletDetailsFromStorage().key, 'nami');
});
test('existing stored first choice is not overwritten', async () => {
  provider(); storage.set('cardanoWallet', JSON.stringify({ key:'eternl', custom:'preserved' }));
  await Wallets.connect('nami');
  assert.deepEqual(JSON.parse(storage.get('cardanoWallet')), {key:'eternl', custom:'preserved'});
});
test('provider rejection is propagated without storing connection', async () => {
  provider(); window.cardano.nami.enable = async () => { throw new Error('denied fixture'); };
  await assert.rejects(Wallets.connect('nami'), /denied fixture/);
  assert.equal(storage.size, 0);
});
test('network identification preserves mainnet and testnet values', async () => {
  for (const network of [0,1]) {
    provider({getNetworkId:async()=>network}); await Wallets.connect('nami');
    assert.equal(await Wallets.isMainnet(), network === 1);
  }
});
for (const withAsset of [false,true]) test(`real CSL10 UTxO decoding, native assets=${withAsset}`, async () => {
  assert.deepEqual(await Wallets.buildUtxos([cbor(withAsset)]), [{txId:'11'.repeat(32),txIndx:3,lovelaceAmount:'1234567',assets:withAsset?[{policyId:'33'.repeat(28),name:'fixture',hex:'66697874757265'}]:[]}]);
});
test('large lovelace remains an exact decimal string beyond Number precision', async () => {
  const [utxo] = await Wallets.buildUtxos([cbor(false, '9007199254740993')]);
  assert.equal(utxo.lovelaceAmount,'9007199254740993');
  assert.deepEqual(utxo.assets,[]);
});
test('empty UTxOs stay empty', async () => { assert.deepEqual(await Wallets.buildUtxos([]), []); });
test('invalid JavaScript null input rejects', async () => { await assert.rejects(Wallets.buildUtxos(null), TypeError); });
test('legacy corrupt bytes reject rather than return null', async () => {
  await assert.rejects(Wallets.buildUtxos(['test1','test2']));
});
test('real enabled wallet returns exact address from UTxO CBOR', async () => {
  provider({getUtxos:async()=>[cbor(true)]}); await Wallets.connect('nami');
  assert.deepEqual(await Wallets.getUtxoBech32Addresses(), [expectedAddress]);
});
test('disable removes persisted choice without signing or provider invocation', async () => {
  provider(); global.localStorage = window.localStorage;
  try {
    storage.set('cardanoWallet', JSON.stringify({key:'nami'}));
    await Wallets.disableWallet();
    assert.equal(storage.has('cardanoWallet'),false);
  } finally { delete global.localStorage; }
});
test('reward address keeps network and credential bytes', async () => {
  const hex = 'e0'+'22'.repeat(28);
  provider({getRewardAddresses:async()=>[hex]}); await Wallets.connect('nami');
  const addresses = await Wallets.getRewardAddresses();
  assert.equal(addresses.length,1);
  assert.match(addresses[0],/^stake_test1/);
  assert.equal(Buffer.from(CSL.Address.from_bech32(addresses[0]).to_bytes()).toString('hex'),hex);
});
test('malformed reward bytes propagate actual decoder rejection', async () => {
  provider({getRewardAddresses:async()=>['ff']}); await Wallets.connect('nami');
  await assert.rejects(Wallets.getRewardAddresses());
});
