const express = require("express");
const router = express.Router();
const hashPassword = require("../utils/passwordProtection");
const {
  usernameValidation,
  passwordValidation,
  emailValidation,
  newsletterValidation,
} = require("../middlewares/user");

const User = require("../models/User");
const uid2 = require("uid2");

/**
  @todo Add logic to send an email to verify an email. Here is the steps to do so: 
  What you're looking for is called "account verification" or "email verification". There are plenty of Node modules that can perform this, but the principle goes like this:
  Your User model should have an active attribute that is false by default
  When the user submits a valid signup form, create a new User (who's active will be false initially)
  Create a long random string (128 characters is usually good) with a crypto library and store it in your database with a reference to the User ID
  Send an email to the supplied email address with the randomly generated string as part of a link pointing back to a route on your server
  When a user clicks the link and hits your route, check for the string passed in the URL
  If the string exists in the database, get the related user and set their active property to true
  Delete the string from the database, it is no longer needed
  Your user is now verified.
 */
router.post(
  "/signup",
  usernameValidation,
  passwordValidation,
  emailValidation,
  newsletterValidation,
  async (req, res) => {
    try {
      const { username, password, email, newsletter } = req.body;

      const user = await User.findOne({ email: email });

      if (user) {
        throw {
          status: 409,
          message:
            "Incorrect email. There is already an account associated to this email.",
        };
      }

      const { salt, hash, token } = hashPassword(password);

      const randomString = uid2(128);

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
        randomString: randomString,
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
  }
);

router.post("/login", emailValidation, passwordValidation, async (req, res) => {
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

    const hashToVerify = hashPassword(password, salt).hash;

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
