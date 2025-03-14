# Auth0 Deployment Guide

This guide provides detailed information on how to deploy Auth0 configurations for SubscribeHub across different environments.

## Overview

The SubscribeHub Auth0 configuration uses a GitOps approach with the Auth0 Deploy CLI tool. The deployment pipeline is automated using GitHub Actions, which provides:

- Configuration validation
- Environment-specific deployments
- Role and permission assignments
- Configuration exports and archiving
- Deployment notifications

## Prerequisites

Before deploying, ensure you have:

1. Auth0 tenants created for each environment (dev, staging, production)
2. Management API credentials for each tenant with proper permissions
3. GitHub repository with the Auth0 configuration code
4. GitHub Secrets configured with the necessary credentials

## GitHub Secrets Configuration

The following secrets must be configured in your GitHub repository:

### Authentication Credentials

For each environment (`DEV`, `STAGING`, `PROD`):
- `{ENV}_CLIENT_ID` - Auth0 Deploy CLI client ID
- `{ENV}_CLIENT_SECRET` - Auth0 Deploy CLI client secret
- `{ENV}_DOMAIN_NAME` - Domain name for the environment (e.g., `dev.subscribehub.com`)

### Integration Credentials

- `EXTENSION_ID` - Chrome extension ID
- `BACKEND_API_KEY` - API key for the backend service
- `DEPLOYMENT_WEBHOOK_URL` - Webhook URL for deployment notifications

### Email Configuration

- `SMTP_HOST` - SMTP server hostname
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

### MFA Configuration

- `SNS_APNS_ARN` - AWS SNS ARN for Apple Push Notifications
- `SNS_GCM_ARN` - AWS SNS ARN for Google Cloud Messaging

### Social Connections

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`
- `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET`
- `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`, `APPLE_TEAM_ID`, and `APPLE_KEY_ID`

### Error Monitoring

- `ERROR_MONITORING_ENDPOINT` - Error reporting service endpoint
- `ERROR_MONITORING_API_KEY` - API key for error reporting service
- `ALERT_ENDPOINT` - Alerting service endpoint
- `ALERT_API_KEY` - API key for alerting service

## Deployment Process

### Automatic Deployment

The deployment process is triggered automatically on:

1. **Code changes pushed to specific branches**:
   - `develop` branch → Dev environment
   - `staging` branch → Staging environment
   - `main` branch → Production environment

2. **Manual trigger via GitHub UI**:
   - Navigate to "Actions" tab
   - Select "Deploy Auth0 Configuration" workflow
   - Click "Run workflow"
   - Select the environment and whether to do a dry run

### Deployment Steps

1. **Validation**:
   - Code syntax checking (YAML and JavaScript)
   - Placeholder replacement verification
   - Auth0 tenant connection test

2. **Deployment**:
   - Placeholder variable substitution
   - Auth0 Deploy CLI execution
   - Role and permission assignments

3. **Post-Deployment**:
   - Configuration export
   - Artifact archiving
   - Deployment notification

### Environment-Specific Considerations

#### Development

- Most permissive settings
- Test social connections
- Useful for rapid iteration

#### Staging

- Mirrors production configuration
- Pre-production testing environment
- Validate changes before production deployment

#### Production

- Strictest security settings
- Production social connection credentials
- Limited deployment frequency

## Manual Deployment

If needed, you can deploy manually using npm scripts:

```bash
# Install dependencies
npm install

# Create .env file with appropriate credentials
cp .env.example .env
# Edit .env with your credentials

# Deploy to specific environment
npm run deploy:dev    # Development
npm run deploy:staging  # Staging
npm run deploy:prod   # Production

# Assign permissions after deployment
npm run permissions:dev  # Development
npm run permissions:staging  # Staging
npm run permissions:prod  # Production

# Export current configuration
npm run export:dev   # Development
npm run export:staging  # Staging
npm run export:prod  # Production
```

## Verification

After deployment, verify:

1. Login functionality for each user type
2. Social connections
3. Role assignments
4. Multi-factor authentication
5. Custom rules and actions execution

## Rollback Procedure

If a deployment causes issues:

1. Identify the last good configuration using archived exports
2. Restore the previous configuration:
   ```bash
   a0deploy import --config_file ./environments/{environment}/tenant.yaml --input_file ./export-{environment}
   ```
3. Verify the rollback fixed the issue
4. Fix the configuration in your repository

## Common Issues and Solutions

### Connection Issues

**Problem**: Unable to connect to Auth0 tenant  
**Solution**: Verify credentials and network connectivity

### Permission Errors

**Problem**: Deployment fails with permission errors  
**Solution**: Ensure the Auth0 Deploy CLI client has sufficient permissions

### Social Connection Failures

**Problem**: Social connections not working  
**Solution**: Verify client IDs and secrets, check callback URLs

### Missing Placeholder Values

**Problem**: YAML files contain unresolved placeholders  
**Solution**: Ensure all required environment variables are set

## Deployment Best Practices

1. **Make incremental changes** - Small, focused changes are easier to test and rollback
2. **Test in development first** - Verify changes in dev before promoting to staging/production
3. **Document changes** - Use descriptive commit messages explaining the purpose of changes
4. **Review exports** - Periodically review exported configurations to ensure accuracy
5. **Monitor deployments** - Watch for errors and unusual behavior after deployment
6. **Secure credentials** - Rotate secrets periodically and use GitHub's secret management

## Advanced Configuration

### Custom Deployment Scripts

For complex deployment scenarios, you can extend the deployment scripts:

```javascript
// Example custom post-deployment script
async function customPostDeployment() {
  // Custom logic here
}
```

### Integration with Other Systems

The deployment pipeline can trigger other systems using webhooks:

1. CI/CD for frontend/backend applications
2. Monitoring systems
3. Documentation updates

## Resources

- [Auth0 Deploy CLI Documentation](https://auth0.com/docs/deploy-cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Auth0 Management API Documentation](https://auth0.com/docs/api/management/v2)