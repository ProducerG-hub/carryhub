const pool = require('../config/db');

// Get all active products
module.exports.getProducts = (req , res)=>{
    const productQuery = 'SELECT P.name AS  name, P.description AS description, P.price, C.name AS category FROM products P JOIN categories C ON P.category_id = C.category_id WHERE P.is_active = true AND C.is_active = true';
    try{
        pool.query(productQuery , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error fetching products'});
            }else{
                res.status(200).json(result.rows);
            }
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Server error'});
    }
}

// Get product by id
module.exports.getProductById = (req , res)=>{
    const productId = req.params.id;
    const productQuery = 'SELECT P.name AS  name, P.description AS description, P.price, C.name AS category FROM products P JOIN categories C ON P.category_id = C.category_id WHERE P.product_id = $1 AND P.is_active = true AND C.is_active = true';
    try{
        pool.query(productQuery , [productId] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error fetching product'});
            }else if(result.rows.length === 0){
                res.status(404).json({message : 'Product not found'});
            }else{
                res.status(200).json(result.rows[0]);
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
    const productQuery = 'SELECT P.name AS  name, P.description AS description, P.price, C.name AS category FROM products P JOIN categories C ON P.category_id = C.category_id WHERE P.category_id = $1 AND P.is_active = true AND C.is_active = true';
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
