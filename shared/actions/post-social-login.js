// shared/actions/post-social-login.js
/**
 * Handler that will be called during the execution of a PostLogin flow.
 * Specifically for social logins to detect creator accounts via YouTube
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://subscribehub.com';

  try {
    // Only process social logins
    if (!event.user.identities || event.user.identities.length === 0) {
      console.log('No identities found, skipping social login processing');
      return;
    }

    const identity = event.user.identities[0];
    console.log(`Processing login for identity provider: ${identity.provider}`);

    // Default user type
    let userType = 'supporter';

    // Check if user type is already in metadata (don't overwrite)
    if (event.user.app_metadata && event.user.app_metadata.user_type) {
      userType = event.user.app_metadata.user_type;
      console.log(`User already has app_metadata.user_type: ${userType}`);
    }
    else if (event.user.user_metadata && event.user.user_metadata.user_type) {
      userType = event.user.user_metadata.user_type;
      console.log(`User already has user_metadata.user_type: ${userType}`);
    }
    // Check for Google connection and YouTube scope
    else if (identity.provider === 'google-oauth2' && event.authorization) {
      console.log('Processing Google OAuth2 login');

      // If user was authenticated with YouTube scope
      const accessToken = event.authorization.access_token;

      if (accessToken && event.request.query &&
          event.request.query.scope &&
          event.request.query.scope.includes('youtube.readonly')) {

        console.log('YouTube scope detected, checking for YouTube channel');

        try {
          // Check if this user has a YouTube channel
          const axios = require('axios');

          // Set timeout to avoid blocking login flow indefinitely
          const timeoutMs = 5000;

          const youtubeResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
              part: 'snippet,statistics',
              mine: true
            },
            headers: {
              Authorization: `Bearer ${accessToken}`
            },
            timeout: timeoutMs
          });

          // If user has a YouTube channel
          if (youtubeResponse.data &&
              youtubeResponse.data.items &&
              youtubeResponse.data.items.length > 0) {

            const channel = youtubeResponse.data.items[0];
            const channelId = channel.id;
            const channelTitle = channel.snippet.title;
            const subscriberCount = channel.statistics.subscriberCount;

            console.log(`YouTube channel found: ${channelTitle} (${channelId}) with ${subscriberCount} subscribers`);

            // Set user type to creator for YouTube channel owners
            userType = 'creator';

            // Store YouTube info in user metadata
            try {
              api.user.setUserMetadata({
                user_type: 'creator',
                youtube_channel_id: channelId,
                youtube_channel_title: channelTitle,
                youtube_subscriber_count: subscriberCount,
                youtube_last_checked: new Date().toISOString()
              });
              console.log('YouTube channel info stored in user_metadata');
            } catch (metadataError) {
              console.error(`Error setting user_metadata: ${metadataError.message}`);
            }

            // Set app metadata as well for more permanent storage
            try {
              api.user.setAppMetadata({
                user_type: 'creator',
                youtube_channel_id: channelId
              });
              console.log('YouTube channel info stored in app_metadata');
            } catch (metadataError) {
              console.error(`Error setting app_metadata: ${metadataError.message}`);
            }
          } else {
            console.log('No YouTube channel found, setting user as supporter');
            userType = 'supporter';
          }
        } catch (youtubeError) {
          // Handle YouTube API errors gracefully
          console.error(`Error checking YouTube channel: ${youtubeError.message}`);

          if (youtubeError.response) {
            console.error(`YouTube API error status: ${youtubeError.response.status}`);
            console.error(`YouTube API error data: ${JSON.stringify(youtubeError.response.data)}`);
          }

          // Default to supporter on YouTube API error
          userType = 'supporter';
          console.log('Defaulting to supporter type due to YouTube API error');

          // Still update metadata despite API error
          try {
            api.user.setUserMetadata({
              user_type: 'supporter',
              youtube_api_error: youtubeError.message,
              youtube_api_error_time: new Date().toISOString()
            });
          } catch (metadataError) {
            console.error(`Error setting error metadata: ${metadataError.message}`);
          }
        }
      } else {
        console.log('Google login without YouTube scope - setting as supporter');
        userType = 'supporter';
      }
    } else {
      console.log(`Social login with provider ${identity.provider} - setting as supporter`);
      userType = 'supporter';
    }

    // Add user_type to ID token
    try {
      api.idToken.setCustomClaim(`${namespace}/user_type`, userType);
      console.log(`Added user_type claim to ID token: ${userType}`);
    } catch (tokenError) {
      console.error(`Error setting ID token claim: ${tokenError.message}`);
    }

    // Ensure user metadata is set
    if (!event.user.user_metadata?.user_type) {
      try {
        api.user.setUserMetadata({ user_type: userType });
        console.log(`Set user_metadata.user_type to ${userType}`);
      } catch (metadataError) {
        console.error(`Error setting user_metadata: ${metadataError.message}`);
      }
    }

    // Ensure app metadata is set
    if (!event.user.app_metadata?.user_type) {
      try {
        api.user.setAppMetadata({ user_type: userType });
        console.log(`Set app_metadata.user_type to ${userType}`);
      } catch (metadataError) {
        console.error(`Error setting app_metadata: ${metadataError.message}`);
      }
    }

    // Assign appropriate role based on user type
    try {
      const userRoles = event.authorization?.roles || [];

      if (userType === 'creator' && !userRoles.includes('Creator')) {
        api.user.setRoles({ roles: ['Creator'] });
        console.log(`Assigned Creator role to user ${event.user.user_id}`);
      } else if (userType === 'brand' && !userRoles.includes('Brand')) {
        api.user.setRoles({ roles: ['Brand'] });
        console.log(`Assigned Brand role to user ${event.user.user_id}`);
      } else if (userType === 'supporter' && !userRoles.includes('Supporter')) {
        api.user.setRoles({ roles: ['Supporter'] });
        console.log(`Assigned Supporter role to user ${event.user.user_id}`);
      } else {
        console.log(`User already has appropriate role: ${userRoles.join(', ')}`);
      }
    } catch (roleError) {
      console.error(`Error assigning role: ${roleError.message}`);
      // Continue authentication despite role error
    }

    // If this is first login, notify backend
    if (event.stats.logins_count === 1) {
      try {
        const axios = require('axios');

        // Set timeout to avoid blocking login flow
        const timeoutMs = 3000;

        // Prepare notification data
        const notificationData = {
          user_id: event.user.user_id,
          email: event.user.email,
          user_type: userType,
          provider: identity.provider,
          provider_user_id: identity.user_id,
          is_social: true
        };

        // Add YouTube data if available
        if (event.user.user_metadata?.youtube_channel_id) {
          notificationData.youtube_channel_id = event.user.user_metadata.youtube_channel_id;
          notificationData.youtube_channel_title = event.user.user_metadata.youtube_channel_title;
          notificationData.youtube_subscriber_count = event.user.user_metadata.youtube_subscriber_count;
        }

        // Construct backend URL
        const backendUrl = `https://${event.tenant.region}.${event.request.hostname}/api/v1/auth/auth0_callback`;
        console.log(`Notifying backend at ${backendUrl} for first social login`);

        // Call backend with timeout
        const backendResponse = await axios.post(backendUrl, notificationData, {
          headers: {
            'Authorization': `Bearer ${event.secrets.BACKEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: timeoutMs
        });

        console.log(`Backend notification successful, status: ${backendResponse.status}`);
      } catch (backendError) {
        // Detailed backend error logging
        if (backendError.response) {
          console.error(`Backend notification error: ${backendError.response.status} - ${JSON.stringify(backendError.response.data)}`);
        } else if (backendError.request) {
          console.error(`Backend notification timeout or no response: ${backendError.message}`);
        } else {
          console.error(`Backend notification configuration error: ${backendError.message}`);
        }

        // Store notification error in user metadata for debugging
        try {
          api.user.setUserMetadata({
            backend_notification_error: backendError.message,
            backend_notification_error_time: new Date().toISOString()
          });
        } catch (metadataError) {
          console.error(`Error setting notification error metadata: ${metadataError.message}`);
        }

        // Continue authentication flow despite backend notification failure
        console.log('Continuing authentication flow despite backend notification failure');
      }
    }

    // Add login timestamp to user metadata
    try {
      const now = new Date();
      api.user.setUserMetadata({
        last_login: now.toISOString(),
        last_login_method: `social:${identity.provider}`,
        last_login_tenant: event.tenant.name
      });
    } catch (timestampError) {
      console.error(`Error setting login timestamp: ${timestampError.message}`);
    }

  } catch (error) {
    // Global error handler for the entire action
    console.error(`Critical error in post-social-login action: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);

    // Try to store the error in user metadata for debugging
    try {
      api.user.setUserMetadata({
        action_error: error.message,
        action_error_time: new Date().toISOString()
      });
    } catch (metadataError) {
      console.error(`Error setting error metadata: ${metadataError.message}`);
    }

    // Ensure authentication can continue even if our customization fails
    // Do not re-throw the error, which would prevent user login
  }
};
