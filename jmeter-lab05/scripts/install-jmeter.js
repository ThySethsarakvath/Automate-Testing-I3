#!/usr/bin/env node
/**
 * install-jmeter.js
 * Downloads Apache JMeter 5.6.3 into ./tools/ if not already present.
 * Works on Windows, macOS, and Linux.
 */
'use strict';

const https    = require('https');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const { execSync } = require('child_process');

const JMETER_VERSION = '5.6.3';
const JMETER_URL =
  `https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.zip`;
const TOOLS_DIR  = path.join(__dirname, '..', 'tools');
const ZIP_PATH   = path.join(TOOLS_DIR, `apache-jmeter-${JMETER_VERSION}.zip`);
const JMETER_DIR = path.join(TOOLS_DIR, `apache-jmeter-${JMETER_VERSION}`);

if (fs.existsSync(JMETER_DIR)) {
  console.log(`✅  JMeter ${JMETER_VERSION} already installed at ${JMETER_DIR}`);
  process.exit(0);
}

fs.mkdirSync(TOOLS_DIR, { recursive: true });

console.log(`⬇️   Downloading JMeter ${JMETER_VERSION} …`);

function download(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  const req = https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      file.close(() => {
        try { fs.unlinkSync(dest); } catch (_) {}
        download(res.headers.location, dest, cb);
      });
      return;
    }
    if (res.statusCode !== 200) {
      file.close(() => {
        try { fs.unlinkSync(dest); } catch (_) {}
        cb(new Error(`HTTP ${res.statusCode}`));
      });
      return;
    }
    const total = parseInt(res.headers['content-length'] || '0', 10);
    let received = 0;
    res.on('data', (chunk) => {
      received += chunk.length;
      if (total) {
        const pct = ((received / total) * 100).toFixed(1);
        process.stdout.write(`\r    ${pct}%`);
      }
    });
    res.pipe(file);
    // Use 'close' (not 'finish') — guarantees the OS has flushed and closed the fd
    file.on('close', () => {
      process.stdout.write('\n');
      cb(null);
    });
    file.on('error', (e) => {
      file.close(() => {
        try { fs.unlinkSync(dest); } catch (_) {}
        cb(e);
      });
    });
  });
  req.on('error', (e) => {
    file.close(() => {
      try { fs.unlinkSync(dest); } catch (_) {}
      cb(e);
    });
  });
}

download(JMETER_URL, ZIP_PATH, (err) => {
  if (err) { console.error('Download failed:', err.message); process.exit(1); }

  console.log('📦  Extracting …');

  // Small delay on Windows to ensure the file handle is fully released
  // before PowerShell tries to open it for extraction.
  const extract = () => {
    if (os.platform() === 'win32') {
      // Use single quotes inside the PowerShell string to avoid path issues
      const ps = `Expand-Archive -LiteralPath '${ZIP_PATH}' -DestinationPath '${TOOLS_DIR}' -Force`;
      execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'inherit' });
    } else {
      execSync(`unzip -q "${ZIP_PATH}" -d "${TOOLS_DIR}"`, { stdio: 'inherit' });
    }

    // Cleanup zip after extraction
    try { fs.unlinkSync(ZIP_PATH); } catch (_) {}
    console.log(`✅  JMeter ${JMETER_VERSION} installed at ${JMETER_DIR}`);
  };

  // Wait 500ms on Windows for OS to release the file handle
  if (os.platform() === 'win32') {
    setTimeout(extract, 500);
  } else {
    extract();
  }
});
