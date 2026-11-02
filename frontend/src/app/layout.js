import "./globals.css";
import { AppProvider } from "../context/AppContext";
export const metadata={title:"FreshFlow",description:"Perishable Stock Monitoring & Waste Reduction System"};
export default function RootLayout({children}){return <html lang="en"><body><AppProvider>{children}</AppProvider></body></html>}