require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const pool = require('./src/config/db');
const session = require('express-session');
const router = require('./src/routes/urls');


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // Set to true if using HTTPS, 1 day validity
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory
app.set('view engine', 'ejs'); // Set EJS as the view engine
app.set('views', path.join(__dirname,'src','views')); // Set the views directory

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use(async (req, res, next) => {
    if (!req.session.user?.id) {
        res.locals.cartItemCount = 0;
        return next();
    }

    try {
        const result = await pool.query(
            `
            SELECT COALESCE(SUM(ci.quantity), 0) AS total
            FROM cart_items ci
            JOIN cart ct
                ON ci.cart_id = ct.cart_id
            WHERE ct.user_id = $1
            `,
            [req.session.user.id]
        );

        res.locals.cartItemCount = parseInt(result.rows[0].total, 10) || 0;
    } catch (error) {
        console.log(error);
        res.locals.cartItemCount = 0;
    }

    next();
});

app.use(router);


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