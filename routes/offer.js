const express = require("express");
const router = express.Router();
const { isAuthentificated } = require("../middlewares/authentification");
const Offer = require("../models/Offer");
const fileUpload = require("express-fileupload");
const { uploadPicture, deletePicture } = require("../utils/cloudinary");
const { isArgumentValid } = require("../middlewares/argumentValidation");

router.post(
  "/offer/publish",
  isAuthentificated,
  fileUpload(),
  isArgumentValid({
    parameterType: "body",
    argumentType: "string",
    argumentName: "title",
    stringOption: {
      argumentMinLength: 2,
      argumentMaxLength: 50,
    },
  }),
  isArgumentValid({
    parameterType: "body",
    argumentType: "string",
    argumentName: "description",
    stringOption: {
      argumentMinLength: 2,
      argumentMaxLength: 500,
    },
  }),
  isArgumentValid({
    parameterType: "body",
    argumentType: "number",
    argumentName: "price",
    numberOption: {
      argumentMinValue: 1,
      argumentMaxValue: 100_000,
    },
  }),
  isArgumentValid({
    parameterType: "files",
    argumentName: "picture",
    argumentType: "picture",
  }),
  async (req, res) => {
    try {
      const {
        title,
        description,
        price,
        condition,
        location,
        brand,
        size,
        color,
      } = req.body;

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: location,
          },
        ],
        owner: req.user,
      });

      const { picture } = req.files;

      const isPictureListValidFunction = isArgumentValid({
        parameterType: "files",
        argumentName: "pictures",
        argumentType: "picture",
        isMiddleware: false,
      });
      const isPictureListValid = isPictureListValidFunction(req, res);

      const pictureList = isPictureListValid ? req.files.pictures : [];

      pictureList.unshift(picture);

      const folder = "/vinted/offers/" + newOffer._id;

      const promiseArray = pictureList.map((picture) => {
        return uploadPicture(picture, folder);
      });

      const uploadResultList = await Promise.all(promiseArray);

      const pictureDataObj = uploadResultList.shift();
      newOffer.product_image = pictureDataObj;

      newOffer.product_pictures = uploadResultList;

      await newOffer.save();

      res.status(201).json(newOffer);
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ message: error.message || "Internal server error" });
    }
  }
);

/**
  @todo Make it possible to delete the picture (not just replace it)
 */
router.put(
  "/offer/modify/:id",
  isAuthentificated,
  fileUpload(),
  async (req, res) => {
    try {
      const offerId = req.params.id;

      const offer = await Offer.findById(offerId).populate("owner", "account");

      if (!offer) {
        throw {
          error: 404,
          message: "No offer were find with the id : " + offerId,
        };
      }

      if (req.user._id.valueOf() !== offer.owner._id.valueOf()) {
        throw {
          error: 401,
          message: "You are not the owner of the offer. You can't modify it.",
        };
      }

      const isTitleValidFunction = isArgumentValid({
        parameterType: "body",
        argumentType: "string",
        argumentName: "title",
        stringOption: {
          argumentMinLength: 2,
          argumentMaxLength: 50,
        },
        isMiddleware: false,
      });
      const isTitleValid = isTitleValidFunction(req, res);

      const isDescriptionValidFunction = isArgumentValid({
        parameterType: "body",
        argumentType: "string",
        argumentName: "description",
        stringOption: {
          argumentMinLength: 2,
          argumentMaxLength: 500,
        },
        isMiddleware: false,
      });
      const isDescriptionValid = isDescriptionValidFunction(req, res);

      const isPriceValidFunction = isArgumentValid({
        parameterType: "body",
        argumentName: "price",
        argumentType: "number",
        numberOption: {
          argumentMinValue: 0,
          argumentMaxValue: 100_000,
        },
        isMiddleware: false,
      });
      const isPriceValid = isPriceValidFunction(req, res);

      const isPictureValidFunction = isArgumentValid({
        parameterType: "files",
        argumentName: "picture",
        argumentType: "picture",
        isMiddleware: false,
      });
      const isPictureValid = isPictureValidFunction(req, res);

      const isPictureListValidFunction = isArgumentValid({
        parameterType: "files",
        argumentName: "pictures",
        argumentType: "picture",
        isMiddleware: false,
      });
      const isPictureListValid = isPictureListValidFunction(req, res);

      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      const pictureList = isPictureListValid ? req.files.pictures : [];
      const picture = isPictureValid ? req.files.picture : undefined;
      const publicId =
        isPictureValid && offer.product_image
          ? offer.product_image.public_id
          : undefined;

      isPictureValid ? pictureList.unshift(picture) : null;

      const folder = "/vinted/offers/" + offer._id;

      const promiseArray = pictureList.map((picture) => {
        return uploadPicture(picture, folder);
      });

      publicId ? promiseArray.push(deletePicture(publicId, folder)) : null;

      const resultList = await Promise.all(promiseArray);

      const pictureDataObj = isPictureValid ? resultList.shift() : undefined;
      isPictureValid ? (offer.product_image = pictureDataObj) : null;

      isPictureListValid ? (offer.product_pictures = resultList) : null;

      isTitleValid ? (offer.product_name = title) : null;
      isDescriptionValid ? (offer.product_description = description) : null;
      isPriceValid ? (offer.product_price = price) : null;
      offer.product_details = [
        { BRAND: brand ? brand : offer.product_details[0].BRAND },
        { SIZE: size ? size : offer.product_details[1].SIZE },
        {
          CONDITION: condition ? condition : offer.product_details[2].CONDITION,
        },
        { COLOR: color ? color : offer.product_details[3].COLOR },
        { CITY: city ? city : offer.product_details[4].CITY },
      ];

      await offer.save();

      res.status(201).json(offer);
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ message: error.message || "Internal server error" });
    }
  }
);

