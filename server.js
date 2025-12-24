const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const STATE_FILE = path.join(__dirname, 'state.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize state file if it doesn't exist
function initState() {
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ armed: true, exploded: false }));
  }
}

// Get current state
function getState() {
  initState();
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

// Save state
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

// API: Get timer status
app.get('/api/status', (req, res) => {
  const state = getState();
  res.json(state);
});

// API: Toggle arm/disarm with code
app.post('/api/toggle', (req, res) => {
  const { code } = req.body;
  const SECRET_CODE = 'yulelog';

  if (code.toLowerCase() !== SECRET_CODE) {
    return res.status(401).json({ success: false, message: 'WRONG CODE! The bomb ticks ever closer...' });
  }

  const state = getState();
  state.armed = !state.armed;

  // If rearming, reset exploded state
  if (state.armed) {
    state.exploded = false;
  }

  saveState(state);

  res.json({
    success: true,
    armed: state.armed,
    message: state.armed ? 'BOMB RE-ARMED! The countdown continues...' : 'BOMB DISARMED! Crisis averted... this time.'
  });
});

// API: Mark as exploded
app.post('/api/explode', (req, res) => {
  const state = getState();
  if (state.armed && !state.exploded) {
    state.exploded = true;
    saveState(state);
  }
  res.json(state);
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎄 Christmas Bomb Server running on port ${PORT}`);
  console.log(`🎅 Visit http://localhost:${PORT} to see the countdown!`);
  initState();
});
