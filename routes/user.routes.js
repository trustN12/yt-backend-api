import express from "express";


const router = express.Router();

router.post("/signup", (req, res)=>{
   res.send("Welcome to Youtube, Please signup!")
})

export default router;