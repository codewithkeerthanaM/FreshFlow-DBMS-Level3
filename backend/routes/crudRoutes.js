const router=require("express").Router();
const {authenticate}=require("../middleware/authMiddleware");
const {allowRoles}=require("../middleware/roleMiddleware");
const {createCrudController}=require("../controllers/crudController");
function build(resource){
 const c=createCrudController(resource);
 const r=require("express").Router();
 r.get("/",authenticate,c.list);
 r.get("/:id",authenticate,c.get);
 r.post("/",authenticate,allowRoles("ADMIN","MANAGER"),c.create);
 r.put("/:id",authenticate,allowRoles("ADMIN","MANAGER"),c.update);
 r.delete("/:id",authenticate,allowRoles("ADMIN"),c.remove);
 return r;
}
module.exports={build};
