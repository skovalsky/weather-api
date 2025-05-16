/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Confirm email subscription
* Confirms a subscription using the token sent in the confirmation email.
*
* token String Confirmation token
* no response value expected for this operation
* */
const confirmSubscription = ({ token }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        token,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Subscribe to weather updates
* Subscribe an email to receive weather updates for a specific city with chosen frequency.
*
* subscribeRequest SubscribeRequest 
* no response value expected for this operation
* */
const subscribe = ({ subscribeRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        subscribeRequest,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Unsubscribe from weather updates
* Unsubscribes an email from weather updates using the token sent in emails.
*
* token String Unsubscribe token
* no response value expected for this operation
* */
const unsubscribe = ({ token }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        token,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  confirmSubscription,
  subscribe,
  unsubscribe,
};
