const router=require("express").Router();
const {body}=require("express-validator");
const {login,me}=require("../controllers/authController");
const {authenticate}=require("../middleware/authMiddleware");
const {validate}=require("../middleware/validate");
router.post("/login",[body("email").isEmail().normalizeEmail(),body("password").isString().isLength({min:1})],validate,login);
router.get("/me",authenticate,me);
module.exports=router;
