#!/usr/bin/env node

/**
 * Script untuk switch environment (local/production)
 * Usage: node scripts/switch-env.js [local|production]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFiles = {
  local: {
    VITE_API_URL: 'http://127.0.0.1:8000',
    VITE_ENV: 'local'
  },
  live: {
    VITE_API_URL: 'http://103.164.99.2:1101',
    VITE_ENV: 'local'
  },
  production: {
    VITE_API_URL: '/api',
    VITE_ENV: 'production'
  }
};

function switchEnvironment(env) {
  if (!envFiles[env]) {
    console.error(`❌ Environment "${env}" tidak valid!`);
    console.log('Gunakan: local, live, atau production');
    process.exit(1);
  }

  const envPath = path.join(__dirname, '..', '.env');
  const envContent = Object.entries(envFiles[env])
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n';

  try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`✅ Environment switched to: ${env.toUpperCase()}`);
    console.log(`📝 API URL: ${envFiles[env].VITE_API_URL}`);
    console.log(`\n💡 Restart dev server dengan: npm run dev`);
  } catch (error) {
    console.error(`❌ Error writing .env file: ${error.message}`);
    process.exit(1);
  }
}

// Get environment from command line argument
const env = process.argv[2];

if (!env) {
  console.log('🔧 Environment Switcher');
  console.log('=====================\n');
  console.log('Usage: node scripts/switch-env.js [local|live|production]\n');
  console.log('Atau gunakan npm scripts:');
  console.log('  npm run dev:local      - Frontend Local -> Backend Local (localhost:8000)');
  console.log('  npm run dev:live       - Frontend Local -> Backend Server (103.164.99.2)');
  console.log('  npm run dev:prod       - Simulasi Production (via Proxy)\n');
  
  // Check current environment
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const currentEnv = fs.readFileSync(envPath, 'utf8');
    const match = currentEnv.match(/VITE_ENV=(.+)/);
    if (match) {
      console.log(`Current environment: ${match[1].toUpperCase()}`);
    }
  }
  process.exit(0);
}

switchEnvironment(env);

