const { INTEGER } = require('sequelize');
const db = require('../utils/database');

module.exports = {
    authenticate,
    getById,
    create,
    update,
    patch,
    deleteProduct
};

let xx;
async function authenticate({ username, password}) {
    const user = await db.User.scope('withPassword').findOne({ where: { username: username } })
    let usernameValidation = false;
    xx=user.dataValues.id;
    if(user){
        if(username === user.dataValues.username){
            usernameValidation = true;
        }
        const compare = await comparePassword(password, user.dataValues.password);
        if (user && compare && usernameValidation) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword; //returning the user object without password
        }
    }
}

async function comparePassword(password, hash) {
    const result =  await bcrypt.compare(password, hash);
    return result;
}

async function getById(productId) {
    return await getProduct(productId);
}

async function create(params, req, res) {
//     if (await db.User.findOne({ where: { username: params.username } })) {
//         throw 'Username "' + params.username + '" is already registered, please pick a different username';
//     }

//     var regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

//     if(!params.username.trim().match(regexEmail)){
//         throw 'Invalid username, enter a valid email address';
//    }

// console.log(req.body);
if (Object.keys(req.body).length > 5){
    throw 'Enter all the required fields';
    return;
}
if (!(req.body.hasOwnProperty('name')) || !(req.body.hasOwnProperty('description')) || !(req.body.hasOwnProperty('sku')) || !(req.body.hasOwnProperty('manufacturer')) || !(req.body.hasOwnProperty('quantity'))){
    throw 'Enter all the required fields';
    return;
}

if ((((((params.name).length == 0) || (params.description).length == 0) || (params.sku).length == 0) || (params.manufacturer).length == 0) || (params.quantity).length == 0) {
   throw 'Required field is empty';
}

if (await db.Product.findOne({ where: { sku: params.sku } })) {
             throw 'SKU "' + params.sku + '" already exists, please enter a different SKU';
         }

const userId = req.auth.user.dataValues.id;
   let date_ob = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
  params.date_added = date_ob;
  params.date_last_updated = date_ob;
params.owner_user_id = userId;

    if (params.password) {
        params.password = await bcrypt.hash(params.password, 10);
    }

    if (!(Number.isInteger(params.quantity) && params.quantity >= 1)){
        throw 'Enter a valid quantity';
    }

    //creating a record in the database using the create library (sequalize)
    const product = await db.Product.create(params);
    return (product.get());
}

async function update(productId, params, req, res) {
    //we get this user object from the db
    const product = await getProduct(productId);

    // if (!(req.body.hasOwnProperty('name')) || !(req.body.hasOwnProperty('description')) || !(req.body.hasOwnProperty('sku')) || !(req.body.hasOwnProperty('manufacturer')) || !(req.body.hasOwnProperty('quantity'))){
    //     throw 'Enter all the required fields';
    //     return;
    // }

    //if changing the password this is to encrypt the new password
    // if(product){
    //     if(params.owner_user_id !== product.dataValues.owner_user_id) {
    //         throw 'Prohibited to change username';
    //     }
    // }else {
    //     throw 'not found';
    // }
    if (Object.keys(req.body).length > 5){
        throw 'Enter all the required fields';
        return;
    }
    if (!(req.body.hasOwnProperty('name')) || !(req.body.hasOwnProperty('description')) || !(req.body.hasOwnProperty('sku')) || !(req.body.hasOwnProperty('manufacturer')) || !(req.body.hasOwnProperty('quantity'))){
        throw 'Enter all the required fields';
        return;
    }

    if ((((((params.name).length == 0) || (params.description).length == 0) || (params.sku).length == 0) || (params.manufacturer).length == 0) || (params.quantity).length == 0) {
        throw 'Required field is empty';
     }

    if (params.password) {
        params.password = await bcrypt.hash(params.password, 10);
    }
    let date_ob = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
     params.date_last_updated = date_ob
     const userId = req.auth.user.dataValues.id;
    if(userId != product.dataValues.owner_user_id){
        throw 'You are forbidden to update this product';
    }

    if (!(Number.isInteger(params.quantity) && params.quantity >= 1)){
        throw 'Enter a valid quantity';
    }
    // console.log(req.params.productId);
    const new_data = await db.Product.findOne({ where: { id: req.params.productId } });
    // console.log(new_data.dataValues.sku);
    if(new_data.dataValues.sku != params.sku){
    if (await db.Product.findOne({ where: { sku: params.sku } })) {
        throw 'SKU "' + params.sku + '" already exists, please enter a different SKU';
    }
    }

    Object.assign(product, params);
    //saving the user object to the db
    await product.save();
    //To omit password in the response 
    return (product.get());
}

