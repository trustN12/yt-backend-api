import express from "express";
import dotenv from "dotenv";


import { ConnectDB } from "./config/db.config.js";
import  userRoutes  from "./routes/user.routes.js"

dotenv.config();


const app = express();

ConnectDB();

//! Middleware to parse JSON request bodies
app.use(express.json());

//todo: Middleware setup
app.use('/api/v1/user', userRoutes)

const port = process.env.PORT;

app.listen(port, ()=>{
  console.log(`Server is running at http://localhost:${port}`); 
  
})

