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

module.exports.adminCategories = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                c.*,

                COUNT(p.product_id)
                AS products_count

            FROM categories c

            LEFT JOIN products p
                ON c.category_id = p.category_id

            GROUP BY c.category_id

            ORDER BY c.category_id DESC
        `);

        res.render(
            'admin/category',
            {
                user: req.session.user,
                categories: result.rows
            }
        );

    } catch(error){

        console.log(error);

        res.status(500).send(
            'Error loading categories'
        );

    }

};

module.exports.adminOrders = async (req, res) => {
    try {

        const ordersResult = await pool.query(`
            SELECT
                o.order_id,
                o.total_amount,
                o.status,
                o.order_date,

                u.full_name,
                u.email

            FROM orders o

            JOIN users u
                ON o.user_id = u.user_id

            ORDER BY o.order_date DESC
        `);

        const statsResult = await pool.query(`
    SELECT
        COUNT(*) AS total_orders,

        COUNT(*) FILTER (
            WHERE o.status = 'PENDING'
        ) AS pending_orders,

        COUNT(*) FILTER (
            WHERE p.payment_status = 'COMPLETED'
        ) AS paid_orders,

        COALESCE(
            SUM(
                CASE
                    WHEN p.payment_status = 'COMPLETED'
                    THEN o.total_amount
                    ELSE 0
                END
            ),
            0
        ) AS total_revenue

    FROM orders o

    LEFT JOIN payments p
        ON o.order_id = p.order_id
`);
        res.render(
            'admin/orders',
            {
                user: req.session.user,
                orders: ordersResult.rows,
                stats: statsResult.rows[0]
            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).send(
            'Error loading orders'
        );

    }
};

module.exports.getOrderDetails = async (req, res) => {

    try {

        const orderId =
            req.params.orderId;

        const orderResult =
            await pool.query(
                `
                SELECT
                    o.*,

                    u.full_name,
                    u.email,
                    u.phone

                FROM orders o

                JOIN users u
                    ON o.user_id = u.user_id

                WHERE o.order_id = $1
                `,
                [orderId]
            );

        if (
            orderResult.rows.length === 0
        ) {

            return res.status(404).json({
                success: false
            });

        }

        const itemsResult =
            await pool.query(
                `
                SELECT
                    oi.quantity,
                    oi.unit_price,

                    p.name

                FROM order_items oi

                JOIN products p
                    ON oi.product_id =
                    p.product_id

                WHERE oi.order_id = $1
                `,
                [orderId]
            );

        res.json({
            success: true,
            order:
                orderResult.rows[0],

            items:
                itemsResult.rows
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });

    }

};

module.exports.updateOrderStatus = async (req, res) => {

    try {

        const orderId =
            req.params.orderId;

        const { status } =
            req.body;

        const allowedStatuses = [
            'PAID',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED'
        ];

        if (
            !allowedStatuses.includes(
                status
            )
        ) {

            return res.status(400)
                .json({
                    success: false
                });

        }

        await pool.query(
            `
            UPDATE orders

            SET
                status = $1

            WHERE order_id = $2
            `,
            [
                status,
                orderId
            ]
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });

    }

};

module.exports.customersPage = async (req, res) => {

    try {

        const customersResult =
            await pool.query(`
                SELECT
                    u.user_id,
                    u.full_name,
                    u.email,
                    u.phone,
                    u.created_at,

                    COUNT(DISTINCT o.order_id)
                        AS total_orders,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN p.payment_status = 'COMPLETED'
                                THEN o.total_amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_spent

                FROM users u

                LEFT JOIN orders o
                    ON u.user_id = o.user_id

                LEFT JOIN payments p
                    ON o.order_id = p.order_id

                WHERE u.role = 'customer'

                GROUP BY u.user_id

                ORDER BY u.created_at DESC
            `);

        res.render(
            'admin/customers',
            {
                user: req.session.user,
                customers:
                    customersResult.rows
            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).send(
            'Error loading customers'
        );

    }

};

module.exports.getCustomerDetails = async (req, res) => {

    try {

        const customerId = req.params.customerId;

        const customerResult = await pool.query(
            `
            SELECT
                u.user_id,
                u.full_name,
                u.email,
                u.phone,
                u.created_at,

                COUNT(o.order_id) AS total_orders,

                COALESCE(
                    SUM(o.total_amount),
                    0
                ) AS total_spent

            FROM users u

            LEFT JOIN orders o
                ON u.user_id = o.user_id

            WHERE u.user_id = $1

            GROUP BY u.user_id
            `,
            [customerId]
        );

        if(customerResult.rows.length === 0){

            return res.redirect(
                '/admin/customers'
            );

        }

        const ordersResult =
            await pool.query(
                `
                SELECT
                    o.order_id,
                    o.total_amount,
                    o.status,
                    o.order_date,

                    p.payment_status

                FROM orders o

                LEFT JOIN payments p
                    ON o.order_id = p.order_id

                WHERE o.user_id = $1

                ORDER BY o.order_date DESC
                `,
                [customerId]
            );

        res.render(
            'admin/customer-details',
            {
                user: req.session.user,
                customer:
                    customerResult.rows[0],

                orders:
                    ordersResult.rows
            }
        );

    } catch(error){

        console.log(error);

        res.status(500).send(
            'Error loading customer'
        );

    }

};
                   