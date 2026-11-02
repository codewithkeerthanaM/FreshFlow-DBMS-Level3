"use client";
import {createContext,useContext,useEffect,useState} from "react";
import {auth,dataOf} from "../services/api";
const C=createContext(null);
export function AppProvider({children}){
 const [user,setUser]=useState(null);
 const [token,setToken]=useState(null);
 useEffect(()=>{const t=localStorage.getItem("freshflow_token");if(t){setToken(t);auth.me().then(r=>setUser(dataOf(r).user||dataOf(r))).catch(()=>{localStorage.removeItem("freshflow_token");setToken(null)})}},[]);
 const login=async(email,password)=>{const d=dataOf(await auth.login({email,password}));if(!d.token)throw Error("Login response did not include token");localStorage.setItem("freshflow_token",d.token);setToken(d.token);setUser(d.user||{});return d.user};
 const logout=()=>{localStorage.removeItem("freshflow_token");setToken(null);setUser(null);window.location.href="/login"};
 return <C.Provider value={{user,token,login,logout}}>{children}</C.Provider>
}
export const useApp=()=>useContext(C);