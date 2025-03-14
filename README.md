# SubscribeHub Auth0 Configuration

This repository contains Auth0 configuration for the SubscribeHub application, managed using the Auth0 Deploy CLI.

## System Overview

SubscribeHub is a platform that connects content creators, supporters, and brands. The Auth0 configuration in this repository handles:

- User authentication (both password-based and social)
- Role-based access control for different user types
- Multi-factor authentication
- Custom login flows
- Integration with the SubscribeHub backend

## User Types

The platform supports three types of users, each with different roles and permissions:

1. **Supporters** - Chrome extension users who subscribe to creators
2. **Creators** - Content creators and influencers
3. **Brands** - Companies working with creators

## Repository Structure

```
.
├── .github/workflows/     # GitHub Actions workflows for CI/CD
├── docs/                  # Documentation files
├── environments/          # Environment-specific configurations
│   ├── dev/               # Development environment
│   ├── staging/           # Staging environment
│   └── production/        # Production environment
├── scripts/               # Utility scripts
├── shared/                # Shared configurations across environments
│   ├── actions/           # Auth0 Actions
│   ├── clients/           # Auth0 Client (application) configurations
│   ├── connections/       # Identity provider connections
│   ├── email-templates/   # Email templates
│   ├── permissions/       # Permission definitions
│   ├── resource-servers/  # API definitions
│   ├── roles/             # User role definitions
│   └── tenant-settings/   # Auth0 tenant settings
├── .env.example           # Example environment variables
├── Makefile               # Utility commands
├── config.json            # Auth0 Deploy CLI configuration
├── package.json           # Node.js dependencies
└── README.md              # Project documentation
```

## Key Features

### Authentication Options

- Username/password-based authentication
- Social connections:
  - Google/YouTube (with automatic creator detection)
  - Facebook
  - Twitter
  - Apple

### Multi-Factor Authentication (MFA)

- Enforced for Brand and Creator users
- Conditional for Supporter users (only on sensitive operations)
- Supported methods:
  - Push notifications (via Auth0 Guardian app)
  - SMS one-time passwords
  - Email one-time passwords
  - Time-based one-time passwords (TOTP)

### Role-Based Access Control

- Role assignment based on user type
- Custom permissions for each role
- Proper API scopes for resource server access

### Custom Actions

- Post-login processing
- Social login handling (including YouTube channel detection)
- Custom MFA SMS messaging
- Error monitoring and reporting

## Environment Management

- **Development**: Connected to `dev-subscribehub.us.auth0.com`
- **Staging**: Connected to `staging-subscribehub.us.auth0.com`
- **Production**: Connected to `subscribehub.us.auth0.com`

Each environment has its own Auth0 tenant to prevent configuration overlap.

## Setup and Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on the `.env.example` template with your environment-specific credentials.

3. Validate configurations:
   ```bash
   make validate
   ```

## Deployment

### Automatic Deployment via GitHub Actions

Push to the corresponding branch to trigger automatic deployment:
- `develop` branch → Dev environment
- `staging` branch → Staging environment
- `main` branch → Production environment

The GitHub workflow will:
1. Validate configurations
2. Replace placeholders with appropriate values
3. Deploy to the corresponding Auth0 tenant
4. Run post-deployment scripts
5. Export the deployed configuration for verification

### Manual Deployment

Use the Makefile targets for manual deployment:

```bash
# Deploy to development
make deploy-dev

# Deploy to staging
make deploy-staging

# Deploy to production
make deploy-prod
```

## Placeholder Replacement

This project uses placeholder values in YAML files (like `{{DOMAIN_NAME}}` or `{{EXTENSION_ID}}`) that get replaced during deployment from:

1. GitHub Actions secrets (for CI/CD)
2. Environment variables (for local deployment)

Key placeholders include:
- `{{DOMAIN_NAME}}` - The application domain
- `{{EXTENSION_ID}}` - Chrome extension ID
- `{{*_CLIENT_ID}}` and `{{*_CLIENT_SECRET}}` - OAuth client credentials
- `{{SNS_APNS_ARN}}` and `{{SNS_GCM_ARN}}` - AWS SNS ARNs for MFA push notifications

## Test Users

You can create test users in any environment:

```bash
# Create test users in development
make users-dev

# Create test users in staging
make users-staging

# Create test users in production
make users-prod
```

This creates:
- Test Supporter user
- Test Creator user
- Test Brand user

## Utility Scripts

- **sync-environments.js** - Synchronize configuration between environments
- **assign-permissions.js** - Assign permissions to roles
- **create-test-users.js** - Create test users
- **validate-config.js** - Validate YAML and JavaScript files

## Error Handling

All Auth0 Actions and Rules follow a consistent error handling approach:
- Never block authentication
- Graceful degradation with sensible defaults
- Comprehensive logging
- External monitoring and alerting

## Documentation

Additional documentation is available in the `docs/` directory:
- [MFA Setup](docs/mfa-setup.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Error Handling](docs/error-handling.md)
- [Social Connections](docs/social-connections.md)
- [Test Users](docs/test-users.md)

## Best Practices

1. Always test changes in development before deploying to staging or production
2. Use `make validate` to check configurations before deployment
3. Keep secrets in `.env` files out of version control
4. Review exported configurations to verify successful deployment
5. Make incremental changes with descriptive commit messages

## Contributing

1. Create a new branch from `develop`
2. Make your changes and validate them
3. Open a pull request to the `develop` branch
4. After approval and testing, changes can be promoted to `staging` and `main`

## Important Notes

- The `AUTH0_ALLOW_DELETE` setting is set to `false` to prevent accidental deletion of Auth0 entities
- Settings like MFA configuration and email providers require manual verification
- Social connection credentials are environment-specific and must be configured for each environment
