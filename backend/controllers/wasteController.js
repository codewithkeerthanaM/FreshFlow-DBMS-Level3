const { getPool }=require("../config/mysql");
const { ok,fail }=require("../utils/response");
const { recordStockEvent,recordMonitoring }=require("../services/eventService");

async function list(req,res){
 const [rows]=await getPool().query(
  `SELECT w.*,p.Product_Name,i.Batch_Number,i.Unit_Cost
   FROM waste w JOIN inventory i ON i.Inventory_ID=w.Inventory_ID
   JOIN product p ON p.Product_ID=i.Product_ID ORDER BY w.Waste_Date DESC`
 );
 return ok(res,rows);
}

async function create(req,res){
 const b=req.body||{};
 if(!b.Inventory_ID||!b.Quantity_Wasted||Number(b.Quantity_Wasted)<=0||!b.Reason) return fail(res,400,"Inventory_ID, positive Quantity_Wasted and Reason are required");
 const pool=getPool(),conn=await pool.getConnection();
 let inserted;
 try{
  await conn.beginTransaction();
  const [inv]=await conn.execute("SELECT * FROM inventory WHERE Inventory_ID=? FOR UPDATE",[b.Inventory_ID]);
  if(!inv.length){await conn.rollback();return fail(res,404,"Inventory batch not found");}
  if(Number(b.Quantity_Wasted)>Number(inv[0].Quantity_On_Hand)){await conn.rollback();return fail(res,400,"Waste quantity cannot exceed available stock");}
  // The SQL AFTER INSERT trigger performs the inventory decrement and inserts the OUT stock movement.
  const [result]=await conn.execute(
   `INSERT INTO waste (Inventory_ID,Quantity_Wasted,Reason,Disposal_Method,Remarks)
    VALUES (?,?,?,?,?)`,
   [b.Inventory_ID,b.Quantity_Wasted,b.Reason,b.Disposal_Method||null,b.Remarks||null]
  );
  inserted=result.insertId;
  await conn.commit();
 }catch(e){await conn.rollback();throw e;}finally{conn.release();}
 await recordStockEvent({eventType:"WASTE_RECORDED",inventoryId:Number(b.Inventory_ID),productId:inv[0].Product_ID,batchNumber:inv[0].Batch_Number,quantity:-Number(b.Quantity_Wasted),description:"Waste recorded; MySQL trigger updated stock and movement",performedBy:req.user,metadata:{wasteId:inserted,reason:b.Reason}});
 await recordMonitoring({action:"waste.created",description:"Waste record created",userId:req.user?.id,userEmail:req.user?.email,metadata:{wasteId:inserted}});
 return ok(res,{id:inserted},201,"Waste recorded");
}

module.exports={list,create};
