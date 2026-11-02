require("dotenv").config();
const bcrypt=require("bcryptjs");
const {connectMySQL,getPool,closeMySQL}=require("../config/mysql");
async function run(){
 const {ADMIN_NAME,ADMIN_EMAIL,ADMIN_PASSWORD}=process.env;
 if(!ADMIN_NAME||!ADMIN_EMAIL||!ADMIN_PASSWORD||ADMIN_PASSWORD.length<12) throw new Error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env");
 await connectMySQL();
 const [roles]=await getPool().execute("SELECT Role_ID FROM role WHERE UPPER(Role_Name)='ADMIN' LIMIT 1");
 if(!roles.length) throw new Error("ADMIN role not found. Run the final SQL DML role inserts first.");
 const hash=await bcrypt.hash(ADMIN_PASSWORD,12);
 const [existing]=await getPool().execute("SELECT User_ID FROM `user` WHERE Email=?",[ADMIN_EMAIL.toLowerCase()]);
 if(existing.length){
  await getPool().execute("UPDATE `user` SET Full_Name=?,Password_Hash=?,Role_ID=?,Status='Active' WHERE User_ID=?",[ADMIN_NAME,hash,roles[0].Role_ID,existing[0].User_ID]);
  console.log("Existing admin password and details updated.");
 }else{
  await getPool().execute("INSERT INTO `user` (Full_Name,Email,Password_Hash,Role_ID,Status) VALUES (?,?,?,?, 'Active')",[ADMIN_NAME,ADMIN_EMAIL.toLowerCase(),hash,roles[0].Role_ID]);
  console.log("Admin account created.");
 }
}
run().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>closeMySQL().catch(()=>{}));
