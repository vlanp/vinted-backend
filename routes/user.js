const express = require("express");
const router = express.Router();
const hashPassword = require("../utils/passwordProtection");
const fileUpload = require("express-fileupload");
const User = require("../models/User");
const uid2 = require("uid2");
const { uploadPicture } = require("../utils/cloudinary");
const { sendEmail } = require("../utils/email");
const { isArgumentValid } = require("../middlewares/argumentValidation");

router.post(
  "/signup",
  fileUpload(),
  isArgumentValid({
    parameterType: "body",
    argumentName: "username",
    argumentType: "string",
    stringOption: {
      argumentMinLength: 2,
    },
  }),
  isArgumentValid({
    parameterType: "body",
    argumentName: "password",
    argumentType: "string",
    stringOption: {
      mustBeStrongPassword: true,
    },
  }),
  isArgumentValid({
    parameterType: "body",
    argumentName: "email",
    argumentType: "string",
    stringOption: {
      mustBeEmail: true,
    },
  }),
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
        "Please click on the link below to activate your account : \n" +
          "https://site--backend-vinted--x7c7hl9cnzx6.code.run" +
          "/user/mailcheck/" +
          randomString
      );

      const isNewsletterValidFunction = isArgumentValid({
        parameterType: "body",
        argumentName: "newsletter",
        argumentType: "boolean",
        isMiddleware: false,
      });
      const isNewsletterValid = isNewsletterValidFunction(req, res);

      const isPictureValidFunction = isArgumentValid({
        parameterType: "files",
        argumentName: "picture",
        argumentType: "picture",
        isMiddleware: false,
      });
      const isPictureValid = isPictureValidFunction(req, res);

      const newUser = new User({
        email: email,
        account: {
          username: username,
          avatar: null,
        },
        newsletter: isNewsletterValid ? newsletter : false,
        token: token,
        hash: hash,
        salt: salt,
        randomString: randomString,
      });

      if (isPictureValid) {
        const { picture } = req.files;
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

router.post(
  "/login",
  isArgumentValid({
    parameterType: "body",
    argumentName: "password",
    argumentType: "string",
    stringOption: {
      mustBeStrongPassword: true,
    },
  }),
  isArgumentValid({
    parameterType: "body",
    argumentName: "email",
    argumentType: "string",
    stringOption: {
      mustBeEmail: true,
    },
  }),
  async (req, res) => {
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
  }
);

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

router.get("/account", async (req, res) => {
  try {
    if (!req.headers || !req.headers.authorization) {
      throw { status: 401, message: "Unauthorized access" };
    }

    const token = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({
      token: token,
    });

    if (!user) {
      throw { status: 404, message: "No user found with this token" };
    }

    res.status(200).json({
      username: user.account.username,
      avatar: user.account.avatar?.secure_url,
      email: user.email,
      active: user.active,
      newsletter: user.newsletter,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

router.patch("/account", fileUpload(), async (req, res) => {
  try {
    if (!req.headers || !req.headers.authorization) {
      throw { status: 401, message: "Unauthorized access" };
    }

    const token = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({
      token: token,
    });

    if (!user) {
      throw { status: 404, message: "No user found with this token" };
    }

    const { newsletter, username } = req.body;

    const isUsernameValidFunction = isArgumentValid({
      parameterType: "body",
      argumentName: "username",
      argumentType: "string",
      isMiddleware: false,
      stringOption: {
        argumentMinLength: 2,
      },
    });
    const isUsernameValid = isUsernameValidFunction(req, res);

    const isNewsletterValidFunction = isArgumentValid({
      parameterType: "body",
      argumentName: "newsletter",
      argumentType: "boolean",
      isMiddleware: false,
    });
    const isNewsletterValid = isNewsletterValidFunction(req, res);

    const isPictureValidFunction = isArgumentValid({
      parameterType: "files",
      argumentName: "picture",
      argumentType: "picture",
      isMiddleware: false,
    });
    const isPictureValid = isPictureValidFunction(req, res);

    if (isUsernameValid) {
      user.account.username = username;
    }

    if (isNewsletterValid) {
      user.newsletter = newsletter;
    }

    if (isPictureValid) {
      const { picture } = req.files;
      const folder = "/vinted/user/" + user._id;
      const pictureDataObj = await uploadPicture(picture, folder);
      user.account.avatar = pictureDataObj;
    }

    await user.save();

    res.status(200).json({
      username: user.account.username,
      avatar: user.account.avatar?.secure_url,
      email: user.email,
      active: user.active,
      newsletter: user.newsletter,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

module.exports = router;
