import express, { Router } from "express";
import mongoose from "mongoose";

import User from "../schema/user.schema.js";
import Video from "../schema/video.schema.js";
import cloudinary from "../config/cloudinary.js";
import { checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// todo: upload video

router.post("/upload-video", checkAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    if (!req.files || !req.files.video || !req.files.thumbnail) {
      return res.status(400).json({ error: "video & thumbnail are required" });
    }

    const videoUpload = await cloudinary.uploader.upload(
      req.files.video.tempFilePath,
      {
        resource_type: "video",
        folder: "videos",
      }
    );

    const thumbnailUpload = await cloudinary.uploader.upload(
      req.files.thumbnail.tempFilePath,
      {
        folder: "thumbnails",
      }
    );

    const newVideo = new Video({
      _id: new mongoose.Types.ObjectId(),
      title,
      description,
      user_id: req.user._id,
      videoUrl: videoUpload.secure_url,
      videoId: videoUpload.public_id,
      thumbnailUrl: thumbnailUpload.secure_url,
      thumbnailId: thumbnailUpload.public_id,
      category,
      tags: tags ? tags.split(",") : [],
    });

    await newVideo.save();

    res
      .status(201)
      .json({ message: "Video uploaded successfully", video: newVideo });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something went wrong", message: error.message });
  }
});

// todo: Update video (no video change, only metadata & thumbnail)

router.put("/update/:id", checkAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    const videoId = req.params.id;

    // todo: find video by ID
    let video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: "videos not found!" });
    }

    if(video.user_id.toString() !== req.user._id.toString()){
      return res.status(404).json({ error: "unauthorized" });
    }
      
    //! If new thumbnail provided, delete old one & upload new
    if(req.files && req.files.thumbnail){
      await cloudinary.uploader.destroy(video.thumbnmailId); // Delete old thumbnail

      const thumbnailUpload = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath, {
        folder: "thumbnails",
      });

      video.thumbnmailUrl = thumbnailUpload.secure_url;
      video.thumbnmailId = thumbnailUpload.public_id;
    }

     //todo: Update Fields
     video.title = title || video.title;
     video.description = description || video.description;
     video.category = category || video.category;
     video.tags = tags ? tags.split(",") : video.tags;
 
     await video.save();
     res.status(200).json({ message: "Video updated successfully", video });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});


// todo: Delete Video
router.delete("/delete/:id", checkAuth, async (req, res) => {
  try {
    const videoId = req.params.id;

    let video = await Video.findById(`video/${videoId}`);
    if (!video) return res.status(404).json({ error: "Video not found" });

    if (video.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(video.videoId, { resource_type: "video" });
    await cloudinary.uploader.destroy(video.thumbnmailId);

    await Video.findByIdAndDelete(videoId);
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});


// todo: Get All Videos
router.get("/all", async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// todo: Get Own Videos
router.get("/my-videos", checkAuth, async (req, res) => {
  try {
    const videos = await Video.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});


// todo: Get Video by ID
router.get("/:id", checkAuth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user._id;

    // Use findByIdAndUpdate to add the user ID to the viewedBy array if not already present
    const video = await Video.findByIdAndUpdate(
      videoId,
      {
        $addToSet: { viewedBy: userId },  // Add user ID to viewedBy array, avoiding duplicates
      },
      { new: true }  // Return the updated video document
    );

    if (!video) return res.status(404).json({ error: "Video not found" });

    res.status(200).json(video);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});


// todo: Get Videos by Category
router.get("/category/:category", async (req, res) => {
  try {
    const videos = await Video.find({ category: req.params.category }).sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// todo: Get Videos by Tags
router.get("/tags/:tag", async (req, res) => {
  try {
    const tag = req.params.tag;
    const videos = await Video.find({ tags: tag }).sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});



// todo: Like Video
router.post("/like", checkAuth , async (req, res) => {
  try {
    const {  videoId } = req.body;

    await Video.findByIdAndUpdate(videoId, {
      $addToSet: { likes: req.user._id  },
      $pull: { dislikes: req.user._id }, // Remove from dislikes if previously disliked
    });

    res.status(200).json({ message: "Liked the video" });
  } catch (error) {
    console.error("Like Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

//todo: UnLike Video
router.post("/dislike",checkAuth , async (req, res) => {
  try {
    const { videoId } = req.body;

    await Video.findByIdAndUpdate(videoId, {
      $addToSet: { dislikes: req.user._id},
      $pull: { likes: req.user._id }, // Remove from likes if previously liked
    });

    res.status(200).json({ message: "Disliked the video" });
  } catch (error) {
    console.error("Dislike Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});



export default router;
