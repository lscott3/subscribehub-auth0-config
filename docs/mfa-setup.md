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