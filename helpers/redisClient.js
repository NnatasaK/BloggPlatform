

const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

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


const redisStore = new RedisStore({
    client: redisClient,
    prefix: "session:",
});

module.exports = { redisClient, redisStore };
