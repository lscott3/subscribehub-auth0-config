// shared/actions/send-custom-mfa-sms.js
/**
 * Handler that will be called during the execution of a SendPhoneMessage flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {SendPhoneMessageAPI} api - Methods and utilities to help change the behavior of sending a phone message.
 */
exports.onExecuteSendPhoneMessage = async (event, api) => {
  // Get the message type from the event
  const { message, channel } = event;

  // Customize the message based on message type
  if (message.type === 'otp') {
    const otpCode = message.body.match(/\d+/)[0]; // Extract the OTP code

    // Create a custom message with SubscribeHub branding
    const customMessage = `Your SubscribeHub verification code is ${otpCode}. Valid for 10 minutes. Don't share this code with anyone.`;

    // Set the custom message
    api.message.setMessage({ body: customMessage });
  }

  // Continue with sending the message
  api.message.send();
};
