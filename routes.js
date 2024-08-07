const express = require('express');
const { register, login, menu, getListMenuType, getDetails, addRating, getCustomerDetails, updateCustomerDetails, getRating, updatePasswordCustomer, sendEmailOTP} = require('./apps');
const router = express.Router();

const foodsRouter = express.Router();
const drinksRouter = express.Router();
const customerRouter = express.Router();
const otpRouter = express.Router();

router.post('/register', (req, res, next) => {
    register(req, res);
});

router.post('/login', (req, res, next) => {
    login(req, res);
});

router.post('/rating', (req, res, next) => {
    addRating(req, res);
}).get('/rating', (req, res, next) => {
    getRating(req, res);
});

router.post('/menu', (req, res, next) => {
    menu(req, res);
});

foodsRouter.post('/', (req, res, next) => {
    getListMenuType(req, res, 'foods');
});

foodsRouter.get('/:food_id', (req, res, next) => {
    getDetails(req, res, 'foods', req.params.food_id);
});

foodsRouter.get('/:food_id/image', (req, res, next) => {
    getImage(req, res, 'foods', req.params.food_id);
});

drinksRouter.post('/', (req, res, next) => {
    getListMenuType(req, res, 'drinks');
});

drinksRouter.get('/:drink_id', (req, res, next) => {
    getDetails(req, res, 'drinks', req.params.drink_id);
});

drinksRouter.get('/:drink_id/image', (req, res, next) => {
    getImage(req, res, 'drinks', req.params.drink_id);
});

customerRouter.get('/:customer_id', (req, res, next) => {
    getCustomerDetails(req, res);
}).put('/:customer_id', (req, res, next) => {
    updateCustomerDetails(req, res);
}).put('/:customer_id/password', (req, res, next) => {
    updatePasswordCustomer(req, res);
});

otpRouter.post('/email', (req, res, next) => {
    sendEmailOTP(req, res);
}).post('/phone-number', (req, res, next) => {
   
});

router.use("/images/drink", express.static('assets/drinks'));
router.use("/images/food", express.static('assets/foods'));
router.use('/menu/foods', foodsRouter);
router.use('/menu/drinks', drinksRouter);
router.use('/customer', customerRouter);
router.use('/otp', otpRouter);

module.exports = router;