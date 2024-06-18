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
const paymentRouter = require("./routes/payment");

app.use("/user", userRouter);
app.use(offerRouter);
app.use(paymentRouter);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route doesn't exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
