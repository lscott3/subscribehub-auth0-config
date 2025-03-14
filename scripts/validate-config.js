/**
 * Auth0 configuration validation script
 *
 * This script performs validation of Auth0 configuration files:
 * - YAML syntax checking
 * - JavaScript syntax checking
 * - Cross-references between files
 * - Required properties validation
 * - Environment-specific validation
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
require('dotenv').config();

// Track validation results
let hasError = false;
let warnings = [];

// Main validation function
async function main() {
  console.log('Auth0 Configuration Validator');
  console.log('=============================');

  // Validate YAML files
  console.log('\nValidating YAML files...');
  validateYamlFiles('./shared');
  validateYamlFiles('./environments');

  // Validate JavaScript files
  console.log('\nValidating JavaScript files...');
  validateJsFiles('./shared/actions');
  validateJsFiles('./shared/rules');

  // Validate cross-references
  console.log('\nValidating cross-references...');
  validateCrossReferences();

  // Validate environments
  console.log('\nValidating environments...');
  validateEnvironments();

  // Validate credentials
  console.log('\nChecking environment credentials...');
  checkEnvironmentCredentials();

  // Print final results
  if (hasError) {
    console.error('\n❌ Validation failed with errors. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ All validations passed successfully!');

    if (warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      warnings.forEach(warning => {
        console.log(`- ${warning}`);
      });
    }
  }
}

// YAML file validation
function validateYamlFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      validateYamlFiles(filePath);
    } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        yaml.load(content);
        console.log(`✓ Valid YAML: ${filePath}`);

        // Check for unresolved placeholders
        checkUnresolvedPlaceholders(content, filePath);
      } catch (error) {
        console.error(`✗ Invalid YAML in ${filePath}: ${error.message}`);
        hasError = true;
      }
    }
  });
}

// JavaScript file validation
function validateJsFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      validateJsFiles(filePath);
    } else if (filePath.endsWith('.js')) {
      try {
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for syntax errors
        new Function(content);
        console.log(`✓ Valid JS: ${filePath}`);

        // Check for console.log that should be console.error
        checkConsoleLogs(content, filePath);
      } catch (error) {
        console.error(`✗ Invalid JS in ${filePath}: ${error.message}`);
        hasError = true;
      }
    }
  });
}

// Check for unresolved placeholders in YAML
function checkUnresolvedPlaceholders(content, filePath) {
  const placeholderRegex = /\{\{([A-Z_]+)\}\}/g;
  let match;

  while ((match = placeholderRegex.exec(content)) !== null) {
    const placeholder = match[1];
    // Check if this placeholder is in .env or will be replaced
    if (!process.env[placeholder]) {
      warnings.push(`Placeholder {{${placeholder}}} in ${filePath} may not be replaced during deployment`);
    }
  }
}

// Check for console.log that should be console.error
function checkConsoleLogs(content, filePath) {
  const errorLogRegex = /console\.log\(['"](Error|error|ERROR|Failed|failed|FAILED|Exception|exception|EXCEPTION)/g;

  if (errorLogRegex.test(content)) {
    warnings.push(`${filePath} contains console.log for errors. Consider using console.error instead.`);
  }
}

// Validate cross-references between files
function validateCrossReferences() {
  try {
    // Check client references in connections
    validateConnectionClientReferences();

    // Check role references in permissions
    validateRolePermissionReferences();
  } catch (error) {
    console.error(`Error validating cross-references: ${error.message}`);
    hasError = true;
  }
}

// Validate client references in connections
function validateConnectionClientReferences() {
  // Get all clients
  const clientsDir = './shared/clients';
  if (!fs.existsSync(clientsDir)) {
    return;
  }

  const clientFiles = fs.readdirSync(clientsDir)
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

  const clientNames = clientFiles.map(file => {
    const content = fs.readFileSync(path.join(clientsDir, file), 'utf8');
    const config = yaml.load(content);
    return config.name;
  });

  // Check connections for client references
  const connectionsDir = './shared/connections';
  if (!fs.existsSync(connectionsDir)) {
    return;
  }

  const connectionFiles = fs.readdirSync(connectionsDir)
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

  connectionFiles.forEach(file => {
    const filePath = path.join(connectionsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const config = yaml.load(content);

    if (config.enabled_clients && Array.isArray(config.enabled_clients)) {
      config.enabled_clients.forEach(clientName => {
        if (!clientNames.includes(clientName)) {
          warnings.push(`Connection ${config.name} references unknown client: ${clientName}`);
        }
      });
    }
  });
}

// Validate role references in permissions
function validateRolePermissionReferences() {
  // Get all roles
  const rolesDir = './shared/roles';
  if (!fs.existsSync(rolesDir)) {
    return;
  }

  const roleFiles = fs.readdirSync(rolesDir)
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

  const roleNames = roleFiles.map(file => {
    const content = fs.readFileSync(path.join(rolesDir, file), 'utf8');
    const config = yaml.load(content);
    return config.name;
  });

  // Check role-permissions for role references
  const permissionsFile = './shared/permissions/role-permissions.yaml';
  if (!fs.existsSync(permissionsFile)) {
    return;
  }

  const content = fs.readFileSync(permissionsFile, 'utf8');
  const config = yaml.load(content);

  if (Array.isArray(config)) {
    config.forEach(roleMapping => {
      if (roleMapping.role && !roleNames.includes(roleMapping.role)) {
        warnings.push(`Permission mapping references unknown role: ${roleMapping.role}`);
      }
    });
  }
}

// Validate environment configurations
function validateEnvironments() {
  const envDir = './environments';
  if (!fs.existsSync(envDir)) {
    console.error('Environments directory not found');
    hasError = true;
    return;
  }

  const envDirs = fs.readdirSync(envDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  envDirs.forEach(env => {
    const tenantFile = path.join(envDir, env, 'tenant.yaml');

    if (!fs.existsSync(tenantFile)) {
      console.error(`✗ Environment ${env} is missing tenant.yaml`);
      hasError = true;
      return;
    }

    try {
      const content = fs.readFileSync(tenantFile, 'utf8');
      const config = yaml.load(content);

      // Check required properties
      const requiredProps = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'];

      requiredProps.forEach(prop => {
        if (!config[prop]) {
          console.error(`✗ Environment ${env} is missing ${prop} in tenant.yaml`);
          hasError = true;
        }
      });

      console.log(`✓ Valid environment config: ${env}`);
    } catch (error) {
      console.error(`✗ Invalid tenant.yaml in ${env}: ${error.message}`);
      hasError = true;
    }
  });
}

// Check if environment credentials are set
function checkEnvironmentCredentials() {
  // Check .env file exists
  if (!fs.existsSync('.env')) {
    warnings.push('.env file not found. Credentials may not be set.');
    return;
  }

  // Check credentials for each environment
  ['DEV', 'STAGING', 'PROD'].forEach(env => {
    const clientId = process.env[`${env}_CLIENT_ID`];
    const clientSecret = process.env[`${env}_CLIENT_SECRET`];

    if (!clientId) {
      warnings.push(`${env}_CLIENT_ID is not set in .env file`);
    }

    if (!clientSecret) {
      warnings.push(`${env}_CLIENT_SECRET is not set in .env file`);
    }
  });
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
