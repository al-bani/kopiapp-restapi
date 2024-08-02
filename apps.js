const express = require('express');
const router = express.Router();
const db  = require('./db_conn');
const dayjs = require('dayjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dateNow = dayjs().format('YYYY-MM-DD HH:mm:ss');

const foodsRouter = express.Router();
const drinksRouter = express.Router();

router.post('/register', (req, res, next) => {
    db.query(`SELECT email, phone_number FROM customer WHERE email = ${db.escape(req.body.email)} OR phone_number = ${db.escape(req.body.phone_number)};`,
        (err, result) => {
            if (err){   
                return res.status(500).send({
                    msg: 'Internal Server Error'
                });
            }

            if (result.length){
                const emailExists = result.some(row => row.email.toLowerCase() === req.body.email.toLowerCase());
                const phoneExists = result.some(row => row.phone_number === req.body.phone_number);

                if (emailExists && phoneExists) {
                    return res.status(409).send({
                        msg: 'Both email and phone number are already in use!',
                        email: true,
                        phone: true
                      });
                } else if (emailExists) {
                    return res.status(409).send({
                        msg: 'This email is already in use!',
                        email: true,
                        phone: false
                    });
                } else if (phoneExists) {
                    return res.status(409).send({
                        msg: 'This phone number is already in use!',
                        email: false,
                        phone: true
                      });       
                }
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).send({
                            msg: err
                        });
                       
                    } else {
                        db.query(`INSERT INTO customer (name, email, phone_number, password, age, gender, date_created) VALUES (${db.escape(req.body.name)}, ${db.escape(req.body.email.toLowerCase)}, ${db.escape(req.body.phone_number)}, ${db.escape(hash)}, ${db.escape(req.body.age)}, ${db.escape(req.body.gender)}, ${db.escape(dateNow)});`,
                            (err, result) => {
                                if (err) {
                                    return res.status(500).send({
                                        msg: err
                                    });
                                    
                                } else {
                                    return res.status(201).send({
                                        msg: 'The user has been registerd with us!'
                                    });
                                }
                            }
                        );
                    }
                });
            }

        }
    );
});

router.post('/login', (req, res, next) => {
    db.query(`SELECT * FROM customer WHERE email = ${db.escape(req.body.email)} OR phone_number = ${db.escape(req.body.phone_number)};`,
        (err, result) => {
            if (err) {
                return res.status(500).send({
                    msg: err
                });
            }

            if(!result.length){
                return res.status(401).send({
                    msg: 'Email or Phone Number is incorrect!'
                });
            } else {
                bcrypt.compare(req.body.password, result[0].password, (err, bResult) => {
                    if (err) {
                        return res.status(500).send({
                            msg: err
                        });
                    } else if (bResult) {
                        const token = jwt.sign({ id: result[0].customer_id }, 'the-super-strong-secret');
                        db.query(
                            `UPDATE customer SET last_login = ${db.escape(dateNow)} WHERE customer_id = '${result[0].customer_id}'`,
                            (err, result) => {
                                if (err) {
                                    return res.status(500).send({
                                        msg: err
                                    });
                                }
                            }
                        );
                        return res.status(200).send({
                            msg: 'Logged in!',
                            token,
                            user: result[0]
                        });
                    } else {
                        return res.status(401).send({
                            msg: 'Password is incorrect!'
                        });
                    }
                });
            }
        }
    );
});

router.post('/menu', (req, res, next) => {
    const sort = req.body.sort;
    let sortQuery = ``;

    switch (sort) {
        case 'lowest_price':
            sortQuery = ' ORDER BY CAST(price AS DECIMAL(10,2)) ASC';
            break;
        case 'highest_price':
            sortQuery = ' ORDER BY CAST(price AS DECIMAL(10,2)) DESC';
            break;
        case 'popularity':
            sortQuery = ' ORDER BY total_buying DESC';
            break;
        case 'recomended':
            sortQuery = ' AND recomended = 1 ORDER BY recomended DESC';
            break;
        default:
            break;
    }

    const {foods, drinks} = req.body.category;

    const categoryFood = foods.filter(item => item !== null && item !== undefined);
    const categoryDrink = drinks.filter(item => item !== null && item !== undefined);

    let foodQuery = categoryFood.map(data => ` food.category = ${db.escape(data)}`).join(' OR ');
    let drinkQuery = categoryDrink.map(data => ` drink.category = ${db.escape(data)}`).join(' OR ');

    let query = `SELECT name,price,total_buying, recomended FROM drinks AS drink WHERE ` + drinkQuery + ` UNION ALL SELECT name,price,total_buying, recomended FROM foods AS food WHERE` + foodQuery + sortQuery;
    
    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }
        if(result.length){
            return res.status(200).send(result);
        } else {
            return res.status(404).send({ msg: 'No data found' });
        }
    });

});

const menuType = (req, res, next, type) => {
    const categoryData =  req.body.category.filter(item => item !== null && item !== undefined);
    const sort = req.body.sort;

    if (categoryData.length === 0) {
        return res.status(400).send({ msg: 'No valid data provided' });
    }

    let sortQuery = '';

    switch (sort) {
        case 'lowest_price':
            sortQuery = ' ORDER BY CAST(price AS DECIMAL(10,2)) ASC';
            break;
        case 'highest_price':
            sortQuery = ' ORDER BY CAST(price AS DECIMAL(10,2)) DESC';
            break;
        case 'popularity':
            sortQuery = ' ORDER BY total_buying DESC';
            break;
        case 'recomended':
            sortQuery = ' AND recomended = 1 ORDER BY recomended DESC';
            break;
        default:
            break;
    }
    
    let query = `SELECT name,category,price,recomended FROM ${type} WHERE`;
    query += categoryData.map(data => ` category = ${db.escape(data)}`).join(' OR ');
    query += sortQuery;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }
        if(results.length){
            return res.status(200).send(results);
        } else {
            return res.status(404).send({ msg: 'No data found' });
        }
    });
}

const getDetails = (res, type, id) => {
    const columnId = type === 'foods' ? 'food_id' : 'drink_id';

    let query = `SELECT name, price, category, description, total_buying, recomended FROM ${type} WHERE ${columnId} = ${db.escape(id)}`;

    console.log(query);

    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }
        if(result.length){
            return res.status(200).send(result);
        } else {
            return res.status(404).send({ msg: 'No data found' });
        }
    });
}


foodsRouter.post('/', (req, res, next) => {
    menuType(req, res, next, 'foods');
});

foodsRouter.get('/:food_id', (req, res, next) => {
    getDetails(res, 'foods', req.params.food_id);
});

drinksRouter.post('/', (req, res, next) => {
    menuType(req, res, next, 'drinks');
});

drinksRouter.get('/:drink_id', (req, res, next) => {
    getDetails(res, 'drinks', req.params.drink_id);
});


router.use('/menu/foods', foodsRouter);
router.use('/menu/drinks', drinksRouter);

module.exports = router;