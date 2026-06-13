const pool = require('../config/db');

module.exports.getCheckoutPage = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const query = `
            SELECT
                ci.cart_item_id,
                ci.quantity,

                p.product_id,
                p.name,
                p.price,
                p.image_url,

                (p.price * ci.quantity) AS line_total

            FROM cart_items ci

            JOIN cart c
            ON ci.cart_id = c.cart_id

            JOIN products p
            ON ci.product_id = p.product_id

            WHERE c.user_id = $1

            ORDER BY ci.cart_item_id DESC
        `;

        const result =
            await pool.query(query, [userId]);

        const items = result.rows;

        if (items.length === 0) {

            return res.render('pages/cart', {
                user: req.session.user,
                items: [],
                cartSubtotal: 0,
                cartItemCount: 0
            });

        }

        const cartSubtotal =
            items.reduce(
                (total, item) =>
                    total + Number(item.line_total),
                0
            );

        res.render(
            'pages/checkout',
            {
                user: req.session.user,
                items,
                cartSubtotal
            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).send(
            'Error loading checkout page'
        );

    }

}

module.exports.placeOrder = async (req, res) => {

    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        const userId = req.session.user.id;

        const {
            region,
            district,
            address,
            notes
        } = req.body;

        // ==================================================
        // GET USER CART ITEMS
        // ==================================================

        const cartResult = await client.query(
            `
            SELECT
                ci.cart_item_id,
                ci.quantity,

                p.product_id,
                p.name,
                p.price,
                p.stock_quantity,

                (ci.quantity * p.price) AS line_total

            FROM cart_items ci

            JOIN cart c
                ON ci.cart_id = c.cart_id

            JOIN products p
                ON ci.product_id = p.product_id

            WHERE c.user_id = $1
            `,
            [userId]
        );

        const items = cartResult.rows;

        if (items.length === 0) {

            await client.query('ROLLBACK');

            return res.redirect('/cart');

        }

        // ==================================================
        // STOCK VALIDATION
        // ==================================================

        for (const item of items) {

            if (
                item.quantity >
                item.stock_quantity
            ) {

                await client.query(
                    'ROLLBACK'
                );

                return res.status(400).send(
                    `${item.name} only has ${item.stock_quantity} items left in stock`
                );
            }
        }

        // ==================================================
        // CALCULATE TOTAL
        // ==================================================

        const totalAmount =
            items.reduce(
                (total, item) =>
                    total + Number(item.line_total),
                0
            );

        // ==================================================
        // BUILD SHIPPING ADDRESS
        // ==================================================

        const shippingAddress = `
Region: ${region}
District: ${district}
Address: ${address}
        `.trim();

        // ==================================================
        // CREATE ORDER
        // ==================================================

        const orderResult =
            await client.query(
                `
                INSERT INTO orders (
                    user_id,
                    total_amount,
                    shipping_address,
                    notes
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )
                RETURNING order_id
                `,
                [
                    userId,
                    totalAmount,
                    shippingAddress,
                    notes || null
                ]
            );

        const orderId =
            orderResult.rows[0].order_id;

        // ==================================================
        // INSERT ORDER ITEMS
        // ==================================================

        for (const item of items) {

            await client.query(
                `
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    quantity,
                    unit_price
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )
                `,
                [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.price
                ]
            );

            // ==========================================
            // REDUCE STOCK
            // ==========================================

            await client.query(
                `
                UPDATE products
                SET stock_quantity =
                    stock_quantity - $1
                WHERE product_id = $2
                `,
                [
                    item.quantity,
                    item.product_id
                ]
            );
        }

        // ==================================================
        // CLEAR CART
        // ==================================================

        await client.query(
            `
            DELETE FROM cart_items
            WHERE cart_id = (
                SELECT cart_id
                FROM cart
                WHERE user_id = $1
            )
            `,
            [userId]
        );

        await client.query('COMMIT');

        return res.redirect(
            `/order-success/${orderId}/`
        );

    } catch (error) {

        await client.query(
            'ROLLBACK'
        );

        console.log(error);

        return res.status(500).send(
            'Error placing order'
        );

    } finally {

        client.release();

    }

};

// get user orders
module.exports.getOrders = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const result = await pool.query(
            `
            SELECT
                o.order_id,
                o.total_amount,
                o.status,
                o.order_date,

                COUNT(oi.order_item_id) AS item_count

            FROM orders o

            LEFT JOIN order_items oi
                ON o.order_id = oi.order_id

            WHERE o.user_id = $1

            GROUP BY o.order_id

            ORDER BY o.order_date DESC
            `,
            [userId]
        );

        res.render(
            'pages/orders',
            {
                user: req.session.user,
                orders: result.rows
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

        const userId = req.session.user.id;
        const orderId = parseInt(req.params.orderId);

        // Order Header

        const orderResult = await pool.query(
            `
            SELECT
                order_id,
                total_amount,
                shipping_address,
                status,
                order_date
            FROM orders
            WHERE order_id = $1
            AND user_id = $2
            `,
            [orderId, userId]
        );

        if(orderResult.rows.length === 0){
            return res.status(404).send('Order not found');
        }

        // Order Items

        const itemsResult = await pool.query(
            `
            SELECT
                oi.quantity,
                oi.unit_price,

                p.name,
                p.description,
                p.image_url,

                (oi.quantity * oi.unit_price) AS line_total

            FROM order_items oi

            JOIN products p
                ON oi.product_id = p.product_id

            WHERE oi.order_id = $1
            `,
            [orderId]
        );

        res.render(
            'pages/order-details',
            {
                user: req.session.user,
                order: orderResult.rows[0],
                items: itemsResult.rows
            }
        );

    } catch(error){

        console.log(error);

        res.status(500).send(
            'Error loading order'
        );

    }

};