const redis = require('redis')
const { createClient } = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const REDIS_PORT = process.env.REDIS_PORT;

const client = redis.createClient({
    host: 'localhost',
    port: REDIS_PORT
});

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

client.on('connect', (err) => {
    console.log('Connected to Redis');
});

client.connect();

process.on('SIGINT', () => {
    client.disconnect();
    process.exit(0);
});



const redisStore = new RedisStore({
    client: client,
    prefix: "session:",
});



module.exports = { client, redisStore };