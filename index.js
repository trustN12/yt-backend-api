import express from "express";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser"

import { ConnectDB } from "./config/db.config.js";
import  userRoutes  from "./routes/user.routes.js"

dotenv.config();


const app = express();

ConnectDB();

//! Middleware to parse JSON request bodies
// app.use(express.json());

app.use(bodyParser.json());

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "./temp/"
}))

//todo: Middleware setup
app.use('/api/v1/user', userRoutes)

const port = process.env.PORT;

app.listen(port, ()=>{
  console.log(`Server is running at http://localhost:${port}`); 
  
})

