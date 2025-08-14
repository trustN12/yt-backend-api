import mongoose from "mongoose";

export const ConnectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database successfully connected 🟢");
  } catch (error) {
    console.log("Error: ", error.message);
    throw new Error("Something went wrong 🔴", error);
  }
};
