#!/usr/bin/env node

/**
 * Generate a secure random session secret
 * Usage: node scripts/generate-secret.js
 */

import crypto from 'crypto';

console.log('\n[INFO] Generating secure session secret...\n');

const secret = crypto.randomBytes(64).toString('hex');

console.log('Add this to your .env file:\n');
console.log(`SESSION_SECRET=${secret}\n`);

console.log('[WARNING]  Important:');
console.log('- Never commit this secret to version control');
console.log('- Use a different secret for each environment');
console.log('- Rotate secrets periodically for security\n');
