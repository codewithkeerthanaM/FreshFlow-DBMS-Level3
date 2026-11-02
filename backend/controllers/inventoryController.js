const { getPool } = require("../config/mysql");
const { ok, fail } = require("../utils/response");
const { recordStockEvent } = require("../services/eventService");

async function list(req,res) {
  const [rows]=await getPool().query(
    `SELECT i.*,p.Product_Name,l.Location_Name
     FROM inventory i JOIN product p ON p.Product_ID=i.Product_ID
     JOIN location l ON l.Location_ID=i.Location_ID
     ORDER BY i.Expiry_Date ASC`
  );
  return ok(res,rows);
}

async function create(req,res) {
  const b=req.body||{};
  const required=["Product_ID","Location_ID","Batch_Number","Mfg_Date","Expiry_Date","Quantity_On_Hand","Unit_Cost"];
  for(const k of required) if(b[k]===undefined||b[k]===null||b[k]==="") return fail(res,400,`${k} is required`);
  if(Number(b.Quantity_On_Hand)<0 || Number(b.Unit_Cost)<0 || Number(b.Reorder_Level||0)<0) return fail(res,400,"Quantity, reorder level and unit cost cannot be negative");
  if(new Date(b.Expiry_Date)<new Date(b.Mfg_Date)) return fail(res,400,"Expiry date cannot be before manufacturing date");
  const [result]=await getPool().execute(
    `INSERT INTO inventory (Product_ID,Location_ID,Batch_Number,Mfg_Date,Expiry_Date,Quantity_On_Hand,Reorder_Level,Unit_Cost)
     VALUES (?,?,?,?,?,?,?,?)`,
    [b.Product_ID,b.Location_ID,b.Batch_Number,b.Mfg_Date,b.Expiry_Date,b.Quantity_On_Hand,b.Reorder_Level||0,b.Unit_Cost]
  );
  const [rows]=await getPool().execute("SELECT Product_ID,Batch_Number FROM inventory WHERE Inventory_ID=?",[result.insertId]);
  await recordStockEvent({eventType:"STOCK_CREATED",inventoryId:result.insertId,productId:rows[0]?.Product_ID,batchNumber:rows[0]?.Batch_Number,quantity:Number(b.Quantity_On_Hand),description:"New inventory batch created",performedBy:req.user});
  return ok(res,{id:result.insertId},201,"Inventory batch created");
}

async function adjust(req,res) {
  const id=Number(req.params.id), delta=Number(req.body?.quantityChange);
  if(!Number.isFinite(delta)||delta===0) return fail(res,400,"quantityChange must be a non-zero number");
  const pool=getPool(), conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows]=await conn.execute("SELECT * FROM inventory WHERE Inventory_ID=? FOR UPDATE",[id]);
    if(!rows.length){await conn.rollback();return fail(res,404,"Inventory batch not found");}
    const current=Number(rows[0].Quantity_On_Hand), next=current+delta;
    if(next<0){await conn.rollback();return fail(res,400,"Adjustment cannot make stock negative");}
    await conn.execute("UPDATE inventory SET Quantity_On_Hand=? WHERE Inventory_ID=?",[next,id]);
    await conn.execute(
      `INSERT INTO stock_movement (Inventory_ID,Movement_Type,Quantity,Notes)
       VALUES (?,?,?,?)`,
      [id,delta>0?"IN":"OUT",Math.abs(delta),req.body?.notes||"Manual stock adjustment"]
    );
    await conn.commit();
    await recordStockEvent({eventType:"STOCK_ADJUSTED",inventoryId:id,productId:rows[0].Product_ID,batchNumber:rows[0].Batch_Number,quantity:delta,description:"Inventory quantity adjusted",performedBy:req.user,metadata:{previous:current,current:next}});
    return ok(res,{inventoryId:id,previousQuantity:current,currentQuantity:next},200,"Stock adjusted");
  } catch(e){await conn.rollback();throw e;} finally{conn.release();}
}

module.exports={list,create,adjust};
