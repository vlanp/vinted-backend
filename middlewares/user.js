const validator = require("validator");

const usernameValidation = (req, res, next) => {
  try {
    const { username } = req.body;

    if (typeof username !== "string") {
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

    return next();
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

const passwordValidation = (req, res, next) => {
  try {
    const { password } = req.body;

    if (typeof password !== "string") {
      throw {
        status: 400,
        message: "Incorrect password. Please enter a password.",
      };
    }

    if (!validator.isStrongPassword(password)) {
      throw {
        status: 406,
        message:
          "Incorrect password. Your password must be at least 8 characters long with at least 1 lowercase, 1 uppercase, 1 number and 1 symbol",
      };
    }

    return next();
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

const emailValidation = (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string") {
      throw {
        status: 400,
        message: "Incorrect email. Please enter an email.",
      };
    }

    if (!validator.isEmail(email)) {
      throw {
        status: 406,
        message: "Incorrect email. Please enter a valid email.",
      };
    }

    return next();
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

const newsletterValidation = (req, res, next) => {
  try {
    if (req.body.newsletter !== true && req.body.newsletter !== false) {
      req.body.newsletter = false;
    }

    return next();
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

module.exports = {
  usernameValidation,
  passwordValidation,
  emailValidation,
  newsletterValidation,
};
