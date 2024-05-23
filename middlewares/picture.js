const pictureValidation = (req, res, next) => {
  try {
    if (req.files) {
      const { picture } = req.files;
      if (!picture) {
        return next ? next() : true;
      }
      if (!picture.mimetype || !picture.data) {
        req.files.picture = undefined;
      }
    } else {
      req.files = {};
      req.files.picture = undefined;
    }
    return next ? next() : true;
  } catch (error) {
    res
      ? res
          .status(error.status || 500)
          .json({ message: error.message || "Internal server error" })
      : null;
  }
};

module.exports = { pictureValidation };