#!/usr/bin/env node

/**
 * Security Check Script
 * Scans codebase for remaining security issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}🔒 Security Check - ThreeLanes Kanban App${RESET}\n`);

let issuesFound = 0;
let warnings = 0;

// Check 1: Look for console.log statements
console.log(`${BLUE}[1/5]${RESET} Checking for console.log statements...`);
try {
  const result = execSync('git grep -n "console\\." -- "*.ts" "*.tsx" ":(exclude)*.test.tsx" ":(exclude)node_modules" ":(exclude)scripts"', { encoding: 'utf8' });
  const lines = result.trim().split('\n').filter(line => !line.includes('// eslint-disable'));
  
  if (lines.length > 0) {
    console.log(`${RED}✗ Found ${lines.length} console statements:${RESET}`);
    lines.slice(0, 5).forEach(line => console.log(`  ${YELLOW}${line}${RESET}`));
    if (lines.length > 5) {
      console.log(`  ${YELLOW}... and ${lines.length - 5} more${RESET}`);
    }
    issuesFound += lines.length;
  } else {
    console.log(`${GREEN}✓ No console statements found${RESET}`);
  }
} catch (e) {
  console.log(`${GREEN}✓ No console statements found${RESET}`);
}

// Check 2: Verify security files exist
console.log(`\n${BLUE}[2/5]${RESET} Checking for security utilities...`);
const requiredFiles = [
  'lib/validation.ts',
  'lib/rate-limit.ts',
  'lib/logger.ts',
  'middleware.ts',
  'SECURITY.md'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`${GREEN}✓${RESET} ${file}`);
  } else {
    console.log(`${RED}✗${RESET} ${file} ${RED}MISSING${RESET}`);
    issuesFound++;
    allFilesExist = false;
  }
});

// Check 3: Verify .gitignore includes .env files
console.log(`\n${BLUE}[3/5]${RESET} Checking .gitignore...`);
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('.env')) {
    console.log(`${GREEN}✓ .env files are ignored${RESET}`);
  } else {
    console.log(`${RED}✗ .env files are NOT ignored${RESET}`);
    issuesFound++;
  }
} catch (e) {
  console.log(`${RED}✗ .gitignore not found${RESET}`);
  issuesFound++;
}

// Check 4: Check for hardcoded secrets
console.log(`\n${BLUE}[4/5]${RESET} Checking for hardcoded secrets...`);
try {
  const secretPatterns = [
    'password.*=.*["\'].*["\']',
    'api[_-]?key.*=.*["\'].*["\']',
    'secret.*=.*["\'].*["\']',
  ];
  
  let secretsFound = false;
  secretPatterns.forEach(pattern => {
    try {
      execSync(`git grep -i -E "${pattern}" -- "*.ts" "*.tsx" ":(exclude)*.test.tsx" ":(exclude)node_modules"`, { encoding: 'utf8' });
      secretsFound = true;
    } catch (e) {
      // No match found (good)
    }
  });
  
  if (secretsFound) {
    console.log(`${YELLOW}⚠ Potential hardcoded secrets found - please review${RESET}`);
    warnings++;
  } else {
    console.log(`${GREEN}✓ No obvious hardcoded secrets${RESET}`);
  }
} catch (e) {
  console.log(`${GREEN}✓ No obvious hardcoded secrets${RESET}`);
}

// Check 5: npm audit
console.log(`\n${BLUE}[5/5]${RESET} Running npm audit...`);
try {
  execSync('pnpm audit --json > /dev/null 2>&1');
  console.log(`${GREEN}✓ No vulnerabilities found${RESET}`);
} catch (e) {
  console.log(`${YELLOW}⚠ Vulnerabilities found - run 'pnpm audit' for details${RESET}`);
  warnings++;
}

// Summary
console.log(`\n${BLUE}═══════════════════════════════════════${RESET}`);
console.log(`${BLUE}Summary${RESET}\n`);

if (issuesFound === 0 && warnings === 0) {
  console.log(`${GREEN}✓ All security checks passed!${RESET}`);
  console.log(`${GREEN}Your app is ready for production 🚀${RESET}\n`);
  process.exit(0);
} else {
  if (issuesFound > 0) {
    console.log(`${RED}✗ ${issuesFound} issue(s) found${RESET}`);
  }
  if (warnings > 0) {
    console.log(`${YELLOW}⚠ ${warnings} warning(s)${RESET}`);
  }
  
  console.log(`\n${YELLOW}Please fix these issues before deploying to production.${RESET}\n`);
  process.exit(1);
}
