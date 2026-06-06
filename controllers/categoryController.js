const pool = require('../config/db');

// Get all categories
module.exports.getCategories = (req , res)=>{
    const categoryQuery = 'SELECT * FROM categories';
    try{
        pool.query(categoryQuery , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error fetching categories'});
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

//Get category by id
module.exports.getCategoryById = (req , res)=>{
    const categoryId = req.params.id;
    const categoryQuery = 'SELECT * FROM categories WHERE category_id = $1';
    try{
        pool.query(categoryQuery , [categoryId] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error fetching category'});
            }else if(result.rows.length === 0){
                res.status(404).json({message : 'Category not found'});
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

// add category
module.exports.addCategory = (req , res)=>{
    const { name, description } = req.body;

    if(!name || !description){
        return res.status(400).json({message : 'All fields are required'});
    }
    const availableQuery = 'SELECT * FROM categories WHERE name = $1';
    const insertQuery = 'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *';
    try{
        pool.query(availableQuery , [name] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error checking category'});
            }else if(result.rows.length > 0){
                res.status(400).json({message : 'Category already exists'});
            }else{
                pool.query(insertQuery , [name, description] , (err , result)=>{
                    if(err){
                        console.log(err);
                        res.status(500).json({message : 'Error adding category'});
                    }else{
                        res.status(201).json(result.rows[0]);
                    }
                });
            }
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Server error'});
    }
}