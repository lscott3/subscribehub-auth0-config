require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const environment = process.argv[2] || 'dev';
const action = process.argv[3] || 'import';

const configs = {
  dev: {
    domain: 'dev-efeterilw46thdwo.us.auth0.com',
    clientId: process.env.DEV_CLIENT_ID,
    clientSecret: process.env.DEV_CLIENT_SECRET
  },
  staging: {
    domain: 'staging-subscribehub.us.auth0.com',
    clientId: process.env.STAGING_CLIENT_ID,
    clientSecret: process.env.STAGING_CLIENT_SECRET
  },
  prod: {
    domain: 'subscribehub.us.auth0.com',
    clientId: process.env.PROD_CLIENT_ID,
    clientSecret: process.env.PROD_CLIENT_SECRET
  }
};

const config = configs[environment];
if (!config) {
  console.error(`Invalid environment: ${environment}`);
  process.exit(1);
}

if (!config.clientId || !config.clientSecret) {
  console.error(`Missing credentials for ${environment} environment`);
  process.exit(1);
}

// Debug information
console.log('=== Debug Information ===');
console.log('Current working directory:', process.cwd());
console.log('Environment:', environment);
console.log('Action:', action);
console.log('Domain:', config.domain);
console.log('Client ID exists:', !!config.clientId);
console.log('Client Secret exists:', !!config.clientSecret);

// Function to read and parse YAML files
function readYamlFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = yaml.load(content);
    return parsed;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Function to copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
      const content = readYamlFile(srcPath);
      if (content) {
        fs.writeFileSync(
          destPath.replace(/\.ya?ml$/, '.json'),
          JSON.stringify(content, null, 2)
        );
      }
    }
  }
}

// Create temporary directory for deployment
const tempDir = './temp-deploy';
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// Copy and convert YAML files to JSON
console.log('\n=== Converting Configuration Files ===');
const directories = [
  'clients',
  'resource-servers',
  'roles',
  'connections',
  'tenant-settings'
];

directories.forEach(dir => {
  const srcDir = path.join('./shared', dir);
  const destDir = path.join(tempDir, dir);
  if (fs.existsSync(srcDir)) {
    console.log(`Processing ${dir}...`);
    copyDirectory(srcDir, destDir);
  }
});

// Create deploy configuration
const tempConfig = {
  AUTH0_DOMAIN: config.domain,
  AUTH0_CLIENT_ID: config.clientId,
  AUTH0_CLIENT_SECRET: config.clientSecret,
  AUTH0_ALLOW_DELETE: true,
  AUTH0_FORCE: true,
  AUTH0_KEYWORD_REPLACE_MAPPINGS: {
    "##DOMAIN_NAME##": process.env.DOMAIN_NAME || "localhost:3000",
    "##EXTENSION_ID##": process.env.EXTENSION_ID || "extension-id",
    "##GOOGLE_CLIENT_ID##": process.env.GOOGLE_CLIENT_ID || "",
    "##GOOGLE_CLIENT_SECRET##": process.env.GOOGLE_CLIENT_SECRET || "",
    "##FACEBOOK_CLIENT_ID##": process.env.FACEBOOK_CLIENT_ID || "",
    "##FACEBOOK_CLIENT_SECRET##": process.env.FACEBOOK_CLIENT_SECRET || "",
    "##TWITTER_CLIENT_ID##": process.env.TWITTER_CLIENT_ID || "",
    "##TWITTER_CLIENT_SECRET##": process.env.TWITTER_CLIENT_SECRET || ""
  },
  AUTH0_DEBUG: true,
  AUTH0_VERBOSE: true,
  AUTH0_IMPORT_MODE: true,
  AUTH0_EXCLUDED_CLIENTS: [],
  AUTH0_EXCLUDED_RESOURCE_SERVERS: [],
  AUTH0_INCLUDED_PROPS: {
    clients: ["client_secret"]
  }
};

console.log('\n=== Deploy Configuration ===');
console.log('Config:', JSON.stringify({ ...tempConfig, AUTH0_CLIENT_SECRET: '****' }, null, 2));

// Write config file
fs.writeFileSync(
  path.join(tempDir, 'config.json'),
  JSON.stringify(tempConfig, null, 2)
);

const command = `AUTH0_DOMAIN=${config.domain} AUTH0_CLIENT_ID=${config.clientId} AUTH0_CLIENT_SECRET=${config.clientSecret} a0deploy ${action} --config_file ${path.join(tempDir, 'config.json')} --input_file ${tempDir} --debug`;

try {
  console.log('\n=== Starting Deployment ===');
  console.log('Running command (secrets redacted):', command.replace(config.clientSecret, '****'));

  execSync(command, { stdio: 'inherit' });

  console.log('\n=== Deployment Completed Successfully ===');
} catch (error) {
  console.error('\n=== Deployment Failed ===');
  console.error('Error:', error.message);
  if (error.stdout) console.log('stdout:', error.stdout.toString());
  if (error.stderr) console.error('stderr:', error.stderr.toString());
} finally {
  // Clean up
  fs.rmSync(tempDir, { recursive: true, force: true });
}