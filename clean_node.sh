#!/bin/sh
echo "########## DELETE CACHE                ##########"
rm -rf package-lock.json node_modules
echo "########## GENERATE [package-lock]     ##########"
npm i --package-lock-only
echo "########## INSTALL DEPENDENCIES        ##########"
npm clean-install
echo "########## INSTALL UPDATE DEPENDENCIES ##########"
npm outdated
npm update --save
npm audit fix --force
echo "########## TEST                        ##########"
npm test
echo "########## DONE                        ##########"
