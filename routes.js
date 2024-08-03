const express = require('express');
const { register, login, menu, getListMenuType, getDetails} = require('./apps');
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

router.use("/images/drink", express.static('assets/drinks'));
router.use("/images/food", express.static('assets/foods'));
router.use('/menu/foods', foodsRouter);
router.use('/menu/drinks', drinksRouter);

module.exports = router;