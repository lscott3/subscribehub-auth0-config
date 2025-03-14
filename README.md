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

# Multi-Factor Authentication Setup

This document outlines the MFA configuration for SubscribeHub and how to set it up properly.

## Overview

SubscribeHub uses Auth0's Guardian service for Multi-Factor Authentication (MFA). MFA is enforced for:

1. Brand users (always required)
2. Creator users (always required)
3. Supporter users when performing sensitive operations like:
   - Managing payment methods
   - Changing subscription details
   - Updating password
   - Accessing billing information

## Supported MFA Methods

The following MFA methods are supported:

- Push notifications (via Auth0 Guardian app)
- SMS one-time passwords
- Email one-time passwords
- Time-based one-time passwords (TOTP)

## AWS SNS Setup for Push Notifications

To enable push notifications for the Auth0 Guardian app, you need to set up AWS SNS:

1. Create an AWS SNS Application for iOS (APNS)
2. Create an AWS SNS Application for Android (GCM/FCM)
3. Add the ARNs to your environment variables:
   - `SNS_APNS_ARN`: ARN for iOS app
   - `SNS_GCM_ARN`: ARN for Android app

## Customizing MFA SMS Messages

The MFA SMS messages are customized using the `send-custom-mfa-sms.js` action. This action formats the SMS with SubscribeHub branding.

## MFA Enforcement Logic

The MFA enforcement logic is defined in the `enforce-mfa.js` rule, which determines when MFA should be required based on:

1. User type (brand, creator)
2. Requested operation (sensitive vs. non-sensitive)
3. Explicit request for MFA via `acr_values` parameter

## Testing MFA

To test MFA in different environments:

1. **Development**: MFA can be triggered by adding `?acr_values=http://schemas.openid.net/pape/policies/2007/06/multi-factor` to any login URL
2. **Staging/Production**: MFA will be enforced automatically based on the rules defined

## User Experience Considerations

- Users can select their preferred MFA method in their account settings
- The preferred method is stored in user metadata as `preferred_mfa_method`
- For first-time MFA setup, users are guided through a dedicated enrollment flow
- Remember browser feature is enabled for 30 days to balance security and convenience

## Security Considerations

- MFA state is remembered for 30 days on trusted devices
- SMS and email templates contain warnings about not sharing codes
- Push notifications require explicit approval in the Guardian app

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