const express = require('express');
const redis = require('redis');
const app = express();

app.use(express.json());

const client = redis.createClient({
  url: process.env.REDIS_URL
});
client.connect();

app.post('/tap', async (req, res) => {
  const time = new Date().toISOString();
  await client.lpush('button_taps', time);
  res.json({success: true});
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Redis Tap Server Running!');
});
