const {getPool}=require("../config/mysql");
const {ok,fail}=require("../utils/response");
const {recordAlertEvent}=require("../services/eventService");
async function list(req,res){
 const [rows]=await getPool().query(`SELECT a.*,p.Product_Name,i.Batch_Number FROM alert a JOIN inventory i ON i.Inventory_ID=a.Inventory_ID JOIN product p ON p.Product_ID=i.Product_ID ORDER BY a.Alert_Date DESC`);
 return ok(res,rows);
}
async function updateStatus(req,res){
 const status=req.body?.status;
 if(!["Active","Read","Resolved"].includes(status))return fail(res,400,"Status must be Active, Read or Resolved");
 const [r]=await getPool().execute("UPDATE alert SET Status=? WHERE Alert_ID=?",[status,req.params.id]);
 if(!r.affectedRows)return fail(res,404,"Alert not found");
 await recordAlertEvent({eventType:"ALERT_STATUS_CHANGED",alertId:Number(req.params.id),description:`Alert status changed to ${status}`,performedBy:req.user,metadata:{status}});
 return ok(res,{id:Number(req.params.id),status},200,"Alert updated");
}
module.exports={list,updateStatus};
