#!/bin/sh
set -e
echo "########## SETUP NODE (via nvm)        ##########"
nvm install 16 || true
echo "########## DELETE CACHE                ##########"
rm -rf package-lock.json node_modules
echo "########## GENERATE [package-lock]     ##########"
npm i --package-lock-only
echo "########## INSTALL DEPENDENCIES        ##########"
npm clean-install
echo "########## INSTALL UPDATE DEPENDENCIES ##########"
npm outdated || true
npm update --save
npm audit fix --force
echo "########## BUILD                       ##########"
tsc
echo "########## TEST                        ##########"
npm test
echo "########## DONE                        ##########"
