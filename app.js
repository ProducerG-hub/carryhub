require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const pool = require('./config/db');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to CarryHub Backend!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});