require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

module.exports.Register = async (req, res) => {
    const { full_name, email, password_hash, password, phone } = req.body;
    const rawPassword = password_hash || password;
    
    if (!full_name || !email || !rawPassword || !phone) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try{
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);
        const result = await pool.query('INSERT INTO users (full_name, email, password_hash, phone) VALUES ($1, $2, $3, $4)', [full_name, email, hashedPassword, phone]);

        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports.Login = async (req, res) => {
    const { email, password_hash, password } = req.body;
    const rawPassword = password_hash || password;

    if (!email || !rawPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Bad credentials' });
        }
        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(rawPassword, user.password_hash);
        if (!passwordMatch) {
            return res.status(400).json({ success: false, message: 'Bad credentials' });
        }
        //user session data
        req.session.user = {
            id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone
        };
        res.redirect('/');
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports.Logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.clearCookie('connect.sid');
        return res.redirect('/login');
    });
}

module.exports.userProfile = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    res.status(200).json({ success: true, user: req.session.user });
}