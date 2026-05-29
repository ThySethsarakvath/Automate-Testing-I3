#!/usr/bin/env node
/**
 * run-jmeter.js
 * Runs JMeter headlessly:  jmeter -n -t plan.jmx -l results.jtl
 * Resolves the jmeter binary from ./tools/ first, then falls back to PATH.
 */
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const ROOT        = path.join(__dirname, '..');
const JMETER_VER  = '5.6.3';
const LOCAL_BIN   = path.join(
  ROOT, 'tools', `apache-jmeter-${JMETER_VER}`, 'bin',
  os.platform() === 'win32' ? 'jmeter.bat' : 'jmeter'
);
const PLAN_FILE   = path.join(ROOT, 'plan.jmx');
const RESULT_FILE = path.join(ROOT, 'results.jtl');

// Pick binary
let jmeterBin = LOCAL_BIN;
if (!fs.existsSync(LOCAL_BIN)) {
  console.warn(`⚠️  Local JMeter not found at ${LOCAL_BIN}`);
  console.warn('    Falling back to system "jmeter" — run `npm run jmeter:install` first.');
  jmeterBin = 'jmeter';
}

if (!fs.existsSync(PLAN_FILE)) {
  console.error(`❌  Test plan not found: ${PLAN_FILE}`);
  process.exit(1);
}

// Remove stale results
if (fs.existsSync(RESULT_FILE)) fs.unlinkSync(RESULT_FILE);

console.log('🚀  Starting JMeter headless run …');
console.log(`    Plan   : ${PLAN_FILE}`);
console.log(`    Results: ${RESULT_FILE}`);
console.log(`    Binary : ${jmeterBin}\n`);

let spawnCmd, spawnArgs, spawnOpts;

if (os.platform() === 'win32') {
  // On Windows with cmd.exe, construct a proper command string
  spawnCmd = `"${jmeterBin}" -n -t "${PLAN_FILE}" -l "${RESULT_FILE}"`;
  spawnArgs = [];
  spawnOpts = {
    stdio: 'inherit',
    shell: true,
  };
} else {
  // On Unix, pass command and arguments separately
  spawnCmd = jmeterBin;
  spawnArgs = ['-n', '-t', PLAN_FILE, '-l', RESULT_FILE];
  spawnOpts = {
    stdio: 'inherit',
    shell: false,
  };
}

const result = spawnSync(spawnCmd, spawnArgs, spawnOpts);

if (result.error) {
  console.error('❌  Failed to launch JMeter:', result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`❌  JMeter exited with code ${result.status}`);
  process.exit(result.status);
}

console.log('\n✅  JMeter run complete. Results written to results.jtl');
console.log('    Run `npm run jmeter:report` to generate the HTML dashboard.');
