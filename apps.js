const db  = require('./db_conn');
const dayjs = require('dayjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dateNow = dayjs().format('YYYY-MM-DD HH:mm:ss');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
let otpStorage = new Map();

const register = (req, res) => {
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
    });
}

const login = (req, res) => {
    let query =`SELECT * FROM customer WHERE email = ${db.escape(req.body.email)} OR phone_number = ${db.escape(req.body.phone_number)};`;
    db.query(query,
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
                    const token = signJwt(result[0].customer_id);
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
    });
}

const menu = (req, res) => {
    let token = req.headers.authorization;
    const resultVerify = verifyTokenJWT(token, req.body.customer_id);
   
    if (resultVerify === null) {
        return res.status(401).send({ msg: 'Unauthorized' });
    } else {
       token = resultVerify;
    }
  
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

    let query = `SELECT * FROM drinks AS drink WHERE ` + drinkQuery + ` UNION ALL SELECT * FROM foods AS food WHERE` + foodQuery + sortQuery;
    
    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }
        if(result.length){
            const modifiedResult = [
                {
                    token
                },
                
                ...result
            ];

            return res.status(200).send(modifiedResult);
        } else {
            return res.status(404).send({ msg: 'No data found' });
        }
    });
}

const getListMenuType = (req, res, type) => {

    let token = req.headers.authorization;
    const resultVerify = verifyTokenJWT(token, req.body.customer_id);

    if (resultVerify === null) {
        return res.status(401).send({ msg: 'Unauthorized' });
    } else {
        token = resultVerify;
    }
    
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
    
    let query = `SELECT * FROM ${type} WHERE`;
    query += categoryData.map(data => ` category = ${db.escape(data)}`).join(' OR ');
    query += sortQuery;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }
        if(results.length){
            const modifiedResult = [
                {
                    token,
                },
                
                ...results
            ];

            return res.status(200).send(modifiedResult);
        } else {
            return res.status(404).send({ msg: 'No data found' });
        }
    });
}

const getDetails = (req, res, type, id) => {

    let token = req.headers.authorization;
    const resultVerify = verifyTokenJWT(token, req.body.customer_id);

    if (resultVerify === null) {
        return res.status(401).send({ msg: 'Unauthorized' });
    } else {
        token = resultVerify;
    }

    const columnId = type === 'foods' ? 'food_id' : 'drink_id';

    let query = `SELECT * FROM ${type} WHERE ${columnId} = ${db.escape(id)}`;

    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }
        if(result.length){
            const modifiedResult = [
                {
                    token,
                },
                
                ...result
            ];

            return res.status(200).send(modifiedResult);
        } else {
            return res.status(404).send({ msg: 'No data found' });
        }
    });
}

const getCustomerDetails = (req, res) => {
    const customer_id = req.params.customer_id;

    let token = req.headers.authorization;
    const resultVerify = verifyTokenJWT(token, customer_id);

    if (resultVerify === null) {
        return res.status(401).send({ msg: 'Unauthorized' });
    } else {
        token = resultVerify;
    }

    let query = `SELECT * FROM customer WHERE customer_id = ${db.escape(customer_id)}`;

    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }
         
        if(result.length){
           
            return res.status(200).send({
                token,
                result
            });
           
        } else {
            return res.status(404).send({ msg: 'No data found' });
        }
    });
}

const updateCustomerDetails = (req, res) => {
    const customer_id = req.params.customer_id;

    let token = req.headers.authorization;
    let resultVerify = verifyTokenJWT(token, customer_id);

    if (resultVerify === null) {
        return res.status(401).send({ msg: 'Unauthorized' });
    } else {
        token = resultVerify;
    }

    const query = `UPDATE customer SET name = ${db.escape(req.body.name)}, email = ${db.escape(req.body.email)}, phone_number = ${db.escape(req.body.phone_number)}, age = ${db.escape(req.body.age)} WHERE customer_id = ${db.escape(customer_id)}`;
    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }
        return res.status(200).send({ msg: 'Customer details updated successfully' });
    });
}

