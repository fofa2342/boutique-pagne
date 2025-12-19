#!/usr/bin/env node

/**
 * Hash a password for manual user creation
 * Usage: node scripts/hash-password.js [password]
 */

import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function hashPassword(password) {
  if (!password || password.length < 12) {
    console.error('\n[ERROR] Password must be at least 12 characters long\n');
    process.exit(1);
  }

  console.log('\n[INFO] Hashing password...\n');
  
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Password hash:');
  console.log(hash);
  console.log('\nUse this in SQL INSERT:');
  console.log(`INSERT INTO users (username, password, role, status) VALUES ('admin', '${hash}', 'superadmin', 'active');\n`);
}

// Get password from command line or prompt
const password = process.argv[2];

if (password) {
  hashPassword(password).then(() => process.exit(0));
} else {
  rl.question('Enter password to hash: ', (answer) => {
    rl.close();
    hashPassword(answer).then(() => process.exit(0));
  });
}
