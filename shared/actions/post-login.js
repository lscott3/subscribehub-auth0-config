// shared/actions/post-login.js
/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://subscribehub.com';

  try {
    // Determine user type based on connection or app
    let userType = 'supporter'; // Default user type

    // Check if user type is already defined in metadata
    if (event.user.user_metadata && event.user.user_metadata.user_type) {
      userType = event.user.user_metadata.user_type;
      console.log(`Using existing user_type from metadata: ${userType}`);
    }
    // For database connection users
    else if (event.connection.name === 'Username-Password-Authentication') {
      // Check query parameters for signup flow indication
      if (event.request.query && event.request.query.signup_as) {
        userType = event.request.query.signup_as;
        console.log(`Setting user_type from signup_as parameter: ${userType}`);

        // Validate user type
        if (!['supporter', 'creator', 'brand'].includes(userType)) {
          console.warn(`Invalid user_type provided: ${userType}, defaulting to supporter`);
          userType = 'supporter';
        }
      }
    }

    // Add user_type to ID token
    api.idToken.setCustomClaim(`${namespace}/user_type`, userType);

    // Add app_metadata for more permanent storage if not already set
    if (!event.user.app_metadata || !event.user.app_metadata.user_type) {
      try {
        api.user.setAppMetadata({ user_type: userType });
        console.log(`Set app_metadata.user_type to ${userType}`);
      } catch (metadataError) {
        console.error(`Error setting app_metadata: ${metadataError.message}`);
        // Continue flow despite metadata error
      }
    }

    // Add user_metadata if not already set
    if (!event.user.user_metadata || !event.user.user_metadata.user_type) {
      try {
        api.user.setUserMetadata({ user_type: userType });
        console.log(`Set user_metadata.user_type to ${userType}`);
      } catch (metadataError) {
        console.error(`Error setting user_metadata: ${metadataError.message}`);
        // Continue flow despite metadata error
      }
    }

    // Set role if not already assigned
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
      // Log the error but continue the authentication flow
    }

    // Notify backend (if needed) for first-time logins
    if (event.stats.logins_count === 1) {
      try {
        const axios = require('axios');

        // Set timeout to avoid blocking login flow
        const timeoutMs = 3000;

        // Prepare backend notification data
        const notificationData = {
          user_id: event.user.user_id,
          email: event.user.email,
          user_type: userType,
          connection: event.connection.name,
          metadata: event.user.user_metadata
        };

        // Add backend notification context
        const backendUrl = `https://${event.tenant.region}.${event.request.hostname}/api/v1/auth/auth0_callback`;
        console.log(`Notifying backend at ${backendUrl} for first login`);

        // Call the backend with timeout
        const backendResponse = await axios.post(backendUrl, notificationData, {
          headers: {
            'Authorization': `Bearer ${event.secrets.BACKEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: timeoutMs
        });

        console.log(`Backend notification successful, status: ${backendResponse.status}`);
      } catch (backendError) {
        // Detailed error logging
        if (backendError.response) {
          // The request was made and the server responded with a status code outside of 2xx
          console.error(`Backend notification error: ${backendError.response.status} - ${JSON.stringify(backendError.response.data)}`);
        } else if (backendError.request) {
          // The request was made but no response was received
          console.error(`Backend notification timeout or no response: ${backendError.message}`);
        } else {
          // Something happened in setting up the request
          console.error(`Backend notification configuration error: ${backendError.message}`);
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
        last_login_tenant: event.tenant.name
      });
    } catch (timestampError) {
      console.error(`Error setting login timestamp: ${timestampError.message}`);
      // Continue flow despite timestamp error
    }

  } catch (error) {
    // Global error handler for the entire action
    console.error(`Critical error in post-login action: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);

    // Ensure authentication can continue even if our customization fails
    // Do not re-throw the error, which would prevent user login
  }
};
