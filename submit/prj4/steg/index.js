#!/usr/bin/env nodejs

'use strict';

const assert = require('assert');
const process = require('process');

//const StegWs = require('./steg-ws');
const StegWs = require('./steg.js');

function usage() {
  console.error(`usage: ${process.argv[1]} PORT WS_BASE_URL`);
  process.exit(1);
}

function getPort(portArg) {
  let port = Number(portArg);
  if (!port) usage();
  return port;
}

const BASE = '/api';

async function go(args) {
  try {
    const port = getPort(args[0]);
    const wsBaseUrl = args[1];
    //const userWs = new UserWs(wsBaseUrl);
    StegWs(port, BASE, wsBaseUrl);
  }
  catch (err) {
    console.error(err);
  }
}
    

if (process.argv.length != 4) usage();
go(process.argv.slice(2));
