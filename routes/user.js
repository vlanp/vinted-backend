const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const User = require("../models/User");

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let { newsletter } = req.body;

    if (!username) {
      throw {
        status: 400,
        message: "Incorrect username. Please enter an username.",
      };
    }

    if (username.length < 5 || username.length > 16) {
      throw {
        status: 406,
        message:
          "Incorrect username. Your username must have between 5 and 16 characters.",
      };
    }

    if (!email) {
      throw {
        status: 400,
        message: "Incorrect email. Please enter an email.",
      };
    }

    if (!email.includes("@")) {
      throw {
        status: 406,
        message: "Incorrect email. Your email should have an @.",
      };
    }

    const user = await User.findOne({ email: email });

    if (user) {
      throw {
        status: 409,
        message:
          "Incorrect email. There is already an account associated to this email.",
      };
    }

    if (!password) {
      throw {
        status: 400,
        message: "Incorrect password. Please enter a password.",
      };
    }

    if (password.length < 6 || password.length > 30) {
      throw {
        status: 406,
        message:
          "Incorrect password. Your password must be at least 6 characters long and no more then 30 characters.",
      };
    }

    if (newsletter === undefined) {
      newsletter = false;
    }

    const salt = uid2(64);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(64);

    const newUser = new User({
      email: email,
      account: {
        username: username,
        avatar: null,
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    await newUser.save();

    const response = {
      _id: newUser._id,
      token: token,
      account: { username: username },
    };

    res.status(201).json(response);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
      throw {
        status: 404,
        message: "Unable to log into account. Wrong email and/or password.",
      };
    }

    const { token, hash, salt, _id } = user;

    const hashToVerify = SHA256(password + salt).toString(encBase64);

    if (hashToVerify !== hash) {
      throw {
        status: 404,
        message: "Unable to log into account. Wrong email and/or password.",
      };
    }

    const response = {
      _id: _id,
      token: token,
      account: { username: user.account.username },
    };

    res.status(200).json(response);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

module.exports = router;
