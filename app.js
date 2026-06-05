require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const pool = require('./config/db');
const session = require('express-session');
const router = require('./routes/urls');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day validity
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);


app.get('/', (req, res) => {
  res.send('Welcome to CarryHub Backend!');
});

// graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    pool.end(() => {
        console.log('Database connection closed.');
        process.exit(0);
    }
    );
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});