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
    const { email, password_hash, password, next } = req.body;
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
            phone: user.phone,
            created_at: user.created_at,
            role: user.role
        };

        // Redirect admin users to the admin dashboard
        if (user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }

        const safeNext = typeof next === 'string' && next.startsWith('/') ? next : '/';
        res.redirect(safeNext);

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


module.exports.userProfile = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect('/login');
        }

        const userId = req.session.user.id;

        const totalOrdersQuery = `
            SELECT COUNT(*) AS total_orders
            FROM orders
            WHERE user_id = $1
        `;

        const pendingOrdersQuery = `
            SELECT COUNT(*) AS pending_orders
            FROM orders
            WHERE user_id = $1
            AND status = 'PENDING'
        `;

        const deliveredOrdersQuery = `
            SELECT COUNT(*) AS delivered_orders
            FROM orders
            WHERE user_id = $1
            AND status = 'DELIVERED'
        `;

        const totalOrdersResult = await pool.query(totalOrdersQuery, [userId]);
        const pendingOrdersResult = await pool.query(pendingOrdersQuery, [userId]);
        const deliveredOrdersResult = await pool.query(deliveredOrdersQuery, [userId]);

        res.render('pages/profile', {

            user: req.session.user,
            totalOrders: totalOrdersResult.rows[0].total_orders,
            pendingOrders: pendingOrdersResult.rows[0].pending_orders,
            deliveredOrders: deliveredOrdersResult.rows[0].delivered_orders

        });

    }
     catch (error) {

        console.log(error);

         res.render('pages/profile', {
        user: req.session.user,
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0
    });

    }

};