const updatePasswordCustomer = (req, res) => {
    const customer_id = req.params.customer_id;
    const otpUser = req.body.otp;
    const signature = req.body.signature;

    let token = req.headers.authorization;
    let resultVerify = verifyTokenJWT(token, customer_id);

    if (resultVerify === null) {
        return res.status(401).send({ msg: 'Unauthorized' });
    } else {
        token = resultVerify;
    }

    let otpVerify = verifyOTP(signature, otpUser);

    if (!otpVerify.valid) {
        return res.status(400).json({ message: otpVerify.message });
    }

    db.query(`SELECT password FROM customer WHERE customer_id = ${db.escape(customer_id)}`, (err, result) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }
        
        if (!result.length) {
            return res.status(404).send({ msg: 'No data found' });
        } else {
            bcrypt.compare(req.body.new_password, result[0].password, (err, bResult) => {
                if (err) {
                    return res.status(500).send({ msg: 'Internal Server Error', err });
                } else if (bResult) {
                    return res.status(401).send({ msg: 'New password do not match with the old password' });
                } else {
                    bcrypt.hash(req.body.new_password, 10, (err, hash) => {
                        if (err) {
                            return res.status(500).send({ msg: 'Internal Server Error', err });
                        } else {
                            const query = `UPDATE customer SET password = ${db.escape(hash)} WHERE customer_id = ${db.escape(customer_id)}`;
                            db.query(query, (err, result) => {
                                if (err) {
                                    return res.status(500).send({ msg: 'Internal Server Error', err });
                                } else {
                                    return res.status(200).send({ msg: 'Password updated successfully' });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

const sendEmailOTP = (req, res) => {    
    const customer_id = req.params.customer_id;

    let token = req.headers.authorization;
    let resultVerify = verifyTokenJWT(token, customer_id);

    if (resultVerify === null) {
        return res.status(401).send({ msg: 'Unauthorized' });
    } else {
        token = resultVerify;
    }

    const emailDestination = req.body.email;
    const otp = generateOTP(emailDestination);
    const emailSender = process.env.GOOGLE_MAIL;
    const emailPassword = process.env.GOOGLE_PASSWORD;
    const htmlTemplate = fs.readFileSync(path.join(__dirname, '/assets/email/verification.html'), 'utf-8');
    const htmlContent = htmlTemplate.replace('{{OTP}}', otp);

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, 
        auth: {
          user: emailSender,
          pass: emailPassword,
        }
      });

    const mailConfigurations = {
        from: emailSender,
        to: emailDestination,
        subject: 'kopiapp Verification Code',
        html: htmlContent
    };

    transporter.sendMail(mailConfigurations, function(error, info){
        if (error) throw Error(error);
        console.log('Email Sent Successfully');

        return res.status(200).send({
            msg: 'Email sent succesfully',
            info
        });


    });

}

function generateOTP(signature){
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = Date.now() + 1 * 60 * 1000;
    otpStorage.set(signature, { otp, expiryTime });

    return otp;
}

function verifyOTP(signature, inputOTP) {
    const otpData = otpStorage.get(signature)

    if (!otpData) {
        return { valid: false, message: 'OTP not found' };
    }

    if (Date.now() > otpData.expiryTime) {
        otpStorage.delete(signature); 
        return { valid: false, message: 'OTP has been expired' };
    }

    if (String(inputOTP).trim() === String(otpData.otp).trim()) {
        otpStorage.delete(signature); 
        return { valid: true, message: 'OTP valid' };
    } else {
        return { valid: false, message: 'OTP tidak valid' };
    }

}

const getRating = (req, res) => {
    let query = `SELECT * FROM ratings`;

    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }
        return res.status(200).send(result);
    });
}

const addRating = (req, res) => {
    const customer_id = req.body.customer_id;

    const token = req.headers.authorization;
    let resultVerify = verifyTokenJWT(token, customer_id);

    if (resultVerify === null) {
        return res.status(401).send({ msg: 'Unauthorized' });
    } else {
        token = resultVerify;
    }

    const type = req.body.type;
    let typeColumn = '';

    if (type === 'foods') {
        typeColumn = 'food_id';
    } else {
        typeColumn = 'drink_id';
    }

    const query = `INSERT INTO ratings (customer_id, ${typeColumn}, rating_value, description, date_created) VALUES (${db.escape(customer_id)}, ${db.escape(req.body.type_id)}, ${db.escape(req.body.rating_value)}, ${db.escape(req.body.description)}, ${db.escape(dateNow)})`;

    db.query(`SELECT * FROM ratings WHERE customer_id = ${db.escape(customer_id)} AND ${typeColumn} = ${db.escape(req.body.type_id)}`, (err, result) => {
        if (err) {
            return res.status(500).send({ msg: 'Internal Server Error', err });
        }

        if (result.length) {
            return res.status(409).send({ msg: 'You already rated this product' });
        } else {
            db.query(query, (err, result) => {
                if (err) {
                    return res.status(500).send({ msg: 'Internal Server Error', err });
                }

                return res.status(200).send({ 
                    token,
                    msg: 'Rating added successfully' 
                });

            }); 
        }
    });
}

function signJwt (customer_id){
    const privateKey = fs.readFileSync('.settings/private/private.key', 'utf8');
    //resetPK();
    const passphrase = process.env.PRIVATE_KEY_PASSPHRASE;
    const timeExpiredToken = '7d';

    const payload = {cid : customer_id};
    const token = jwt.sign(payload, {key: privateKey, passphrase}, {algorithm: 'RS256', expiresIn: timeExpiredToken});
    console.log(`your token has generated, will expired in ${timeExpiredToken}`);
    return token;
}

function verifyTokenJWT (token, customer_id){
    if(!token || !token.startsWith(process.env.PASSKEY) || !token.split(' ')[1]){
        return null;
    }
    
    token = token.split(' ')[1];
    const publicKey = fs.readFileSync('.settings/public.key', 'utf8');

    const timeRemain = getTokenTimeRemaining(token);
    console.log(`token will expired in ${timeRemain} seconds`);

    try {
        const decoded = jwt.verify(token, publicKey);
        return token;
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            console.log('token has been expired, regenerating token...')
            const newToken = signJwt(customer_id);
            console.log('token has been generated');
            return newToken;
        }
    }
    
    return null;
}

function getTokenTimeRemaining(token) {
    const publicKey = fs.readFileSync('.settings/public.key', 'utf8');
    
    try {
        const decoded = jwt.verify(token, publicKey, { ignoreExpiration: true });
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const timeRemaining = expirationTime - currentTime;
        
        if (timeRemaining > 0) {
            return Math.floor(timeRemaining / 1000); 
        } else {
            return 0; 
        }
    } catch (err) {
        console.error('Error while convertion token', err);
        return -1; 
    }
}

// function resetPK(){
//     console.log('reset PK dilakukan');
//     let value = Math.random().toString(36).substr(2, 30);
//     value = bcrypt.hashSync(value, 10);

//     try {
//         const envPath = path.resolve(__dirname, '.env');

//         let envContent = fs.readFileSync(envPath, 'utf8');

//         const regex = new RegExp(`^PRIVATE_KEY_PASSPHRASE=.*$`, 'm');
        
//         const escapedValue = value.replace(/[\\$'"]/g, "\\$&");
        
//         envContent = envContent.replace(regex, `PRIVATE_KEY_PASSPHRASE="${escapedValue}"`);
        
//         fs.writeFileSync(envPath, envContent, 'utf8');

//         console.log('PRIVATE_KEY_PASSPHRASE berhasil diperbarui');

//     } catch (error) {
//         console.log('Terjadi kesalahan:', error);
//     }
// }

module.exports = {
    register,
    login,
    menu,
    getListMenuType,
    getDetails,
    addRating,
    getCustomerDetails,
    updateCustomerDetails,
    getRating,
    updatePasswordCustomer,
    sendEmailOTP
}