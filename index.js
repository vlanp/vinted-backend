const express = require("express");
const app = express();

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/vinted");

app.use(express.json());

const userRouter = require("./routes/user");
const offerRouter = require("./routes/offer");

app.use("/user", userRouter);
app.use("/offer", offerRouter);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route doesn't exist" });
});

app.listen(3000, () => {
  console.log("Server started");
});
