/**
 * The WeatherController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

/*const Controller = require('./Controller');
const service = require('../services/WeatherService');
const getWeather = async (request, response) => {
  await Controller.handleRequest(request, response, service.getWeather);
};


module.exports = {
  getWeather,
};*/
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.WEATHER_API_KEY;

exports.getWeather = async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: 'City is required' });

  try {
    const response = await axios.get(
      `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`
    );
    const { current } = response.data;
    res.json({
      temperature: current.temp_c,
      humidity: current.humidity,
      description: current.condition.text,
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.status === 404 ? 'City not found' : 'Invalid request' });
  }
};
