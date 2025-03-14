# Social Connections Setup Guide

This guide provides instructions for setting up and configuring the social identity providers used by SubscribeHub.

## Overview

SubscribeHub supports the following social connections:

1. Google (with YouTube integration for creators)
2. Facebook
3. Twitter
4. Apple

## Google / YouTube Configuration

The Google connection is particularly important as it's used to identify YouTube creators.

### Setup Steps:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Create an OAuth 2.0 Client ID
   - Application type: Web application
   - Name: SubscribeHub (Dev/Staging/Prod)
   - Authorized JavaScript origins:
     - https://{{DOMAIN_NAME}}
     - https://{{AUTH0_DOMAIN}}
   - Authorized redirect URIs:
     - https://{{AUTH0_DOMAIN}}/login/callback
     - https://{{DOMAIN_NAME}}/auth/callback

5. Enable the YouTube Data API v3:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Enable the API

6. Take note of your Client ID and Client Secret for use in Auth0

### Environment Variables:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Facebook Configuration

### Setup Steps:

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Consumer type)
3. Add the Facebook Login product
4. Basic Settings:
   - App Name: SubscribeHub (Dev/Staging/Prod)
   - App Domains: {{DOMAIN_NAME}}, {{AUTH0_DOMAIN}}
   - Privacy Policy URL: https://{{DOMAIN_NAME}}/privacy
   - Terms of Service URL: https://{{DOMAIN_NAME}}/terms

5. Facebook Login Settings:
   - Valid OAuth Redirect URIs: https://{{AUTH0_DOMAIN}}/login/callback
   - Deselect "Use Strict Mode for Redirect URIs"
   - Permissions: email, public_profile, user_location

6. Take note of your App ID and App Secret for use in Auth0

### Environment Variables:

```
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
```

## Twitter Configuration

### Setup Steps:

1. Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. App Settings:
   - App name: SubscribeHub (Dev/Staging/Prod)
   - Description: Social platform for creators and supporters
   - Website: https://{{DOMAIN_NAME}}
   - Callback URL: https://{{AUTH0_DOMAIN}}/login/callback
   - App permissions: Read-only

4. Generate API Keys and Tokens
5. Take note of your API Key and API Secret for use in Auth0

### Environment Variables:

```
TWITTER_CLIENT_ID=your_twitter_api_key
TWITTER_CLIENT_SECRET=your_twitter_api_secret
```

## Apple Configuration

### Setup Steps:

1. Go to the [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Create a new Services ID:
   - Description: SubscribeHub
   - Identifier: your.apple.service.id (must match APPLE_CLIENT_ID)

4. Configure "Sign In with Apple" for the Service ID:
   - Primary App ID: Your main app ID
   - Domains and Subdomains: {{DOMAIN_NAME}}, {{AUTH0_DOMAIN}}
   - Return URLs: https://{{AUTH0_DOMAIN}}/login/callback

5. Create a new private key for "Sign In with Apple"
   - Take note of the Key ID

6. Generate a client secret using the private key
7. Take note of your Team ID from the Developer Portal

### Environment Variables:

```
APPLE_CLIENT_ID=your.apple.service.id
APPLE_CLIENT_SECRET=your_apple_client_secret
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
```

## Post-Login Processing

The `post-social-login.js` action handles special processing after social login:

- For Google logins with YouTube scope, it checks if the user has a YouTube channel
- If a YouTube channel is found, the user is assigned the Creator role
- For all other social logins, users are assigned the Supporter role by default

## Testing

To test social connections:

1. Make sure all environment variables are set
2. Deploy the Auth0 configuration
3. Use the Auth0 Universal Login to test each connection
4. For YouTube creator detection, login with a Google account that has a YouTube channel and verify the correct role assignment

## Troubleshooting

Common issues:

- **Incorrect redirect URIs**: Make sure all redirect URIs are properly configured in both Auth0 and the social provider settings
- **Missing scopes**: Ensure all required scopes are enabled in both Auth0 and social provider settings
- **API limits**: YouTube API has quota limits that may affect creator detection
- **Connection not showing up**: Make sure the connection is enabled for the correct client applications