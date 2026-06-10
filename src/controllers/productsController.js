const pool = require('../config/db');
module.exports.getProducts = (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const category = req.query.category || '';
    const search = req.query.search || '';

    const limit = 8;
    const offset = (page - 1) * limit;

    let whereClause = `
        WHERE P.is_active = true
        AND C.is_active = true
    `;

    let params = [];
    let paramIndex = 1;

    if (category) {

        whereClause += `
            AND P.category_id = $${paramIndex}
        `;

        params.push(category);
        paramIndex++;
    }

    if (search) {

        whereClause += `
            AND (
                LOWER(P.name) LIKE LOWER($${paramIndex})
                OR LOWER(P.description) LIKE LOWER($${paramIndex})
            )
        `;

        params.push(`%${search}%`);
        paramIndex++;
    }

    const categoryQuery = `
        SELECT
            category_id,
            name
        FROM categories
        WHERE is_active = true
        ORDER BY name ASC
    `;

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM products P
        JOIN categories C
        ON P.category_id = C.category_id
        ${whereClause}
    `;

    const productQuery = `
        SELECT
            P.product_id,
            P.name,
            P.description,
            P.price,
            P.image_url,
            P.stock_quantity,
            C.name AS category
        FROM products P
        JOIN categories C
        ON P.category_id = C.category_id
        ${whereClause}
        ORDER BY P.product_id DESC
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
    `;

    pool.query(categoryQuery, (catErr, catResult) => {

        if (catErr) {
            console.log(catErr);
            return res.status(500).send('Error fetching categories');
        }

        pool.query(countQuery, params, (countErr, countResult) => {

            if (countErr) {
                console.log(countErr);
                return res.status(500).send('Error counting products');
            }

            const totalProducts =
                parseInt(countResult.rows[0].total);

            const totalPages =
                Math.ceil(totalProducts / limit);

            const productParams = [
                ...params,
                limit,
                offset
            ];

            pool.query(
                productQuery,
                productParams,
                (productErr, productResult) => {

                    if (productErr) {
                        console.log(productErr);
                        return res.status(500).send('Error fetching products');
                    }

                    res.render('pages/products', {

                        products: productResult.rows,

                        categories: catResult.rows,

                        currentPage: page,

                        totalPages,

                        totalProducts,

                        selectedCategory: category,

                        search,

                        user: req.session.user

                    });

                }
            );

        });

    });

};

// Get product by id
module.exports.getProductById = (req , res)=>{
    const productId = req.params.id;
    const productQuery = 'SELECT P.product_id, P.name AS  name, P.description AS description, P.price, P.stock_quantity, P.image_url, C.name AS category FROM products P JOIN categories C ON P.category_id = C.category_id WHERE P.product_id = $1 AND P.is_active = true AND C.is_active = true';
    try{
        pool.query(productQuery , [productId] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error fetching product'});
            }else if(result.rows.length === 0){
                res.status(404).json({message : 'Product not found'});
            }else{
                res.render('pages/product-details', { product: result.rows[0], user: req.session.user });
            }
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Server error'});
    }
}

// get products by category id
module.exports.getProductsByCategoryId = (req , res)=>{
    const categoryId = req.params.categoryId;
    const productQuery = 'SELECT P.name AS  name, P.description AS description, P.price, P.stock_quantity, P.image_url, C.name AS category FROM products P JOIN categories C ON P.category_id = C.category_id WHERE P.category_id = $1 AND P.is_active = true AND C.is_active = true';
    try{
        pool.query(productQuery , [categoryId] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error fetching products'});
            }
            else if(result.rows.length === 0){
                res.status(404).json({message : 'No products found for this category'});
            }
            else{
                res.status(200).json(result.rows);
            }
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Server error'});
    }
}

// add product
module.exports.addProduct = (req , res)=>{
    const { name, description, price, category_id, stock_quantity, image_url } = req.body;
    if(!name || !price || !category_id || !stock_quantity){
        return res.status(400).json({message : 'All fields are required'});
    }
    const insertQuery = 'INSERT INTO products (name, description, price, category_id, stock_quantity, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    try{
        pool.query(insertQuery , [name, description, price, category_id, stock_quantity, image_url] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error adding product'});
            }
            else{
                res.status(201).json(result.rows[0]);
            }
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Server error'});
    }
}

// update product
module.exports.updateProduct = (req , res)=>{
    const productId = req.params.id;
    const { name, description, price, category_id, stock_quantity, image_url } = req.body;
    const updateQuery = 'UPDATE products SET name = $1, description = $2, price = $3, category_id = $4, stock_quantity = $5, image_url = $6, updated_at = CURRENT_TIMESTAMP WHERE product_id = $7 RETURNING *';
    try{
        pool.query(updateQuery , [name, description, price, category_id, stock_quantity, image_url, productId] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error updating product'});
            }
            else if(result.rows.length === 0){
                res.status(404).json({message : 'Product not found'});
            }
            else{
                res.status(200).json(result.rows[0]);
            }
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Server error'});
    }
}

// delete product (soft delete)
module.exports.deleteProduct = (req , res)=>{
    const productId = req.params.id;
    const deleteQuery = 'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE product_id = $1 RETURNING *';
    try{
        pool.query(deleteQuery , [productId] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error deleting product'});
            }
            else if(result.rows.length === 0){
                res.status(404).json({message : 'Product not found'});
            }
            else{
                res.status(200).json({message : 'Product deleted successfully'});
            }
        });
    }
    catch(error){
        console.log(error);
        res.status(500).json({message : 'Server error'});
    }
}

// restore product
module.exports.restoreProduct = (req , res)=>{
    const productId = req.params.id;
    const restoreQuery = 'UPDATE products SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE product_id = $1 RETURNING *';
    try{
        pool.query(restoreQuery , [productId] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error restoring product'});
            }
            else if(result.rows.length === 0){
                res.status(404).json({message : 'Product not found'});
            }
            else{
                res.status(200).json({message : 'Product restored successfully'});
            }
        });
    }
    catch(error){
        console.log(error);
        res.status(500).json({message : 'Server error'});
    }
}
