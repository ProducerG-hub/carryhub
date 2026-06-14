const pool = require('../config/db');

async function getCartItems(userId) {
    const cartQuery = `
        SELECT
            ci.cart_item_id,
            ci.quantity,
            p.product_id,
            p.name,
            p.description,
            p.price,
            p.image_url,
            p.stock_quantity,
            c.name AS category,
            (ci.quantity * p.price) AS line_total
        FROM cart_items ci
        JOIN cart ct
            ON ci.cart_id = ct.cart_id
        JOIN products p
            ON ci.product_id = p.product_id
        JOIN categories c
            ON p.category_id = c.category_id
        WHERE ct.user_id = $1
        ORDER BY ci.cart_item_id DESC
    `;

    const result = await pool.query(cartQuery, [userId]);
    const items = result.rows;
    const cartSubtotal = items.reduce((total, item) => total + Number(item.line_total), 0);
    const cartItemCount = items.reduce((total, item) => total + Number(item.quantity), 0);

    return {
        items,
        cartSubtotal,
        cartItemCount
    };
}

async function getCartItemOwnership(userId, cartItemId) {
    const result = await pool.query(
        `
        SELECT
            ci.cart_item_id,
            ci.quantity
        FROM cart_items ci
        JOIN cart ct
            ON ci.cart_id = ct.cart_id
        WHERE ct.user_id = $1
        AND ci.cart_item_id = $2
        `,
        [userId, cartItemId]
    );

    return result.rows[0] || null;
}

module.exports.addToCart = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const rawProductId = req.params.productId || req.body.product_id;
        const productId = parseInt(rawProductId, 10);

        if (!Number.isInteger(productId)) {
            return res.status(400).send('Invalid product id');
        }

        const quantity = Math.max(parseInt(req.body.quantity, 10) || 1, 1);

        // 1. Check if user cart exists

        let cartResult = await pool.query(
            `
            SELECT cart_id
            FROM cart
            WHERE user_id = $1
            `,
            [userId]
        );

        let cartId;

        // 2. Create cart if not exists

        if (cartResult.rows.length === 0) {

            const newCart = await pool.query(
                `
                INSERT INTO cart(user_id)
                VALUES($1)
                RETURNING cart_id
                `,
                [userId]
            );

            cartId =
                newCart.rows[0].cart_id;

        } else {

            cartId =
                cartResult.rows[0].cart_id;
        }

        // 3. Check if product already exists

        const existingItem =
            await pool.query(
                `
                SELECT
                    cart_item_id,
                    quantity
                FROM cart_items
                WHERE cart_id = $1
                AND product_id = $2
                `,
                [cartId, productId]
            );

        // 4. Update quantity

        if (existingItem.rows.length > 0) {

            await pool.query(
                `
                UPDATE cart_items
                SET quantity = quantity + $3
                WHERE cart_id = $1
                AND product_id = $2
                `,
                [cartId, productId, quantity]
            );

        } else {

            // 5. Insert new item
            if (quantity < 1) {
                return res.status(400).send('Quantity must be at least 1');
            }

            // before inserting check if the product exists and has enough stock
            const productResult = await pool.query(
                `
                SELECT stock_quantity
                FROM products
                WHERE product_id = $1
                `,
                [productId]
            );

            if (productResult.rows.length === 0) {
                return res.status(404).send('Product not found');
            }

            const product = productResult.rows[0];
            if (quantity > product.stock_quantity) {
                return res.status(400).send('Not enough stock available');
            }

            await pool.query(
                `
                INSERT INTO cart_items(
                    cart_id,
                    product_id,
                    quantity
                )
                VALUES($1,$2,$3)
                `,
                [
                    cartId,
                    productId,
                    quantity
                ]
            );
        }

        res.redirect('/products');

    } catch (error) {

        console.log(error);

        res.status(500).send(
            'Error adding product to cart'
        );

    }

};

module.exports.getCart = async (req, res) => {
    try {
        const cart = await getCartItems(req.session.user.id);

        res.render('pages/cart', {
            user: req.session.user,
            items: cart.items,
            cartSubtotal: cart.cartSubtotal,
            cartItemCount: cart.cartItemCount
        });
    } catch (error) {
        console.log(error);

        res.status(500).send('Error fetching cart');
    }
};

module.exports.getCartApi = async (req, res) => {
    try {
        const cart = await getCartItems(req.session.user.id);

        res.json({
            success: true,
            ...cart
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: 'Error fetching cart'
        });
    }
};

module.exports.adjustCartItemQuantity = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const cartItemId =
            parseInt(req.params.cartItemId, 10);

        const delta =
            parseInt(req.body.delta, 10);

        if (
            !Number.isInteger(cartItemId) ||
            !Number.isInteger(delta) ||
            ![-1, 1].includes(delta)
        ) {

            return res
                .status(400)
                .send('Invalid cart update request');

        }

        const cartItem =
            await getCartItemOwnership(
                userId,
                cartItemId
            );

        if (!cartItem) {

            return res
                .status(404)
                .send('Cart item not found');

        }

        // =====================================
        // INCREASE QUANTITY
        // =====================================

        if (delta > 0) {

            const newQuantity =
                cartItem.quantity + 1;

            if (
                newQuantity >
                cartItem.stock_quantity
            ) {

                return res.status(400).send(
                    `${cartItem.name} only has ${cartItem.stock_quantity} items available in stock`
                );

            }

            await pool.query(
                `
                UPDATE cart_items
                SET quantity = quantity + 1
                WHERE cart_item_id = $1
                `,
                [cartItemId]
            );

        }

        // =====================================
        // DECREASE QUANTITY
        // =====================================

        else if (cartItem.quantity > 1) {

            await pool.query(
                `
                UPDATE cart_items
                SET quantity = quantity - 1
                WHERE cart_item_id = $1
                `,
                [cartItemId]
            );

        }

        // =====================================
        // REMOVE ITEM
        // =====================================

        else {

            await pool.query(
                `
                DELETE FROM cart_items
                WHERE cart_item_id = $1
                `,
                [cartItemId]
            );

        }

        return res.redirect('/cart');

    } catch (error) {

        console.log(error);

        return res
            .status(500)
            .send('Error updating cart item');

    }

};

module.exports.removeCartItem = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const cartItemId = parseInt(req.params.cartItemId, 10);

        if (!Number.isInteger(cartItemId)) {
            return res.status(400).send('Invalid cart item');
        }

        const cartItem = await getCartItemOwnership(userId, cartItemId);

        if (!cartItem) {
            return res.status(404).send('Cart item not found');
        }

        await pool.query(
            `
            DELETE FROM cart_items
            WHERE cart_item_id = $1
            `,
            [cartItemId]
        );

        return res.redirect('/cart');
    } catch (error) {
        console.log(error);
        return res.status(500).send('Error removing cart item');
    }
};