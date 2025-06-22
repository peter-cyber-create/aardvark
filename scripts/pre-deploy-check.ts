import { execSync } from 'child_process';
import chalk from 'chalk';

async function runChecks() {
  const checks = [
    {
      name: 'MongoDB Connection',
      command: 'npm run test:mongo',
    },
    {
      name: 'Type Check',
      command: 'npm run check-types',
    },
    {
      name: 'Linting',
      command: 'npm run lint',
    },
    {
      name: 'Build Analysis',
      command: 'npm run analyze',
    },
    {
      name: 'Deployment Validation',
      command: 'ts-node scripts/validate-deployment.ts',
    },
  ];

  console.log(chalk.blue('🚀 Starting pre-deployment checks...\n'));

  for (const check of checks) {
    try {
      console.log(chalk.yellow(`Running ${check.name}...`));
      execSync(check.command, { stdio: 'inherit' });
      console.log(chalk.green(`✅ ${check.name} passed\n`));
    } catch (error) {
      console.error(chalk.red(`❌ ${check.name} failed`));
      console.error(error);
      process.exit(1);
    }
  }

  console.log(chalk.green('🎉 All pre-deployment checks passed!'));
}

runChecks().catch(error => {
  console.error(chalk.red('Pre-deployment checks failed:'), error);
  process.exit(1);
});
