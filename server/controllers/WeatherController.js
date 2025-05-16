const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.WEATHER_API_KEY;

const WeatherController = {
  async getWeather(req, res) {
    const { city } = req.query;
    console.log('DEBUG: WEATHER_API_KEY:', API_KEY);
    console.log('DEBUG: city param:', city);
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
      console.error('DEBUG: error object:', error);
      console.error('DEBUG: error.response:', error.response?.data);
      res.status(error.response?.status || 500).json({ error: error.response?.status === 404 ? 'City not found' : 'Invalid request', details: error.response?.data || error.message });
    }
  }
};

module.exports = WeatherController;
