const {getPool}=require("../config/mysql");
const {ok,fail}=require("../utils/response");
const {recordMonitoring}=require("../services/eventService");
async function list(req,res){
 const [rows]=await getPool().query(`SELECT p.*,s.Supplier_Name FROM purchase p JOIN supplier s ON s.Supplier_ID=p.Supplier_ID ORDER BY p.Purchase_Date DESC`);
 return ok(res,rows);
}
async function create(req,res){
 const b=req.body||{};
 if(!b.Supplier_ID||!b.Purchase_Date||b.Total_Amount===undefined||Number(b.Total_Amount)<0||!b.Payment_Status) return fail(res,400,"Supplier_ID, Purchase_Date, non-negative Total_Amount and Payment_Status are required");
 const allowed=["Pending","Partial","Paid"];
 if(!allowed.includes(b.Payment_Status)) return fail(res,400,"Invalid payment status");
 const [r]=await getPool().execute("INSERT INTO purchase (Supplier_ID,Purchase_Date,Total_Amount,Payment_Status) VALUES (?,?,?,?)",[b.Supplier_ID,b.Purchase_Date,b.Total_Amount,b.Payment_Status]);
 await recordMonitoring({action:"purchase.created",description:"Purchase header created",userId:req.user?.id,userEmail:req.user?.email,metadata:{purchaseId:r.insertId}});
 return ok(res,{id:r.insertId},201,"Purchase created");
}
module.exports={list,create};
