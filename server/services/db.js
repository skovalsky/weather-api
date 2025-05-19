const knex = require('knex');
const config = require('../knexfile');

// Используем NODE_ENV=development по умолчанию
const db = knex(config.development);

module.exports = db;
