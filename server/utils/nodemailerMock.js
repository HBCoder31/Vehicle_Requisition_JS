module.exports = {
  createTransport: function() {
    return {
      sendMail: function(mailOptions) {
        return Promise.resolve({ messageId: 'mocked-id-12345' });
      }
    };
  }
};
