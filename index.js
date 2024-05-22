const express = require("express");
const app = express();

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/vinted");

app.use(express.json());

const accountRouter = require("./routes/user");

app.use("/user", accountRouter);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route doesn't exist" });
});

app.listen(3000, () => {
  console.log("Server started");
});
