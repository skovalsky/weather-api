/**
 * The SubscriptionController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/SubscriptionService');
const confirmSubscription = async (request, response) => {
  await Controller.handleRequest(request, response, service.confirmSubscription);
};

const subscribe = async (request, response) => {
  const logger = require('../logger');
  logger.info('[CONTROLLER] request.body:', request.body);
  // Передаём плоское тело запроса как subscribeRequest
  await Controller.handleRequest(request, response, (params) => service.subscribe({ subscribeRequest: request.body }));
};

const unsubscribe = async (request, response) => {
  await Controller.handleRequest(request, response, service.unsubscribe);
};


module.exports = {
  confirmSubscription,
  subscribe,
  unsubscribe,
};
