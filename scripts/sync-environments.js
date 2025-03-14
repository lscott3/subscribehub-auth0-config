/**
 * Environment sync tool for Auth0 configurations
 *
 * This script helps synchronize configurations between Auth0 environments
 * It exports from a source environment and imports to a target environment
 * with appropriate transformations and safety checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const inquirer = require('inquirer');
require('dotenv').config();

// Configuration paths
const EXPORT_PATH_PREFIX = './export-';
const ENV_CONFIG_PATH = './environments';

// Environment names
const ENVIRONMENTS = ['dev', 'staging', 'prod'];

// Entities that should NOT be synced between environments
const EXCLUDE_ENTITIES = [
  'tenant-settings',
  'email-provider',
  'guardian',
  'test-users'
];

async function main() {
  console.log('Auth0 Environment Sync Tool');
  console.log('===========================');

  try {
    // 1. Get source and target environments
    const { sourceEnv, targetEnv } = await promptEnvironments();

    if (sourceEnv === targetEnv) {
      console.error('❌ Source and target environments cannot be the same!');
      process.exit(1);
    }

    // 2. Confirm the sync direction
    await confirmSync(sourceEnv, targetEnv);

    // 3. Export source environment
    console.log(`\n🔄 Exporting configuration from ${sourceEnv}...`);
    execSync(`npm run export:${sourceEnv}`, { stdio: 'inherit' });

    const exportPath = `${EXPORT_PATH_PREFIX}${sourceEnv}`;

    if (!fs.existsSync(exportPath)) {
      console.error(`❌ Export failed! No export directory found at ${exportPath}`);
      process.exit(1);
    }

    // 4. Create a temp directory for processed files
    const tempDir = `./temp-sync-${Date.now()}`;
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // 5. Process exported files
    console.log(`\n🔄 Processing exported files...`);
    processExportedFiles(exportPath, tempDir, sourceEnv, targetEnv);

    // 6. Import to target environment
    console.log(`\n🔄 Importing configuration to ${targetEnv}...`);
    execSync(`a0deploy import --config_file ./environments/${targetEnv}/tenant.yaml --input_file ${tempDir}`, { stdio: 'inherit' });

    // 7. Run permissions script for target environment
    console.log(`\n🔄 Assigning permissions in ${targetEnv}...`);
    execSync(`npm run permissions:${targetEnv}`, { stdio: 'inherit' });

    // 8. Clean up temp directory
    console.log(`\n🔄 Cleaning up temporary files...`);
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log(`\n✅ Successfully synchronized configuration from ${sourceEnv} to ${targetEnv}!`);
  } catch (error) {
    console.error(`\n❌ Sync failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

async function promptEnvironments() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'sourceEnv',
      message: 'Select source environment:',
      choices: ENVIRONMENTS
    },
    {
      type: 'list',
      name: 'targetEnv',
      message: 'Select target environment:',
      choices: ENVIRONMENTS
    }
  ]);

  return answers;
}

async function confirmSync(sourceEnv, targetEnv) {
  console.log('\n⚠️  WARNING ⚠️');
  console.log(`You are about to synchronize Auth0 configuration from ${sourceEnv} to ${targetEnv}.`);
  console.log('This will overwrite configurations in the target environment.');

  if (targetEnv === 'prod') {
    console.log('\n🔴 CAUTION: You are targeting the PRODUCTION environment! 🔴');
    console.log('This operation can affect live users and services.');
  }

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Are you sure you want to proceed?`,
      default: false
    }
  ]);

  if (!confirmed) {
    console.log('Sync operation cancelled.');
    process.exit(0);
  }
}

function processExportedFiles(sourcePath, targetPath, sourceEnv, targetEnv) {
  // Get source tenant details
  const sourceEnvConfig = yaml.load(
    fs.readFileSync(path.join(ENV_CONFIG_PATH, sourceEnv, 'tenant.yaml'), 'utf8')
  );

  // Get target tenant details
  const targetEnvConfig = yaml.load(
    fs.readFileSync(path.join(ENV_CONFIG_PATH, targetEnv, 'tenant.yaml'), 'utf8')
  );

  // Get all directories in the export
  const directories = fs.readdirSync(sourcePath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // Copy and transform each directory
  directories.forEach(dir => {
    // Skip excluded entities
    if (EXCLUDE_ENTITIES.includes(dir)) {
      console.log(`Skipping ${dir} (excluded from sync)`);
      return;
    }

    const sourceDir = path.join(sourcePath, dir);
    const targetDir = path.join(targetPath, dir);

    // Create target directory
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copy and transform each file
    const files = fs.readdirSync(sourceDir);

    files.forEach(file => {
      const sourcefile = path.join(sourceDir, file);
      const targetFile = path.join(targetDir, file);

      // Read file content
      let content = fs.readFileSync(sourcefile, 'utf8');

      // Replace source domain with target domain
      if (sourceEnvConfig.AUTH0_DOMAIN && targetEnvConfig.AUTH0_DOMAIN) {
        content = content.replace(
          new RegExp(sourceEnvConfig.AUTH0_DOMAIN, 'g'), 
          targetEnvConfig.AUTH0_DOMAIN
        );
      }

      // Replace source domain name with target domain name
      if (process.env[`${sourceEnv.toUpperCase()}_DOMAIN_NAME`] &&
          process.env[`${targetEnv.toUpperCase()}_DOMAIN_NAME`]) {
        content = content.replace(
          new RegExp(process.env[`${sourceEnv.toUpperCase()}_DOMAIN_NAME`], 'g'),
          process.env[`${targetEnv.toUpperCase()}_DOMAIN_NAME`]
        );
      }

      // Write transformed content
      fs.writeFileSync(targetFile, content);
      console.log(`Processed: ${file}`);
    });
  });
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
