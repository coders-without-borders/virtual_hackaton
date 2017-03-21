#!/bin/bash
export PWD=$(pwd)
mongod --dbpath=$PWD --port 1111 &
nodemon $PWD/main.js
