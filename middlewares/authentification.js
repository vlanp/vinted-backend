const User = require("../models/User");

/**
 * Return next() if the parameter req contains a Bearer token in req.headers.authorization and if this token correspond to a user in the database.
 * Use as a middleware with express package, next() make the code continue to the next middleware.
 * The user found in the database is added to req.user and can be access in the next middleware.
 * Return undefined if there is no valid Bearer token in the req, and respond to the client.
 *
 * @param req The object that contains all the datas and information about the request send to the express route.
 * @param res The object that allows to respond to the request send to the express route.
 * @param next The function that allows to go to the next middleware when it is returned.
 * @return next() if there is a valid Bearer token in the req parameter and undefined if not.
 */
const isAuthentificated = async (req, res, next) => {
  try {
    if (!req.headers || !req.headers.authorization) {
      throw { status: 401, message: "Unauthorized access" };
    }

    const token = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({
      token: token,
    }).select("account");

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
