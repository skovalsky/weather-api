'use strict';

exports.up = function(knex) {
  return knex.schema.createTable('subscriptions', function(table) {
    table.increments('id').primary();
    table.string('email').notNullable();
    table.string('city').notNullable();
    table.string('token').notNullable();
    table.boolean('confirmed').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('confirmed_at').nullable();
    table.timestamp('unsubscribed_at').nullable();
    table.unique(['email', 'city']);
    table.unique(['token']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('subscriptions');
};
