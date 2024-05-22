const User = require("../models/User");

const isAuthentificated = async (req, res, next) => {
  try {
    if (!req.headers || !req.headers.authorization) {
      throw { status: 401, message: "Unauthorized access" };
    }

    const token = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({
      token: token,
    });

    if (!user) {
      throw { status: 401, message: "Unauthorized access" };
    }

    req.user = user;
    return next();
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

module.exports = { isAuthentificated };
