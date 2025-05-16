/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Get current weather for a city
* Returns the current weather forecast for the specified city using WeatherAPI.com.
*
* city String City name for weather forecast
* returns getWeather_200_response
* */
const getWeather = ({ city }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        city,
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
  getWeather,
};
