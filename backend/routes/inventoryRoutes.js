const r=require("express").Router();
const c=require("../controllers/inventoryController");
const {authenticate}=require("../middleware/authMiddleware");
const {allowRoles}=require("../middleware/roleMiddleware");
r.get("/",authenticate,c.list);
r.post("/",authenticate,allowRoles("ADMIN","MANAGER","STAFF"),c.create);
r.put("/:id/adjust",authenticate,allowRoles("ADMIN","MANAGER","STAFF"),c.adjust);
module.exports=r;
