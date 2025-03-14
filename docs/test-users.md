# Test Users

This document describes the test users available in each environment and how to use them for testing.

## Available Test Users

In each environment (development, staging, production), the following test users are created:

1. **Test Supporter**
   - Email: `test-supporter@{environment-domain}`
   - Role: Supporter
   - Use for testing the basic user experience and subscription management

2. **Test Creator**
   - Email: `test-creator@{environment-domain}`
   - Role: Creator
   - Use for testing content creation and analytics features

3. **Test Brand**
   - Email: `test-brand@{environment-domain}`
   - Role: Brand
   - Use for testing campaign creation and creator partnerships

## Creating Test Users

Test users can be created or updated by running the following commands:

```bash
# For development environment
npm run users:dev

# For staging environment
npm run users:staging

# For production environment
npm run users:prod
```

## Testing Scenarios

Here are some common testing scenarios for each user type:

### Supporter Testing

- Registration and onboarding flow
- Browse creator content
- Subscribe to creator
- Manage subscription settings
- Payment processing

### Creator Testing

- Creator registration and verification
- Content upload and management
- Subscription tier setup
- Analytics dashboard
- Revenue tracking

### Brand Testing

- Brand account registration
- Campaign creation
- Creator discovery and partnerships
- Campaign analytics

## Multi-Factor Authentication Testing

All test users have the same password: `Test123!@#`. When testing MFA:

- Brand and Creator users will always be prompted for MFA
- Supporter users will be prompted for MFA only on sensitive operations

To test MFA enrollment:
1. Log in as a test user
2. Navigate to the account settings
3. Select "Security" or "Multi-Factor Authentication"
4. Follow the enrollment process

## Password Reset Testing

To test password reset functionality:
1. Go to the login page
2. Click "Forgot Password"
3. Enter the test user's email address
4. Check the Auth0 logs to see the reset email (emails are not actually sent in dev/staging)

## Notes

- Test users have the same password across all environments: `Test123!@#`
- These users are automatically created during deployment but can also be created manually
- In development and staging environments, emails are not actually sent to these addresses
- Test users should not be used for performance testing or load testing