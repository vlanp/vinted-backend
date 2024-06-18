const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_API_SECRET);
const { isArgumentValid } = require("../middlewares/argumentValidation");
const Offer = require("./../models/Offer");
const { isAuthentificated } = require("../middlewares/authentification");

const router = express.Router();

router.post(
  "/payment",
  isAuthentificated,
  isArgumentValid({
    parameterType: "body",
    argumentName: "id",
    argumentType: "string",
    stringOption: {
      argumentMinLength: 1,
    },
  }),
  async (req, res) => {
    try {
      const offerId = req.body.id;

      const offer = await Offer.findById(offerId);

      if (!offer) {
        throw {
          error: 404,
          message: "No offer were find with the id : " + offerId,
        };
      }

      const deliveryFees = offer.product_price / 5;
      const protectionFees = offer.product_price / 10;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Number(
          ((offer.product_price + deliveryFees + protectionFees) * 100).toFixed(
            0
          )
        ),
        currency: "eur",
        description: offer.product_name,
      });

      await Offer.findByIdAndDelete(offerId);

      res.status(200).json(paymentIntent);
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ message: error.message || "Internal server error" });
    }
  }
);

module.exports = router;
