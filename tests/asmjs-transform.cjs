// CSL11.5 publishes ESM JavaScript without a package type field. Jest28 cannot
// apply Node's modern syntax detection. Compile only those real dependency
// modules with the already declared TypeScript compiler; never replace their API.
const ts = require('typescript');

module.exports = {
    process(source, filename) {
        return {
            code: ts.transpileModule(source, {
                fileName: filename,
                compilerOptions: {
                    module: ts.ModuleKind.CommonJS,
                    target: ts.ScriptTarget.ES2016,
                    esModuleInterop: true
                }
            }).outputText
        };
    }
};
