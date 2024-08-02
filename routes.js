const express = require('express');
const { register, login, menu, getListMenuType, getDetails } = require('./apps');
const router = express.Router();

const foodsRouter = express.Router();
const drinksRouter = express.Router();


router.post('/register', (req, res, next) => {
    register(req, res);
});

router.post('/login', (req, res, next) => {
    login(req, res);
});

router.post('/menu', (req, res, next) => {
    menu(req, res);
});

foodsRouter.post('/', (req, res, next) => {
    getListMenuType(req, res, 'foods');
});

foodsRouter.get('/:food_id', (req, res, next) => {
    getDetails(res, 'foods', req.params.food_id);
});

drinksRouter.post('/', (req, res, next) => {
    getListMenuType(req, res, 'drinks');
});

drinksRouter.get('/:drink_id', (req, res, next) => {
    getDetails(res, 'drinks', req.params.drink_id);
});

router.use('/menu/foods', foodsRouter);
router.use('/menu/drinks', drinksRouter);

module.exports = router;