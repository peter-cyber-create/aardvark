import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function validateEnvironmentVariables() {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

function validateDatabaseConnection() {
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  } catch (error) {
    throw new Error('Database connection validation failed');
  }
}

function validateTypecheck() {
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
  } catch (error) {
    throw new Error('TypeScript validation failed');
  }
}

function validateBuild() {
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    throw new Error('Build validation failed');
  }
}

async function main() {
  try {
    console.log('🔍 Validating environment variables...');
    validateEnvironmentVariables();

    console.log('🔍 Validating database connection...');
    validateDatabaseConnection();

    console.log('🔍 Running type check...');
    validateTypecheck();

    console.log('🔍 Validating build...');
    validateBuild();

    console.log('✅ All validations passed!');
    process.exit(0);
  } catch (error: unknown) {
    console.error('❌ Validation failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
