require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

app.use(cors());
app.use(express.json());

const userRouter = require("./routes/user");
const offerRouter = require("./routes/offer");

app.use("/user", userRouter);
app.use(offerRouter);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route doesn't exist" });
});

app.listen(process.env.MONGODB_PORT, () => {
  console.log("Server started");
});
