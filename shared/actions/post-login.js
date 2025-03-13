// shared/actions/post-login.js
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://subscribehub.com';

  // Determine user type based on connection or app
  let userType = 'supporter';
  if (event.connection.name === 'Username-Password-Authentication') {
    if (event.user.user_metadata && event.user.user_metadata.user_type) {
      userType = event.user.user_metadata.user_type;
    }
  }

  // Add user_type to ID token
  api.idToken.setCustomClaim(`${namespace}/user_type`, userType);

  // Set role if not already assigned
  if (userType === 'creator' && !event.user.roles?.includes('Creator')) {
    api.user.setRoles({ roles: ['Creator'] });
  } else if (userType === 'brand' && !event.user.roles?.includes('Brand')) {
    api.user.setRoles({ roles: ['Brand'] });
  } else if (userType === 'supporter' && !event.user.roles?.includes('Supporter')) {
    api.user.setRoles({ roles: ['Supporter'] });
  }

  // Notify backend (if needed)
  if (event.stats.logins_count === 1) {
    try {
      const axios = require('axios');
      await axios.post(`https://${event.tenant.region}.${event.request.hostname}/api/v1/auth/auth0_callback`, {
        user_id: event.user.user_id,
        email: event.user.email,
        user_type: userType
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
