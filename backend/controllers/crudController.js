const { getPool } = require("../config/mysql");
const { ok, fail } = require("../utils/response");
const { recordMonitoring } = require("../services/eventService");

const configs = {
  products: {
    table: "product", id: "Product_ID",
    columns: ["Product_Name","Category","Unit_of_Measure","Shelf_Life_Days","Description","Supplier_ID"],
    required: ["Product_Name","Category","Unit_of_Measure","Shelf_Life_Days","Supplier_ID"],
    listSql: `SELECT p.*, s.Supplier_Name FROM product p JOIN supplier s ON s.Supplier_ID=p.Supplier_ID ORDER BY p.Product_ID DESC`
  },
  suppliers: {
    table: "supplier", id: "Supplier_ID",
    columns: ["Supplier_Name","Contact_Person","Phone_Number","Email","Address","City"],
    required: ["Supplier_Name"],
    listSql: `SELECT * FROM supplier ORDER BY Supplier_ID DESC`
  },
  locations: {
    table: "location", id: "Location_ID",
    columns: ["Location_Name","Type","Address","City","Room_Area","Temperature_Range"],
    required: ["Location_Name","Type"],
    listSql: `SELECT * FROM location ORDER BY Location_ID DESC`
  }
};

function createCrudController(resource) {
  const cfg = configs[resource];
  return {
    async list(req,res) {
      const [rows] = await getPool().query(cfg.listSql);
      return ok(res, rows);
    },
    async get(req,res) {
      const [rows] = await getPool().execute(`SELECT * FROM ${cfg.table} WHERE ${cfg.id}=?`, [req.params.id]);
      if (!rows.length) return fail(res,404,`${resource} record not found`);
      return ok(res,rows[0]);
    },
    async create(req,res) {
      const body=req.body||{};
      for (const key of cfg.required) if (body[key]===undefined || body[key]===null || body[key]==="") return fail(res,400,`${key} is required`);
      const keys=cfg.columns.filter(k=>body[k]!==undefined);
      if (!keys.length) return fail(res,400,"No valid fields supplied");
      const placeholders=keys.map(()=>"?").join(",");
      const sql=`INSERT INTO ${cfg.table} (${keys.join(",")}) VALUES (${placeholders})`;
      const [result]=await getPool().execute(sql,keys.map(k=>body[k]));
      await recordMonitoring({action:`${resource}.created`,description:`Created ${resource} record`,userId:req.user?.id,userEmail:req.user?.email,metadata:{recordId:result.insertId}});
      return ok(res,{id:result.insertId},201,`${resource} created`);
    },
    async update(req,res) {
      const body=req.body||{};
      const keys=cfg.columns.filter(k=>body[k]!==undefined);
      if (!keys.length) return fail(res,400,"No valid fields supplied");
      const [result]=await getPool().execute(`UPDATE ${cfg.table} SET ${keys.map(k=>`${k}=?`).join(",")} WHERE ${cfg.id}=?`,[...keys.map(k=>body[k]),req.params.id]);
      if (!result.affectedRows) return fail(res,404,`${resource} record not found`);
      await recordMonitoring({action:`${resource}.updated`,description:`Updated ${resource} record`,userId:req.user?.id,userEmail:req.user?.email,metadata:{recordId:Number(req.params.id)}});
      return ok(res,{id:Number(req.params.id)} ,200,`${resource} updated`);
    },
    async remove(req,res) {
      const [result]=await getPool().execute(`DELETE FROM ${cfg.table} WHERE ${cfg.id}=?`,[req.params.id]);
      if (!result.affectedRows) return fail(res,404,`${resource} record not found`);
      await recordMonitoring({action:`${resource}.deleted`,description:`Deleted ${resource} record`,userId:req.user?.id,userEmail:req.user?.email,metadata:{recordId:Number(req.params.id)}});
      return ok(res,{id:Number(req.params.id)},200,`${resource} deleted`);
    }
  };
}

module.exports = { createCrudController, configs };
