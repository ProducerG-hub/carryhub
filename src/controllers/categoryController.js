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

    if(!name){
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
                        res.redirect('/admin/categories');
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

// update category
module.exports.updateCategory = (req , res)=>{
    const categoryId = req.params.id;
    const { name, description } = req.body;
    if(!name){
        return res.status(400).json({message : 'All fields are required'});
    }
    const updateQuery = 'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE category_id = $3 RETURNING *';
    try{
        pool.query(updateQuery , [name, description, categoryId] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error updating category'});
            }else if(result.rows.length === 0){
                res.status(404).json({message : 'Category not found'});
            }else{
                res.redirect('/admin/categories');
            }
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Server error'});
    }
}

// delete category - soft delete which means in the column is_active we will set it to false
module.exports.deleteCategory = (req , res)=>{
    const categoryId = req.params.id;
    const deleteQuery = 'UPDATE categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE category_id = $1 RETURNING *';
    try{
        pool.query(deleteQuery , [categoryId] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error deleting category'});
            }else if(result.rows.length === 0){
                res.status(404).json({message : 'Category not found'});
            }else{
                res.redirect('/admin/categories');
            }
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Server error'});
    }
}

// restore category - set is_active to true
module.exports.restoreCategory = (req , res)=>{
    const categoryId = req.params.id;
    const restoreQuery = 'UPDATE categories SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE category_id = $1 RETURNING *';
    try{
        pool.query(restoreQuery , [categoryId] , (err , result)=>{
            if(err){
                console.log(err);
                res.status(500).json({message : 'Error restoring category'});
            }else if(result.rows.length === 0){
                res.status(404).json({message : 'Category not found'});
            }else{
                res.redirect('/admin/categories');
            }
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Server error'});
    }
}
