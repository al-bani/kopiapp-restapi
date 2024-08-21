const express = require("express");
const {
  register,
  login,
  menu,
  getDetails,
  addRating,
  getCustomerDetails,
  updateCustomerDetails,
  getRating,
  updatePasswordCustomer,
  sendEmailOTP,
  sendSmsOTP,
  verifyOTP,
  menuAll,
  getSearchProduct,
} = require("./apps");
const router = express.Router();

const foodsRouter = express.Router();
const drinksRouter = express.Router();
const customerRouter = express.Router();
const otpRouter = express.Router();

router
  .post("/register", (req, res, next) => {
    register(req, res);
  })
  .post("/register/verify-otp", (req, res, next) => {
    verifyOTP(req.body.signature, req.body.otp);
  });

router.post("/login", (req, res, next) => {
  login(req, res);
});

router.post("/search", (req, res, next) => {
  getSearchProduct(req, res);
});

router
  .post("/rating", (req, res, next) => {
    addRating(req, res);
  })
  .get("/rating", (req, res, next) => {
    getRating(req, res);
  });

router
  .post("/menu", (req, res, next) => {
    menu(req, res);
  })
  .post("/menu/all", (req, res, next) => {
    menuAll(req, res);
  });

foodsRouter.get("/:food_id", (req, res, next) => {
  getDetails(req, res, "food", req.params.food_id);
});

foodsRouter.get("/:food_id/image", (req, res, next) => {
  getImage(req, res, "foods", req.params.food_id);
});

drinksRouter.get("/:drink_id", (req, res, next) => {
  getDetails(req, res, "drink", req.params.drink_id);
});

drinksRouter.get("/:drink_id/image", (req, res, next) => {
  getImage(req, res, "drinks", req.params.drink_id);
});

customerRouter
  .get("/:customer_id", (req, res, next) => {
    getCustomerDetails(req, res);
  })
  .put("/:customer_id", (req, res, next) => {
    updateCustomerDetails(req, res);
  })
  .put("/:customer_id/password", (req, res, next) => {
    updatePasswordCustomer(req, res);
  });

otpRouter
  .post("/email", (req, res, next) => {
    sendEmailOTP(req, res);
  })
  .post("/phone-number", (req, res, next) => {
    sendSmsOTP(req, res);
  });

router.use("/images/drink", express.static("assets/drinks"));
router.use("/images/food", express.static("assets/foods"));
router.use("/menu/foods", foodsRouter);
router.use("/menu/drinks", drinksRouter);
router.use("/customer", customerRouter);
router.use("/otp", otpRouter);

module.exports = router;
