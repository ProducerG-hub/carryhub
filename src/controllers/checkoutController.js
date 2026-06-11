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