async function getProduct(productId, req) {
    const product = await db.Product.findByPk(productId);
    if (!product) throw 'Product is not present in the database';
    // if(product.dataValues.userId != req.auth.user.dataValues.id){
    //     throw 'You cannot delete this product!'
    // }
    return product;
}

async function deleteProduct(productId, req) {
    console.log(productId);
    const product = await db.Product.findByPk(productId);
    if (!product) throw 'Product is not present in the database';
    
    // if(user.dataValues.id != req.auth.user.dataValues.id){
    //     throw 'Unauthorized'
    // }
    // if (Object.keys(req.body).length > 5){
    //     throw 'Enter all the required fields';
    //     return;
    // }
    // if (!(req.body.hasOwnProperty('name')) || !(req.body.hasOwnProperty('description')) || !(req.body.hasOwnProperty('sku')) || !(req.body.hasOwnProperty('manufacturer')) || !(req.body.hasOwnProperty('quantity'))){
    //     throw 'Enter all the required fields';
    //     return;
    // }
    const userId = req.auth.user.dataValues.id;
    if(userId != product.dataValues.owner_user_id){
        throw 'You cannot delete this product!'
    } else {
    db.Product.destroy({ where: { id: productId } })
}
    return product;
}

function omitPassword(user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

async function patch(productId, params, req, res) {
    //we get this user object from the db
    const product = await getProduct(productId);

    if (!(req.body.hasOwnProperty('name')) && !(req.body.hasOwnProperty('description')) && !(req.body.hasOwnProperty('sku')) && !(req.body.hasOwnProperty('manufacturer')) && !(req.body.hasOwnProperty('quantity'))){
        throw 'Enter a valid field';
        return;
    }
    // if ((!req.body.hasOwnProperty('description'))){
    //     throw 'Enter all the required fields';
    //     return;
    // }
    // if (!(req.body.hasOwnProperty('name')) || !(req.body.hasOwnProperty('description')) || !(req.body.hasOwnProperty('sku')) || !(req.body.hasOwnProperty('manufacturer')) || !(req.body.hasOwnProperty('quantity'))){
    //     throw 'Enter all the required fields';
    //     return;
    // }

    //if changing the password this is to encrypt the new password
    // if(product){
    //     if(params.owner_user_id !== product.dataValues.owner_user_id) {
    //         throw 'Prohibited to change username';
    //     }
    // }else {
    //     throw 'not found';
    // }
    // if (Object.keys(req.body).length > 5){
    //     throw 'Enter all the required fields';
    //     return;
    // }
    // if (!(req.body.hasOwnProperty('name')) || !(req.body.hasOwnProperty('description')) || !(req.body.hasOwnProperty('sku')) || !(req.body.hasOwnProperty('manufacturer')) || !(req.body.hasOwnProperty('quantity'))){
    //     throw 'Enter all the required fields';
    //     return;
    // }
    if (params.password) {
        params.password = await bcrypt.hash(params.password, 10);
    }

    if(req.body.hasOwnProperty('name') && (params.name).length == 0) {
        throw 'Required field is empty';
     }
    if(req.body.hasOwnProperty('description') && (params.description).length == 0) {
        throw 'Required field is empty';
     }
    if(req.body.hasOwnProperty('sku') && (params.sku).length == 0) {
        throw 'Required field is empty';
     }
    if(req.body.hasOwnProperty('manufacturer') && (params.manufacturer).length == 0) {
        throw 'Required field is empty';
     }
    if(req.body.hasOwnProperty('quantity') && (params.quantity).length == 0) {
        throw 'Required field is empty';
     }

    let date_ob = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
     params.date_last_updated = date_ob
     const userId = req.auth.user.dataValues.id;
    if(userId != product.dataValues.owner_user_id){
        throw 'You are forbidden to update this product';
    }
    if (req.body.hasOwnProperty('quantity')){
    if (!(Number.isInteger(params.quantity) && params.quantity >= 1)){
        throw 'Enter a valid quantity';
    }
}
    // console.log(req.params.productId);
    if (req.body.hasOwnProperty('sku')){
    const new_data = await db.Product.findOne({ where: { id: req.params.productId } });
    // console.log(new_data.dataValues.sku);
    if(new_data.dataValues.sku != params.sku){
    if (await db.Product.findOne({ where: { sku: params.sku } })) {
        throw 'SKU "' + params.sku + '" already exists, please enter a different SKU';
    }
}
}
    Object.assign(product, params);
    //saving the user object to the db
    await product.save();
    //To omit password in the response 
    return (product.get());
}