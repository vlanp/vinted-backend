const express = require("express");
const router = express.Router();
const hashPassword = require("../utils/passwordProtection");
const {
  usernameValidation,
  passwordValidation,
  emailValidation,
  newsletterValidation,
} = require("../middlewares/user");
const { pictureValidation } = require("../middlewares/picture");
const fileUpload = require("express-fileupload");
const User = require("../models/User");
const uid2 = require("uid2");
const { uploadPicture } = require("../utils/cloudinary");
const { sendEmail } = require("../utils/email");

router.post(
  "/signup",
  fileUpload(),
  usernameValidation,
  passwordValidation,
  emailValidation,
  newsletterValidation,
  pictureValidation,
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

      await sendEmail(
        email,
        "Email verification for Vinted replica website",
        "Please click on the link below to activate your account : \nhttp://localhost:3000/user/mailcheck/" +
          randomString
      );

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

      const { picture } = req.files;

      if (picture) {
        const folder = "/vinted/user/" + newUser._id;
        const pictureDataObj = await uploadPicture(picture, folder);
        newUser.account.avatar = pictureDataObj;
      }

      await newUser.save();

      const response = {
        _id: newUser._id,
        token: token,
        newsletter: newsletter,
        account: newUser.account,
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
      newsletter: user.newsletter,
      account: user.account,
    };

    res.status(200).json(response);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

router.get("/mailcheck/:randomString", async (req, res) => {
  try {
    const randomString = req.params.randomString;

    const user = await User.findOne({ randomString: randomString });

    if (!user) {
      throw {
        status: 404,
        message: "No user found with the randomString : " + randomString,
      };
    }

    user.randomString = null;
    user.active = true;

    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

module.exports = router;
