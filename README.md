# SubscribeHub Auth0 Configuration

This repository contains Auth0 configuration for the SubscribeHub application, managed using the Auth0 Deploy CLI.

## Structure

- **environments/** - Environment-specific configurations
  - **dev/** - Development environment configuration
  - **staging/** - Staging environment configuration
  - **production/** - Production environment configuration
- **shared/** - Shared configurations across environments
  - **actions/** - Auth0 Actions
  - **clients/** - Auth0 Client (application) configurations
  - **connections/** - Identity provider connections
  - **roles/** - User roles
  - **rules/** - Auth0 Rules

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on the `.env.example` template with your actual credentials.

3. For local development and testing, you can use the Auth0 Deploy CLI directly:
   ```
   npm run deploy:dev
   ```

## Placeholder Replacement

This project uses placeholder values in YAML files (like `{{DOMAIN_NAME}}` or `{{EXTENSION_ID}}`) that get replaced during deployment.

Two options for replacement:

1. **GitHub Actions**: If using GitHub, the included workflow automatically replaces placeholders using values from GitHub Secrets.

2. **Manual replacement**: You can use the built-in AUTH0_KEYWORD_REPLACE_MAPPINGS feature of Auth0 Deploy CLI, which reads from environment variables.

## Environment Management

- **Dev**: Connected to `dev-subscribehub.us.auth0.com`
- **Staging**: Connected to `staging-subscribehub.us.auth0.com`
- **Production**: Connected to `subscribehub.us.auth0.com`

Each environment should have its own Auth0 tenant to prevent configuration overlap.

## User Types and Roles

The application supports three types of users:

1. **Supporters** - Users of the Chrome extension
2. **Creators** - Content creators and influencers
3. **Brands** - Companies working with creators

Each user type is assigned a corresponding role in Auth0.

## Deployment

### Via GitHub Actions:

Push to the corresponding branch:
- `develop` branch → Dev environment
- `staging` branch → Staging environment
- `main` branch → Production environment

### Manual Deployment:

```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

## Exporting Current Configuration

To export the current Auth0 tenant configuration:

```bash
npm run export:dev
npm run export:staging
npm run export:prod
```

## Important Notes

- Always test changes in development before deploying to staging or production
- Be careful with `AUTH0_ALLOW_DELETE` setting as it can remove entities from Auth0
- Keep secrets in `.env` files out of version control