const titleValidation = (
  req,
  res,
  next,
  parametersType = "body",
  parametersName = "title"
) => {
  try {
    const title = req[parametersType][parametersName];

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
      : console.log(error.message);
  }
};

const descriptionValidation = (
  req,
  res,
  next,
  parametersType = "body",
  parametersName = "description"
) => {
  try {
    const description = req[parametersType][parametersName];

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
      : console.log(error.message);
  }
};

const priceValidation = (
  req,
  res,
  next,
  parametersType = "body",
  parametersName = "price"
) => {
  try {
    const price = Number(req[parametersType][parametersName]);

    if (typeof price !== "number" || Number.isNaN(price)) {
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

    req[parametersType][parametersName] = price;

    return next ? next() : true;
  } catch (error) {
    res
      ? res
          .status(error.status || 500)
          .json({ message: error.message || "Internal server error" })
      : console.log(error.message);
  }
};

const sortValidation = (
  req,
  res,
  next,
  parametersType = "query",
  parametersName = "sort"
) => {
  try {
    const sort = req[parametersType][parametersName];

    if (sort !== "price-desc" && sort !== "price-asc") {
      throw {
        status: 406,
        message: "Incorrect sort. Must be price-desc or price-asc.",
      };
    }

    req[parametersType][parametersName] =
      sort === "price-desc" ? "desc" : "asc";

    return next ? next() : true;
  } catch (error) {
    res
      ? res
          .status(error.status || 500)
          .json({ message: error.message || "Internal server error" })
      : console.log(error.message);
  }
};

const pageValidation = (
  req,
  res,
  next,
  parametersType = "query",
  parametersName = "page"
) => {
  try {
    const page = Number(req[parametersType][parametersName]);

    if (!Number.isInteger(page)) {
      throw {
        status: 406,
        message: "Incorrect page number. Must be an integer.",
      };
    }

    if (page < 1) {
      throw {
        status: 406,
        message: "Incorrect page number. Must be >= 1.",
      };
    }

    req[parametersType][parametersName] = page;

    return next ? next() : true;
  } catch (error) {
    res
      ? res
          .status(error.status || 500)
          .json({ message: error.message || "Internal server error" })
      : console.log(error.message);
  }
};

module.exports = {
  titleValidation,
  descriptionValidation,
  priceValidation,
  sortValidation,
  pageValidation,
};
