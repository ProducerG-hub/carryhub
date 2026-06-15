const pool = require('../config/db');

async function createOrderFromCart(
    userId,
    shippingAddress,
    notes,
    paypalTransactionId
) {

    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        const cartResult = await client.query(
            `
            SELECT
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

        if (!items.length) {
            throw new Error('Cart is empty');
        }

        for (const item of items) {

            if (
                item.quantity >
                item.stock_quantity
            ) {

                throw new Error(
                    `${item.name} is out of stock`
                );
            }
        }

        const totalAmount =
            items.reduce(
                (sum, item) =>
                    sum + Number(item.line_total),
                0
            );

        const orderResult =
            await client.query(
                `
                INSERT INTO orders(
                    user_id,
                    total_amount,
                    shipping_address
                )
                VALUES(
                    $1,
                    $2,
                    $3
                )
                RETURNING order_id
                `,
                [
                    userId,
                    totalAmount,
                    shippingAddress
                ]
            );

        const orderId =
            orderResult.rows[0].order_id;

        for (const item of items) {

            await client.query(
                `
                INSERT INTO order_items(
                    order_id,
                    product_id,
                    quantity,
                    unit_price
                )
                VALUES(
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

        await client.query(
            `
            INSERT INTO payments(
                order_id,
                paypal_transaction_id,
                amount,
                payment_method,
                payment_status,
                payment_date
            )
            VALUES(
                $1,
                $2,
                $3,
                'PAYPAL',
                'COMPLETED',
                NOW()
            )
            `,
            [
                orderId,
                paypalTransactionId,
                totalAmount
            ]
        );

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

        return orderId;

    } catch (error) {

        await client.query('ROLLBACK');

        throw error;

    } finally {

        client.release();

    }
}

module.exports = {
    createOrderFromCart
};