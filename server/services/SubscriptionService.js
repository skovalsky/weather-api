/* eslint-disable no-unused-vars */
const db = require('./db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const logger = require('../logger');
const fs = require('fs');
const path = require('path');
const Service = require('./Service');

const CONFIRM_LOG_PATH = path.join(__dirname, '../combined.log');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function sanitize(input) {
  // Простая XSS-фильтрация
  return String(input).replace(/[<>"'`]/g, '');
}

/**
* Confirm email subscription
* Confirms a subscription using the token sent in the confirmation email.
*
* token String Confirmation token
* no response value expected for this operation
* */
const confirmSubscription = ({ token }) => new Promise(
  async (resolve, reject) => {
    logger.info('[CONFIRM] token:', token);
    try {
      if (!token) {
        logger.warn('[CONFIRM] Invalid token');
        return reject(Service.rejectResponse('Invalid token', 400));
      }
      const sub = await db('subscriptions').where({ token }).first();
      logger.info('[CONFIRM] subscription:', sub);
      if (!sub || sub.unsubscribed_at) {
        logger.warn('[CONFIRM] Token not found or unsubscribed');
        return reject(Service.rejectResponse('Token not found', 404));
      }
      if (sub.confirmed) {
        logger.info('[CONFIRM] Already confirmed');
        return resolve(Service.successResponse({ confirmed: true }, 200));
      }
      await db('subscriptions').where({ id: sub.id }).update({ confirmed: true, confirmed_at: db.fn.now() });
      logger.info('[CONFIRM] Confirmed subscription');
      resolve(Service.successResponse({ confirmed: true }, 200));
    } catch (err) {
      logger.error('[CONFIRM] Exception:', err);
      reject(Service.rejectResponse('Internal error', 500));
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
    logger.info('[SUBSCRIBE] subscribeRequest:', subscribeRequest);
    try {
      if (!subscribeRequest || !subscribeRequest.email || !subscribeRequest.city || !subscribeRequest.frequency) {
        logger.warn('[SUBSCRIBE] Invalid input:', subscribeRequest);
        return reject(Service.rejectResponse('Invalid input', 400));
      }
      const email = sanitize(subscribeRequest.email.trim().toLowerCase());
      const city = sanitize(subscribeRequest.city.trim());
      const frequency = sanitize(subscribeRequest.frequency.trim());
      logger.info(`[SUBSCRIBE] sanitized: email=${email}, city=${city}, frequency=${frequency}`);
      // Email валидация (простая)
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        logger.warn(`[SUBSCRIBE] Invalid email: ${email}`);
        return reject(Service.rejectResponse('Invalid email', 400));
      }
      // Проверка на дубли
      const existing = await db('subscriptions').where({ email, city }).first();
      logger.info(`[SUBSCRIBE] existing:`, existing);
      if (existing && existing.confirmed && !existing.unsubscribed_at) {
        logger.warn(`[SUBSCRIBE] Already subscribed: ${email}, ${city}`);
        return reject(Service.rejectResponse('Email already subscribed', 409));
      }
      // Генерация токена
      const token = crypto.randomBytes(32).toString('hex');
      // Сохраняем подписку (или обновляем)
      if (existing) {
        await db('subscriptions').where({ id: existing.id }).update({ token, confirmed: false, confirmed_at: null, unsubscribed_at: null, created_at: db.fn.now() });
        logger.info(`[SUBSCRIBE] Updated existing subscription for ${email}, city=${city}`);
      } else {
        await db('subscriptions').insert({ email, city, token, confirmed: false });
        logger.info(`[SUBSCRIBE] Inserted new subscription for ${email}, city=${city}`);
      }
      // Логируем ссылку подтверждения
      const confirmUrl = `${FRONTEND_URL}/confirm/${token}`;
      fs.appendFileSync(CONFIRM_LOG_PATH, `[CONFIRM] ${email} ${confirmUrl}\n`);
      logger.info(`[CONFIRM] ${email} ${confirmUrl}`);
      // Эмуляция отправки письма (реальный вызов закомментирован)
      /*
      const transporter = nodemailer.createTransport({
        // ...
      });
      await transporter.sendMail({
        from: 'no-reply@weatherapi.app',
        to: email,
        subject: 'Confirm your subscription',
        text: `Please confirm: ${confirmUrl}`
      });
      */
      resolve(Service.successResponse({ success: true }, 200));
    } catch (err) {
      logger.error('[SUBSCRIBE] Exception:', err);
      reject(Service.rejectResponse('Internal error', 500));
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
    logger.info('[UNSUBSCRIBE] token:', token);
    try {
      if (!token) {
        logger.warn('[UNSUBSCRIBE] Invalid token');
        return reject(Service.rejectResponse('Invalid token', 400));
      }
      const sub = await db('subscriptions').where({ token }).first();
      logger.info('[UNSUBSCRIBE] subscription:', sub);
      if (!sub || sub.unsubscribed_at) {
        logger.warn('[UNSUBSCRIBE] Token not found or already unsubscribed');
        return reject(Service.rejectResponse('Token not found', 404));
      }
      await db('subscriptions').where({ id: sub.id }).update({ unsubscribed_at: db.fn.now() });
      logger.info('[UNSUBSCRIBE] Unsubscribed');
      resolve(Service.successResponse({ unsubscribed: true }, 200));
    } catch (err) {
      logger.error('[UNSUBSCRIBE] Exception:', err);
      reject(Service.rejectResponse('Internal error', 500));
    }
  },
);

module.exports = {
  confirmSubscription,
  subscribe,
  unsubscribe,
};
