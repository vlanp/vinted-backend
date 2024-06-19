const validator = require("validator");

/**
 * Return **next()** or **undefined** when use as a **middleware** and return **true** or **undefined** otherwise.
 *
 * With express **next()** make the code continue to the next middleware.
 *
 * @param parameterType **Mandatory parameter**. Must represent the key in which the argument is stored (**eg: body, params, query, files...**)
 * @param argumentName **Mandatory parameter**. Must represent the name of the argument stored in **req[***parameterType***]**
 * @param argumentType **Mandatory parameter**. Must represent the type (**ie: string, number, picture or boolean**) for which the argument will be validate
 * @param stringOption **Optional parameter**. Allow to add some options when ***argumentType***=**string**
 * @param numberOption **Optional parameter**. Allow to add some options when ***argumentType***=**number**
 * @param isMiddleware **Optional parameter**. Must be set to **false** when the funtion is not used as a middleware
 * @return **next()** or **true** or **undefined**
 */
const isArgumentValid = ({
  parameterType,
  argumentName,
  argumentType,
  stringOption = {
    argumentMinLength: undefined,
    argumentMaxLength: undefined,
    mustBeStrongPassword: undefined,
    mustBeEmail: undefined,
    argumentTransformObj: undefined,
  },
  numberOption = {
    argumentMinValue: undefined,
    argumentMaxValue: undefined,
    mustBeInteger: undefined,
  },
  isMiddleware = true,
}) => {
  const isString = (req, res, next) => {
    try {
      let argument = req[parameterType][argumentName];

      console.log(argument);

      if (typeof argument !== "string") {
        throw {
          status: 406,
          message:
            "Incorrect " +
            argumentName +
            ". Please enter a valid " +
            argumentName +
            ". (format: " +
            argumentType +
            ")",
        };
      }

      if (
        (stringOption.argumentMinLength
          ? argument.length < stringOption.argumentMinLength
          : false) ||
        (stringOption.argumentMaxLength
          ? argument.length > stringOption.argumentMaxLength
          : false)
      ) {
        const part1 = stringOption.argumentMinLength
          ? argumentName +
            " length must be at least " +
            stringOption.argumentMinLength +
            " char long"
          : "";
        const part2 = part1
          ? stringOption.argumentMaxLength
            ? " and not more than " + stringOption.argumentMaxLength + " char."
            : ""
          : stringOption.argumentMaxLength
          ? argumentName +
            " length must be no more than " +
            stringOption.argumentMinLength +
            " char long."
          : "";
        throw {
          status: 406,
          message: "Incorrect " + argumentName + ". " + part1 + part2,
        };
      }

      if (
        stringOption.mustBeStrongPassword
          ? !validator.isStrongPassword(argument)
          : false
      ) {
        throw {
          status: 406,
          message:
            "Incorrect password. Your password must be at least 8 characters long with at least 1 lowercase, 1 uppercase, 1 number and 1 symbol",
        };
      }

      if (stringOption.mustBeEmail ? !validator.isEmail(argument) : false) {
        throw {
          status: 406,
          message: "Incorrect email. Please enter a valid email.",
        };
      }

      const keyList = stringOption.argumentTransformObj
        ? Object.keys(stringOption.argumentTransformObj)
        : [];
      if (keyList.length !== 0) {
        if (!keyList.includes(argument)) {
          throw {
            status: 406,
            message:
              "Incorrect " +
              argumentName +
              ". Must be " +
              keyList.join(" or ") +
              ".",
          };
        }
        argument = stringOption.argumentTransformObj[argument];
        req[parameterType][argumentName] = argument;
      }

      return isMiddleware ? next() : true;
    } catch (error) {
      isMiddleware
        ? res
            .status(error.status || 500)
            .json({ message: error.message || "Internal server error" })
        : console.log(error.message);
    }
  };

  const isNumber = (req, res, next) => {
    try {
      const argument = Number(req[parameterType][argumentName]);

      console.log(argument);

      if (typeof argument !== "number" || Number.isNaN(argument)) {
        throw {
          status: 406,
          message:
            "Incorrect " +
            argumentName +
            ". Please enter a valid " +
            argumentName +
            ". (format: " +
            argumentType +
            ")",
        };
      }

      if (stringOption.mustBeInteger ? !Number.isInteger(argument) : false) {
        throw {
          status: 406,
          message: "Incorrect " + argumentName + ". Must be an integer.",
        };
      }

      if (
        (numberOption.argumentMinValue
          ? argument < numberOption.argumentMinValue
          : false) ||
        (numberOption.argumentMaxValue
          ? argument > numberOption.argumentMaxValue
          : false)
      ) {
        const part1 = stringOption.argumentMinLength
          ? argumentName +
            "  must be superior than " +
            stringOption.argumentMinLength
          : "";
        const part2 = part1
          ? stringOption.argumentMaxLength
            ? " and not more than " + stringOption.argumentMaxLength + "."
            : ""
          : stringOption.argumentMaxLength
          ? argumentName +
            " must be no more than " +
            stringOption.argumentMinLength +
            "."
          : "";
        throw {
          status: 406,
          message: "Incorrect " + argumentName + ". " + part1 + part2,
        };
      }

      req[parameterType][argumentName] = argument;

      return isMiddleware ? next() : true;
    } catch (error) {
      isMiddleware
        ? res
            .status(error.status || 500)
            .json({ message: error.message || "Internal server error" })
        : console.log(error.message);
    }
  };

  const isPicture = (req, res, next) => {
    try {
      if (req[parameterType]) {
        if (!Array.isArray(req.files[argumentName])) {
          const picture = req.files[argumentName];
          if (!picture || !picture.mimetype || !picture.data) {
            throw {
              status: 400,
              message: "No picture found",
            };
          }
        } else {
          const pictureList = req.files[argumentName];

          for (let i = 0; i <= pictureList.length - 1; i++) {
            const picture = pictureList[i];
            if (!picture || !picture.mimetype || !picture.data) {
              pictureList.splice(i, 1);
              i--;
            }
          }

          if (pictureList.length === 0) {
            throw {
              status: 400,
              message: "No picture found",
            };
          }
        }
      } else {
        throw {
          status: 400,
          message: "No picture found",
        };
      }
      return isMiddleware ? next() : true;
    } catch (error) {
      isMiddleware
        ? res
            .status(error.status || 500)
            .json({ message: error.message || "Internal server error" })
        : console.log(error.message);
    }
  };

  const isBoolean = (req, res, next) => {
    try {
      let argument = req[parameterType][argumentName];
      const allowedArgumentList = [
        0,
        1,
        "0",
        "1",
        false,
        true,
        "false",
        "true",
      ];

      if (!allowedArgumentList.includes(argument)) {
        throw {
          status: 406,
          message: argumentName + " is not a boolean.",
        };
      }

      if ((allowedArgumentList.indexOf(argument) + 1) % 2 === 0) {
        argument = true;
      } else {
        argument = false;
      }

      req[parameterType][argumentName] = argument;

      return isMiddleware ? next() : true;
    } catch (error) {
      isMiddleware
        ? res
            .status(error.status || 500)
            .json({ message: error.message || "Internal server error" })
        : console.log(error.message);
    }
  };

  switch (argumentType) {
    case "string":
      return isString;
    case "number":
      return isNumber;
    case "picture":
      return isPicture;
    case "boolean":
      return isBoolean;
  }
};

module.exports = { isArgumentValid };
