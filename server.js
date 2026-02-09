const express = require('express');
const { createClient } = require('redis');
const app = express();
app.use(express.json());

let client = null;

// CRASH-PROOF Redis connection
async function connectRedis() {
  try {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        reconnectStrategy: retries => Math.min(retries * 50, 500),
        pingInterval: 1000  // KEEPS ALIVE
      }
    });

    // HANDLE ALL ERRORS - NO CRASH
    client.on('error', err => console.log('Redis retrying:', err.message));
    client.on('connect', () => console.log('Redis connecting...'));
    client.on('ready', () => console.log('✅ REDIS READY!'));
    
    await client.connect();
  } catch (error) {
    console.log('Redis will retry:', error.message);
  }
}

connectRedis();

// API ENDPOINT - WORKS EVEN IF REDIS DOWN
app.post('/tap', async (req, res) => {
  try {
    if (!client) {
      return res.json({success: false, message: 'Redis connecting...'});
    }
    const time = new Date().toISOString();
    await client.lPush('button_taps', time);
    res.json({success: true, time});
  } catch (error) {
    res.json({success: false, error: error.message});
  }
});

// TEST ENDPOINT
app.get('/test', (req, res) => res.json({status: 'API ALIVE!'}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running: https://your-app.up.railway.app`);
  console.log(`📡 Redis URL: ${process.env.REDIS_URL ? 'SET' : 'MISSING!'}`);
});
