const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: String,
  account: {
    username: String,
    avatar: Object, // nous verrons plus tard comment uploader une image
  },
  newsletter: Boolean,
  token: String,
  hash: String,
  salt: String,
  active: {
    type: Boolean,
    default: false, // Permet de gérer la vérification de l'email
  },
  randomString: String,
});

module.exports = User;
