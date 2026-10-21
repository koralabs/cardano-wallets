const fs = require('node:fs');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const path = require('node:path');
const exec = (cmd,args) => cp.execFileSync(cmd,args,{encoding:'utf8'}).trim();
const base = '2392719f9d77914acd9c7e4e3c4b8766997d7267';
const sha = exec('git',['rev-parse','HEAD']);
assert.equal(sha,process.env.EXPECTED_HEAD, 'Exact source head must match preparation input');
const pkg = JSON.parse(fs.readFileSync('package.json'));
assert.equal(pkg.version,'0.2.13-maintenance.1');
assert.equal(pkg.dependencies['@emurgo/cardano-serialization-lib-asmjs'],'10.2.0');
assert.equal(fs.readFileSync('yarn.lock','utf8'), cp.execFileSync('git',['show',`${base}:yarn.lock`],{encoding:'utf8'}));
assert.equal(exec('git',['diff',base,'HEAD','--','src']), '', 'Original runtime/type source must stay byte-identical');
fs.mkdirSync('tmp/prepared',{recursive:true});
// The original tsc configuration emits src tests under lib. npm's explicit
// files:['lib'] overrides the root ignore, so remove only compiled test outputs.
const removedTestArtifacts = [];
for (const filename of fs.readdirSync('lib', {recursive:true})) {
  if (/\.test\.(?:js|d\.ts)(?:\.map)?$/.test(filename)) {
    fs.unlinkSync(path.join('lib',filename));
    removedTestArtifacts.push(filename);
  }
}
pkg.gitHead = sha;
fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
const [pack] = JSON.parse(exec('npm',['pack','--ignore-scripts','--json','--pack-destination','tmp/prepared']));
assert.equal(pack.name,'@koralabs/cardano-wallets');
assert.equal(pack.version,pkg.version);
const files = pack.files.map(f=>f.path);
assert(files.includes('lib/index.js') && files.includes('lib/index.d.ts'));
assert(!files.some(f=>f.endsWith('.test.js') || f.endsWith('.test.d.ts')), 'No test modules in published output');
const archive = path.resolve('tmp/prepared',pack.filename);
const bytes = fs.readFileSync(archive);
assert.equal('sha512-'+crypto.createHash('sha512').update(bytes).digest('base64'),pack.integrity);
fs.mkdirSync('tmp/packed',{recursive:true});
exec('tar',['-xzf',archive,'-C','tmp/packed']);
const packedPkg = JSON.parse(fs.readFileSync('tmp/packed/package/package.json'));
assert.equal(packedPkg.gitHead,sha);
assert.deepEqual(packedPkg.dependencies,pkg.dependencies);
const packedRoot = path.resolve('tmp/packed/package');
const ts = require('typescript');
const source = `import Wallets, { Asset, Utxo, Wallet } from ${JSON.stringify(packedRoot)};
const connect: (key:string)=>Promise<Wallet> = key=>Wallets.connect(key);
const disable: ()=>Promise<void> = ()=>Wallets.disableWallet();
const network: ()=>Promise<boolean> = ()=>Wallets.isMainnet();
const rewards: ()=>Promise<string[]> = ()=>Wallets.getRewardAddresses();
const utxos: ()=>Promise<string[]> = ()=>Wallets.getUtxos();
const decode: (raw:string[])=>Promise<Utxo[]> = raw=>Wallets.buildUtxos(raw);
const stored = Wallets.getWalletDetailsFromStorage();
const assets: Asset[] = [];
void [connect,disable,network,rewards,utxos,decode,stored,assets];
`;
fs.writeFileSync('tmp/prepared/admin-import-boundary.ts',source);
const program = ts.createProgram(['tmp/prepared/admin-import-boundary.ts'], {strict:true,noEmit:true,skipLibCheck:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2016,esModuleInterop:true,moduleResolution:ts.ModuleResolutionKind.NodeJs});
const diagnostics=ts.getPreEmitDiagnostics(program);
assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>process.cwd(),getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));
fs.writeFileSync('tmp/prepared/receipt.json',JSON.stringify({status:'PREPARATION ONLY — NOT PUBLISHED',sourceCandidate:base,originalArchiveGitHead:'UNPROVEN',preparedGitHead:sha,pack,removedTestArtifacts,compilerGraph:'original unchanged yarn.lock; CSL10.2.0',consumerProof:'Targeted actual packed declarations/import-and-call boundary only; NOT full admin compilation or browser/signing acceptance'},null,2)+'\n');
console.log('Prepared exact tested archive and compiled targeted consumer declaration boundary; NOT PUBLISHED');
