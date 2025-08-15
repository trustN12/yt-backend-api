import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";


import User from "../schema/user.schema.js"
import cloudinary from "../config/cloudinary.js"

const router = express.Router();

router.post("/signup", async(req, res)=>{
   try {
      console.log("Request coming")
      const hashPassword = await bcrypt.hash(req.body.password, 10);
      console.log(hashPassword);
      
      const uploadImage = await cloudinary.uploader.upload(
         req.files.logoUrl.tempFilePath
      )

      console.log("Image📷", uploadImage);
      

      const newUser = new User({
         _id: new mongoose.Types.ObjectId,
         email: req.body.email,
         password: hashPassword,
         channelName: req.body.channelName,
         phone: req.body.phone,
         logoUrl: uploadImage.secure_url,
         logoId: uploadImage.public_id
      })


      let user = await newUser.save();


      res.status(201).json({
         user
      })
   } catch (error) {
      console.log(error)
   }
})

export default router;