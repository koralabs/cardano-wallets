#!/usr/bin/env bash
# Local test run recorded by adahandle-deployments/common/test-evidence.sh (replaces the old Actions tests).
set -euo pipefail
( set -e; npm install --global yarn@1.22.22 )
( set -e; yarn install --frozen-lockfile )
( set -e; yarn build )
( set -e; yarn test --runInBand )
