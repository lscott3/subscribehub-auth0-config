# SubscribeHub Auth0 Configuration

This repository contains Auth0 configuration for the SubscribeHub application, managed using the Auth0 Deploy CLI.

## System Overview

SubscribeHub is a platform that connects content creators, supporters, and brands. The Auth0 configuration in this repository handles:

- User authentication (both password-based and social)
- Role-based access control for different user types
- Integration with the SubscribeHub backend

## Applications and Authentication Methods

### Chrome Extension
- **Authentication Method**: Google OAuth only
- **Required Scopes**:
  - `email`
  - `profile`
  - `https://www.googleapis.com/auth/youtube.readonly`
- **Configuration**: Requires Google OAuth credentials and Chrome Extension ID

### Web Portal
- **Authentication Methods**:
  - Username/Password
  - Google OAuth
  - Facebook OAuth
- **Password Requirements**:
  - Minimum length: 8 characters
  - Password history enabled (last 5 passwords)
  - Personal info and dictionary validation
- **Social Login Scopes**:
  - Google: `email`, `profile`, `youtube.readonly`
  - Facebook: `email`, `public_profile`, `user_location`

## Repository Structure

```
.
├── environments/          # Environment-specific configurations
│   ├── dev/               # Development environment
│   ├── staging/           # Staging environment
│   └── production/        # Production environment
├── scripts/               # Utility scripts
├── shared/                # Shared configurations across environments
│   ├── clients/           # Auth0 Client (application) configurations
│   ├── connections/       # Identity provider connections
│   ├── email-templates/   # Email templates
│   ├── permissions/       # Permission definitions
│   ├── resource-servers/  # API definitions
│   ├── roles/             # User role definitions
│   └── tenant-settings/   # Auth0 tenant settings
├── .env.example           # Example environment variables
├── Makefile              # Utility commands
├── config.json           # Auth0 Deploy CLI configuration
├── package.json          # Node.js dependencies
└── README.md             # Project documentation
```

## Setup Requirements

### Google OAuth Setup
1. Create a project in Google Cloud Console
2. Configure OAuth 2.0 credentials:
   - Add authorized JavaScript origins:
     - `chrome-extension://##EXTENSION_ID##` (for Chrome extension)
     - `https://##DOMAIN_NAME##` (for Web Portal)
   - Add authorized redirect URIs:
     - `chrome-extension://##EXTENSION_ID##/callback.html` (for Chrome extension)
     - `https://##DOMAIN_NAME##/callback` (for Web Portal)
3. Add credentials to environment:
   - `##GOOGLE_CLIENT_ID##`
   - `##GOOGLE_CLIENT_SECRET##`

### Facebook OAuth Setup (Web Portal Only)
1. Create an application in Facebook Developers Console
2. Configure OAuth settings:
   - Add `https://##DOMAIN_NAME##` to allowed origins
   - Add `https://##DOMAIN_NAME##/callback` to redirect URIs
3. Add credentials to environment:
   - `##FACEBOOK_CLIENT_ID##`
   - `##FACEBOOK_CLIENT_SECRET##`

## Environment Variables

Required environment variables:
- `##DOMAIN_NAME##` - The application domain
- `##EXTENSION_ID##` - Chrome extension ID
- `##GOOGLE_CLIENT_ID##` - Google OAuth client ID
- `##GOOGLE_CLIENT_SECRET##` - Google OAuth client secret
- `##FACEBOOK_CLIENT_ID##` - Facebook OAuth client ID (Web Portal only)
- `##FACEBOOK_CLIENT_SECRET##` - Facebook OAuth client secret (Web Portal only)

## Deployment

Use the Makefile targets for deployment:

```bash
# Deploy to development
make deploy-dev

# Deploy to staging
make deploy-staging

# Deploy to production
make deploy-prod
```

The deployment process is idempotent - running it multiple times with the same configuration will not create duplicate resources.

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
