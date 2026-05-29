#!/usr/bin/env node
/**
 * report-jmeter.js
 * Generates the HTML dashboard from results.jtl:
 *   jmeter -g results.jtl -o jmeter-report
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
const RESULT_FILE  = path.join(ROOT, 'results.jtl');
const REPORT_DIR   = path.join(ROOT, 'jmeter-report');

let jmeterBin = LOCAL_BIN;
if (!fs.existsSync(LOCAL_BIN)) {
  jmeterBin = 'jmeter';
}

if (!fs.existsSync(RESULT_FILE)) {
  console.error(`❌  results.jtl not found. Run \`npm run jmeter:run\` first.`);
  process.exit(1);
}

// JMeter refuses to overwrite an existing report directory
if (fs.existsSync(REPORT_DIR)) {
  fs.rmSync(REPORT_DIR, { recursive: true, force: true });
}

console.log('📊  Generating HTML report …');
let spawnCmd, spawnArgs, spawnOpts;

if (os.platform() === 'win32') {
  // On Windows with cmd.exe, construct a proper command string
  spawnCmd = `"${jmeterBin}" -g "${RESULT_FILE}" -o "${REPORT_DIR}"`;
  spawnArgs = [];
  spawnOpts = {
    stdio: 'inherit',
    shell: true,
  };
} else {
  // On Unix, pass command and arguments separately
  spawnCmd = jmeterBin;
  spawnArgs = ['-g', RESULT_FILE, '-o', REPORT_DIR];
  spawnOpts = {
    stdio: 'inherit',
    shell: false,
  };
}

const result = spawnSync(spawnCmd, spawnArgs, spawnOpts);

if (result.error || result.status !== 0) {
  console.error('❌  Report generation failed.');
  process.exit(result.status || 1);
}

console.log(`\n✅  Report generated at ${REPORT_DIR}/index.html`);
