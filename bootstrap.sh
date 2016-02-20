#!/bin/bash
STR=$(npm list -g --depth=0 | grep -c grunt-cli)
if [ "$STR" = "0" ]; then
    npm install -g grunt-cli
fi

mkdir node_modules
npm install
cd node_modules/phaser
npm install
grunt arcadephysics
cd ../../
