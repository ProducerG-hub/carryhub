const axios = require('axios');
const { generateAccessToken } = require('../utils/paypal');
const pool = require('../config/db');
require('dotenv').config();

module.exports.createPaypalOrder = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const result = await pool.query(
            `
            SELECT
                ci.quantity,
                p.price
            FROM cart_items ci
            JOIN cart c
                ON ci.cart_id = c.cart_id
            JOIN products p
                ON ci.product_id = p.product_id
            WHERE c.user_id = $1
            `,
            [userId]
        );

        const subtotal =
            result.rows.reduce(
                (sum, item) =>
                    sum +
                    Number(item.price) *
                    Number(item.quantity),
                0
            );

        const usdAmount =
            (subtotal / 2600).toFixed(2);
            
            console.log('Subtotal in UGX:', subtotal);
            console.log('USD Amount:', usdAmount);

        const accessToken =
            await generateAccessToken();

        const paypalResponse =
            await axios.post(

                `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,

                {
                    intent: 'CAPTURE',

                    purchase_units: [
                        {
                            amount: {
                                currency_code: 'USD',
                                value: usdAmount
                            }
                        }
                    ]
                },

                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

        res.json({
            id: paypalResponse.data.id
        });

    } catch (error) {

        console.log(error.response?.data || error);

        res.status(500).json({
            message: 'Failed to create PayPal order'
        });
    }
};