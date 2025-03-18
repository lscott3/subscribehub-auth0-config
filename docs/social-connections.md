# Social Connections Setup Guide

This guide provides instructions for setting up and configuring the social identity providers used by SubscribeHub.

## Overview

SubscribeHub supports different authentication methods for each application:

### Chrome Extension
- Google OAuth only (with YouTube integration)

### Web Portal
- Google OAuth
- Facebook OAuth
- Username/Password

## Google / YouTube Configuration

The Google connection is used for both the Chrome extension and Web Portal.

### Setup Steps:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Create an OAuth 2.0 Client ID
   - For Chrome Extension:
     - Application type: Chrome App
     - Name: SubscribeHub Chrome Extension
     - Authorized JavaScript origins:
       - chrome-extension://##EXTENSION_ID##
     - Authorized redirect URIs:
       - chrome-extension://##EXTENSION_ID##/callback.html

   - For Web Portal:
     - Application type: Web application
     - Name: SubscribeHub Web Portal
     - Authorized JavaScript origins:
       - https://##DOMAIN_NAME##
     - Authorized redirect URIs:
       - https://##DOMAIN_NAME##/callback

5. Enable the YouTube Data API v3:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Enable the API

6. Take note of your Client ID and Client Secret for use in Auth0

### Required Scopes:
- `email`
- `profile`
- `https://www.googleapis.com/auth/youtube.readonly`

### Environment Variables:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EXTENSION_ID=your_chrome_extension_id
```

## Facebook Configuration (Web Portal Only)

### Setup Steps:

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Consumer type)
3. Add the Facebook Login product
4. Basic Settings:
   - App Name: SubscribeHub Web Portal
   - App Domains: ##DOMAIN_NAME##
   - Privacy Policy URL: https://##DOMAIN_NAME##/privacy
   - Terms of Service URL: https://##DOMAIN_NAME##/terms

5. Facebook Login Settings:
   - Valid OAuth Redirect URIs: https://##DOMAIN_NAME##/callback
   - Deselect "Use Strict Mode for Redirect URIs"
   - Permissions: email, public_profile, user_location

6. Take note of your App ID and App Secret for use in Auth0

### Required Scopes:
- `email`
- `public_profile`
- `user_location`

### Environment Variables:

```
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
```

## Username/Password Authentication (Web Portal Only)

The database connection is configured with the following settings:

- Password Requirements:
  - Minimum length: 8 characters
  - Password history: Last 5 passwords stored
  - Personal info validation enabled
  - Dictionary validation enabled
- Brute force protection enabled
- Signup enabled
- Username Requirements:
  - Minimum length: 3 characters
  - Maximum length: 50 characters

## Testing

To test social connections:

1. Make sure all environment variables are set
2. Deploy the Auth0 configuration using `make deploy-dev`
3. Test Chrome Extension:
   - Verify only Google login is available
   - Test with both YouTube and non-YouTube accounts
4. Test Web Portal:
   - Test Google login
   - Test Facebook login
   - Test email/password signup and login

## Troubleshooting

Common issues:

- **Incorrect redirect URIs**: Make sure all redirect URIs are properly configured in both Auth0 and the social provider settings
- **Missing scopes**: Ensure all required scopes are enabled in both Auth0 and social provider settings
- **Chrome Extension Issues**: Verify the extension ID is correct and the Google OAuth configuration includes the Chrome extension URLs
- **Connection not showing up**: Make sure the connection is enabled for the correct application (Chrome Extension or Web Portal)