#!/usr/bin/env node
/**
 * Parses integration test output and updates docs/status.json.
 *
 * Usage: node update-status.js <package-name> <output-file> <exit-code> <run-id>
 *
 * Handles two output formats:
 *   - ons-api:      sections with "  ✓ " / "  ✗ " lines
 *   - statcan-wds:  "✅ name" / "❌ name" summary lines
 */

const fs = require('fs');
const path = require('path');

const [, , packageName, outputFile, exitCodeStr, runId] = process.argv;

if (!packageName || !outputFile || !runId) {
  console.error('Usage: update-status.js <package> <output-file> <exit-code> <run-id>');
  process.exit(1);
}

const raw = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, 'utf8') : '';
const lines = raw.split('\n');

let passed = 0;
let failed = 0;
const sections = {};

// Detect format by presence of ons-api style markers
const isOnsFormat = raw.includes('  ✓ ') || raw.includes('  ✗ ');

if (isOnsFormat) {
  // ONS API format: section headers followed by a line of dashes
  let currentSection = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] ?? '';
    if (next.match(/^-+$/) && line.trim().length > 0) {
      currentSection = line.trim();
      sections[currentSection] = { passed: 0, failed: 0 };
    } else if (line.includes('  ✓ ') && currentSection) {
      sections[currentSection].passed++;
      passed++;
    } else if (line.includes('  ✗ ') && currentSection) {
      sections[currentSection].failed++;
      failed++;
    }
  }
} else {
  // StatCan format: parse the summary block after "--- Summary ---"
  const summaryIdx = lines.findIndex(l => l.includes('--- Summary ---'));
  const summaryLines = summaryIdx !== -1 ? lines.slice(summaryIdx + 1) : lines;
  for (const line of summaryLines) {
    if (line.startsWith('✅ ')) {
      const name = line.slice(2).trim();
      if (name) { sections[name] = { passed: 1, failed: 0 }; passed++; }
    } else if (line.startsWith('❌ ')) {
      const name = line.slice(2).trim();
      if (name) { sections[name] = { passed: 0, failed: 1 }; failed++; }
    }
  }
}

const total = passed + failed;
const exitCode = parseInt(exitCodeStr ?? '1', 10);
const status = exitCode === 0 && total > 0 ? 'passing' : total === 0 ? 'unknown' : 'failing';

const statusPath = path.join(__dirname, '../../docs/status.json');
let existing = {};
try { existing = JSON.parse(fs.readFileSync(statusPath, 'utf8')); } catch {}

existing[packageName] = {
  status,
  last_checked: new Date().toISOString(),
  total,
  passed,
  failed,
  run_url: `https://github.com/varve-ca/agency-sdks/actions/runs/${runId}`,
  sections,
};

fs.mkdirSync(path.dirname(statusPath), { recursive: true });
fs.writeFileSync(statusPath, JSON.stringify(existing, null, 2) + '\n');
console.log(`Updated ${packageName}: ${status} (${passed}/${total} passed)`);
