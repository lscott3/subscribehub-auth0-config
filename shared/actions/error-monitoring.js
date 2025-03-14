// shared/actions/error-monitoring.js
/**
 * Handler that will be called during the execution of custom actions, rules, etc.
 * Will log errors to a central location for monitoring.
 *
 * @param {Object} error - The error that occurred
 * @param {Object} context - Context information about where the error occurred
 * @param {Boolean} isCritical - Whether this error is critical (affects user login)
 */
exports.monitorError = async (error, context, isCritical = false) => {
  try {
    // Create error record with metadata
    const errorRecord = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: context,
      isCritical: isCritical,
      environment: process.env.NODE_ENV || 'unknown'
    };

    // Get axios if needed for external reporting
    const axios = require('axios');

    // Log locally first
    console.error('Auth0 Error:', JSON.stringify(errorRecord));

    // Check if we should send to external monitoring system
    const errorMonitoringEndpoint = context?.secrets?.ERROR_MONITORING_ENDPOINT;
    const errorMonitoringApiKey = context?.secrets?.ERROR_MONITORING_API_KEY;

    if (errorMonitoringEndpoint && errorMonitoringApiKey) {
      try {
        // Report error to external monitoring system
        await axios.post(errorMonitoringEndpoint, errorRecord, {
          headers: {
            'Authorization': `Bearer ${errorMonitoringApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 2000 // Short timeout to avoid blocking
        });
      } catch (reportingError) {
        // Failed to report to external system - just log locally
        console.error(`Failed to report error to monitoring system: ${reportingError.message}`);
      }
    }

    // For critical errors affecting user experience, could also trigger alert
    if (isCritical) {
      const alertEndpoint = context?.secrets?.ALERT_ENDPOINT;
      const alertApiKey = context?.secrets?.ALERT_API_KEY;

      if (alertEndpoint && alertApiKey) {
        try {
          // Send critical alert
          await axios.post(alertEndpoint, {
            service: 'Auth0',
            environment: process.env.NODE_ENV || 'unknown',
            message: `CRITICAL AUTH0 ERROR: ${error.message}`,
            details: errorRecord
          }, {
            headers: {
              'Authorization': `Bearer ${alertApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 2000 // Short timeout to avoid blocking
          });
        } catch (alertError) {
          console.error(`Failed to send alert: ${alertError.message}`);
        }
      }
    }

    // Return the error for further handling
    return errorRecord;
  } catch (monitoringError) {
    // Last-resort fallback if error monitoring itself fails
    console.error(`Error in error monitoring: ${monitoringError.message}`);
    console.error(`Original error: ${error.message}`);

    // Return minimal error info
    return {
      message: error.message,
      timestamp: new Date().toISOString(),
      monitoringFailed: true
    };
  }
};

/**
 * Helper to safely access nested properties
 * Useful for safely extracting properties from error objects
 */
exports.safeGet = (obj, path, defaultValue = undefined) => {
  try {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }

    return result === undefined ? defaultValue : result;
  } catch (error) {
    return defaultValue;
  }
};
