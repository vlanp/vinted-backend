const titleValidation = (req, res, next) => {
  try {
    const { title } = req.body;

    if (typeof title !== "string") {
      throw { status: 406, message: "Incorrect title. Please enter a title." };
    }

    if (title.length === 0 || title.length > 50) {
      throw {
        status: 406,
        message:
          "Incorrect title. Title length must be between 1 and 50 characters.",
      };
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

const descriptionValidation = (req, res, next) => {
  try {
    const { description } = req.body;

    if (typeof description !== "string") {
      throw {
        status: 406,
        message: "Incorrect description. Please enter a description.",
      };
    }

    if (description.length === 0 || description.length > 500) {
      throw {
        status: 406,
        message:
          "Incorrect description. The description length must be between 1 and 500 characters.",
      };
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

const priceValidation = (req, res, next) => {
  try {
    const price = Number(req.body.price);

    if (typeof price !== "number") {
      throw {
        status: 406,
        message: "Incorrect price. Please enter a price.",
      };
    }

    if (price <= 0 || price > 100000) {
      throw {
        status: 406,
        message:
          "Incorrect price. The price must be superior to 0 and less than 100 000.",
      };
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

module.exports = {
  titleValidation,
  descriptionValidation,
  priceValidation,
};
