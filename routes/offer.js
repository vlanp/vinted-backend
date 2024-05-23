const express = require("express");
const router = express.Router();
const { isAuthentificated } = require("../middlewares/authentification");
const Offer = require("../models/Offer");
const fileUpload = require("express-fileupload");
const { uploadPicture, deletePicture } = require("../utils/cloudinary");
const {
  titleValidation,
  descriptionValidation,
  priceValidation,
  sortValidation,
  pageValidation,
} = require("../middlewares/offer");
const { pictureValidation } = require("../middlewares/picture");

router.post(
  "/offer/publish",
  isAuthentificated,
  fileUpload(),
  titleValidation,
  descriptionValidation,
  priceValidation,
  pictureValidation,
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            BRAND: brand,
          },
          {
            SIZE: size,
          },
          {
            CONDITION: condition,
          },
          {
            COLOR: color,
          },
          {
            CITY: city,
          },
        ],
        owner: req.user,
      });

      const { picture } = req.files;

      if (picture) {
        const folder = "/vinted/offers/" + newOffer._id;
        const pictureDataObj = await uploadPicture(picture, folder);
        newOffer.product_image = pictureDataObj;
      }

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

      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      if (titleValidation(req)) {
        offer.product_name = title;
      }
      if (descriptionValidation(req)) {
        offer.product_description = description;
      }
      if (priceValidation(req)) {
        offer.product_price = price;
      }
      pictureValidation(req);
      const { picture } = req.files;
      if (picture) {
        if (offer.product_image) {
          const publicId = offer.product_image.public_id;
          const folder = offer.product_image.folder;
          await deletePicture(publicId, folder);
        }
        const folder = "/vinted/offers/" + offer._id;
        const pictureDataObj = await uploadPicture(picture, folder);
        offer.product_image = pictureDataObj;
      }
      offer.product_details = [
        {
          BRAND: brand ? brand : offer.product_details[0].BRAND,
        },
        {
          SIZE: size ? size : offer.product_details[1].SIZE,
        },
        {
          CONDITION: condition ? condition : offer.product_details[2].CONDITION,
        },
        {
          COLOR: color ? color : offer.product_details[3].COLOR,
        },
        {
          CITY: city ? city : offer.product_details[4].CITY,
        },
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
    const isTitleValid = titleValidation(req, undefined, undefined, "query");
    const isPriceMinValid = priceValidation(
      req,
      undefined,
      undefined,
      "query",
      "priceMin"
    );
    const isPriceMaxValid = priceValidation(
      req,
      undefined,
      undefined,
      "query",
      "priceMax"
    );

    const isSortValid = sortValidation(req);

    const isPageValid = pageValidation(req);

    const { title, sort, page } = req.query;
    let { priceMin, priceMax } = req.query;

    if (isPriceMinValid && isPriceMaxValid && priceMin > priceMax) {
      [priceMin, priceMax] = [priceMax, priceMin];
    }

    const offerList = await Offer.find({
      product_name: new RegExp(title ? title : undefined, "i"),
      product_price: {
        $gte: priceMin ? priceMin : 0,
        $lte: priceMax ? priceMax : Infinity,
      },
    })
      .sort({ product_price: sort ? sort : null })
      .limit(5)
      .skip(page ? (page - 1) * 5 : 0)
      .populate("owner", "account.username account.avatar.secure_url")
      .select(
        "product_details product_image.secure_url product_name product_description product_price"
      );

    const count = offerList.length;

    res.status(201).json({
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
