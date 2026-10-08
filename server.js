const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const submitHandler = require('./api/submit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// API Endpoint for Survey Submissions
app.post('/api/submit', submitHandler);

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`BitFinder Survey server running at http://localhost:${PORT}`);
  console.log(`Supabase URL Configured: ${process.env.SUPABASE_URL ? 'YES' : 'NO (Set in .env)'}`);
});
