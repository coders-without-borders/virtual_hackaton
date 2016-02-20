#!/bin/bash
STR=$(npm ls grunt | grep -c grunt)
if [ "$STR" = "0" ]; then
    npm install -g grunt
fi

mkdir node_modules
npm install
cd node_modules/phaser
npm install
grunt arcadephysics
cd ../../
