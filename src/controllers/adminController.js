const pool = require('../config/db');
module.exports.dashboard = async (req, res) => {

    try {

        const products =
            await pool.query(
                'SELECT COUNT(*) FROM products'
            );

        const orders =
            await pool.query(
                'SELECT COUNT(*) FROM orders'
            );

        const customers =
            await pool.query(
                "SELECT COUNT(*) FROM users WHERE role='customer'"
            );

        const revenue =
            await pool.query(
                `
                SELECT
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS total
                FROM payments
                WHERE payment_status = 'COMPLETED'
                AND created_at >= date_trunc('month', CURRENT_DATE)
                `
            );

            const recentOrders = await pool.query(`
    SELECT
        o.order_id,
        u.full_name,
        o.total_amount,
        o.status,
        o.order_date
    FROM orders o
    JOIN users u
        ON o.user_id = u.user_id
    ORDER BY o.order_date DESC
    LIMIT 5
`);

const lowStockProducts = await pool.query(`
    SELECT
        product_id,
        name,
        stock_quantity
    FROM products
    WHERE stock_quantity <= 5
    ORDER BY stock_quantity ASC
    LIMIT 5
`);

        res.render(
            'admin/dashboard',
            {
                user:
                    req.session.user,

                totalProducts:
                    products.rows[0].count,

                totalOrders:
                    orders.rows[0].count,

                totalCustomers:
                    customers.rows[0].count,

                totalRevenue:
                    revenue.rows[0].total,
                recentOrders: recentOrders.rows,
                lowStockProducts: lowStockProducts.rows
            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).send(
            'Error loading dashboard'
        );

    }

};

module.exports.adminProducts = async (req, res) => {

    try {

        const products = await pool.query(`
            SELECT
                p.product_id,
                p.name,
                p.price,
                p.stock_quantity,
                p.image_url,
                p.is_active,
                p.category_id,
                c.name AS category
            FROM products p
            JOIN categories c
                ON p.category_id = c.category_id
            ORDER BY p.created_at DESC
        `);

        const categories = await pool.query(`
    SELECT
        category_id,
        name
    FROM categories
    WHERE is_active = true
    ORDER BY name ASC
`);

        res.render(
            'admin/products',
            {
                user: req.session.user,
                products: products.rows[0].product_id ? products.rows : [],
                categories: categories.rows
            }
        );

    } catch(error) {

        console.log(error);

        res.status(500).send(
            'Error loading products'
        );

    }

};


                   