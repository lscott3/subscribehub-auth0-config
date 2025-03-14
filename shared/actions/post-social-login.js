// shared/actions/post-social-login.js
/**
 * Handler that will be called during the execution of a PostLogin flow.
 * Specifically for social logins to detect creator accounts via YouTube
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Only process social logins
  if (!event.user.identities || event.user.identities.length === 0) {
    return;
  }

  const identity = event.user.identities[0];
  const namespace = 'https://subscribehub.com';

  // Check for Google connection and YouTube scope
  if (identity.provider === 'google-oauth2' && event.authorization) {
    // If user was authenticated with YouTube scope
    const accessToken = event.authorization.access_token;

    if (accessToken && event.request.query && 
        event.request.query.scope && 
        event.request.query.scope.includes('youtube.readonly')) {

      try {
        // Check if this user has a YouTube channel
        const axios = require('axios');
        const youtubeResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: {
            part: 'snippet,statistics',
            mine: true
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        // If user has a YouTube channel
        if (youtubeResponse.data && 
            youtubeResponse.data.items && 
            youtubeResponse.data.items.length > 0) {

          const channel = youtubeResponse.data.items[0];
          const channelId = channel.id;
          const channelTitle = channel.snippet.title;
          const subscriberCount = channel.statistics.subscriberCount;

          // Store YouTube info in user metadata
          api.user.setUserMetadata({
            user_type: 'creator',
            youtube_channel_id: channelId,
            youtube_channel_title: channelTitle,
            youtube_subscriber_count: subscriberCount
          });

          // Set app metadata for more permanent storage
          api.user.setAppMetadata({
            user_type: 'creator',
            youtube_channel_id: channelId
          });

          // Add to ID token
          api.idToken.setCustomClaim(`${namespace}/user_type`, 'creator');
          api.idToken.setCustomClaim(`${namespace}/youtube_channel_id`, channelId);

          // Assign Creator role
          if (!event.user.roles || !event.user.roles.includes('Creator')) {
            api.user.setRoles({ roles: ['Creator'] });
          }

          // Log creator detection
          console.log(`Detected YouTube creator: ${channelTitle} (${channelId}) with ${subscriberCount} subscribers`);
        } else {
          // Not a YouTube creator, set as supporter
          api.user.setUserMetadata({ user_type: 'supporter' });
          api.idToken.setCustomClaim(`${namespace}/user_type`, 'supporter');

          // Assign Supporter role
          if (!event.user.roles || !event.user.roles.includes('Supporter')) {
            api.user.setRoles({ roles: ['Supporter'] });
          }
        }
      } catch (error) {
        console.log('Error checking YouTube channel:', error.message);

        // Default to supporter on error
        api.user.setUserMetadata({ user_type: 'supporter' });
        api.idToken.setCustomClaim(`${namespace}/user_type`, 'supporter');

        // Assign Supporter role on error
        if (!event.user.roles || !event.user.roles.includes('Supporter')) {
          api.user.setRoles({ roles: ['Supporter'] });
        }
      }
    } else {
      // Google login without YouTube scope - set as supporter
      api.user.setUserMetadata({ user_type: 'supporter' });
      api.idToken.setCustomClaim(`${namespace}/user_type`, 'supporter');

      // Assign Supporter role
      if (!event.user.roles || !event.user.roles.includes('Supporter')) {
        api.user.setRoles({ roles: ['Supporter'] });
      }
    }
  } else {
    // For other social logins - set as supporter by default
    api.user.setUserMetadata({ user_type: 'supporter' });
    api.idToken.setCustomClaim(`${namespace}/user_type`, 'supporter');

    // Assign Supporter role for non-Google social logins
    if (!event.user.roles || !event.user.roles.includes('Supporter')) {
      api.user.setRoles({ roles: ['Supporter'] });
    }
  }

  // If this is first login, notify backend (similar to post-login.js)
  if (event.stats.logins_count === 1) {
    try {
      const axios = require('axios');
      await axios.post(`https://${event.tenant.region}.${event.request.hostname}/api/v1/auth/auth0_callback`, {
        user_id: event.user.user_id,
        email: event.user.email,
        user_type: event.user.user_metadata.user_type || 'supporter',
        provider: identity.provider
      }, {
        headers: {
          'Authorization': `Bearer ${event.secrets.BACKEND_API_KEY}`
        }
      });
    } catch (error) {
      console.log('Error notifying backend:', error.message);
    }
  }
};