router.delete("/offer/delete/:id", isAuthentificated, async (req, res) => {
  try {
    const offerId = req.params.id;

    const offer = await Offer.findById(offerId);

    if (!offer) {
      throw {
        error: 404,
        message: "No offer were find with the id : " + offerId,
      };
    }

    if (req.user._id.valueOf() !== offer.owner.valueOf()) {
      throw {
        error: 401,
        message: "You are not the owner of the offer. You can't modify it.",
      };
    }

    if (offer.product_image) {
      const publicId = offer.product_image.public_id;
      const folder = offer.product_image.folder;
      await deletePicture(publicId, folder);
    }

    await Offer.findByIdAndDelete(offerId);

    res.status(200).json({ message: "Offer deleted successfully" });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const isTitleValidFunction = isArgumentValid({
      parameterType: "query",
      argumentName: "title",
      argumentType: "string",
      isMiddleware: false,
    });
    const isTitleValid = isTitleValidFunction(req, res);

    const isPriceMinValidFunction = isArgumentValid({
      parameterType: "query",
      argumentName: "priceMin",
      argumentType: "number",
      numberOption: {
        argumentMinValue: 0,
        argumentMaxValue: Infinity,
      },
      isMiddleware: false,
    });
    const isPriceMinValid = isPriceMinValidFunction(req, res);

    const isPriceMaxValidFunction = isArgumentValid({
      parameterType: "query",
      argumentName: "priceMax",
      argumentType: "number",
      numberOption: {
        argumentMinValue: 0,
        argumentMaxValue: Infinity,
      },
      isMiddleware: false,
    });
    const isPriceMaxValid = isPriceMaxValidFunction(req, res);

    const isSortValidFunction = isArgumentValid({
      parameterType: "query",
      argumentName: "sort",
      argumentType: "string",
      stringOption: {
        argumentTransformObj: { "price-asc": 1, "price-desc": -1 },
      },
      isMiddleware: false,
    });
    const isSortValid = isSortValidFunction(req, res);

    const isPageValidFunction = isArgumentValid({
      parameterType: "query",
      argumentName: "page",
      argumentType: "number",
      numberOption: {
        argumentMinValue: 1,
        mustBeInteger: true,
      },
      isMiddleware: false,
    });
    const isPageValid = isPageValidFunction(req, res);

    const { title, sort, page } = req.query;
    let { priceMin, priceMax } = req.query;

    if (isPriceMinValid && isPriceMaxValid && priceMin > priceMax) {
      [priceMin, priceMax] = [priceMax, priceMin];
    }

    const filter = {};
    isTitleValid ? (filter.product_name = new RegExp(title, "i")) : null;
    filter.product_price = {
      $gte: isPriceMinValid ? priceMin : 0,
      $lte: isPriceMaxValid ? priceMax : Infinity,
    };

    const offerList = await Offer.find(filter)
      .sort(isSortValid ? { product_price: sort } : {})
      .limit(5)
      .skip(isPageValid ? (page - 1) * 5 : 0)
      .populate("owner", "account.username account.avatar.secure_url")
      .select(
        "product_details product_image.secure_url product_name product_description product_price"
      );

    const count = offerList.length;

    res.status(200).json({
      count: count,
      offers: offerList,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offerId = req.params.id;

    const offer = await Offer.findById(offerId)
      .populate("owner", "account.username account.avatar.secure_url")
      .select(
        "product_details product_image.secure_url product_name product_description product_price"
      );

    if (!offer) {
      throw {
        error: 404,
        message: "No offer were find with the id : " + offerId,
      };
    }

    res.status(200).json(offer);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

module.exports = router;
