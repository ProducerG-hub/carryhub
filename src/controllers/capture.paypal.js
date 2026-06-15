const axios = require('axios');
const { generateAccessToken } = require('../utils/paypal');
const { createOrderFromCart } = require('../services/order.service');
require('dotenv').config();

module.exports.capturePaypalOrder =
async (req, res) => {

    try {

        const {
            paypalOrderId,
            region,
            district,
            address,
            notes
        } = req.body;

        const accessToken =
            await generateAccessToken();

        const response =
            await axios.post(

                `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`,

                {},

                {
                    headers: {
                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            );

        if (
            response.data.status !==
            'COMPLETED'
        ) {

            return res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }

        const payment_transaction_id =
            response.data.purchase_units[0]
                .payments.captures[0].id;

        const shippingAddress = `
Region: ${region}
District: ${district}
Address: ${address}
        `.trim();

        const orderId =
            await createOrderFromCart(
                req.session.user.id,
                shippingAddress,
                notes,
                payment_transaction_id
            );

        return res.json({
            success: true,
            orderId
        });

    } catch (error) {

        console.log(
            error.response?.data ||
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Payment processing failed'
        });
    }
};