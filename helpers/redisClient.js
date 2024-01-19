const redis = require('redis')
const { createClient } = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const REDIS_PORT = process.env.REDIS_PORT;

const redisClient = redis.createClient({
    host: 'localhost',
    port: REDIS_PORT
});

redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
});

redisClient.on('connect', (err) => {
    console.log('Connected to Redis');
});

redisClient.connect();

process.on('SIGINT', () => {
    redisClient.disconnect();
    process.exit(0);
});



const redisStore = new RedisStore({
    client: redisClient,
    prefix: "session:",
});



module.exports = { redisClient, redisStore };