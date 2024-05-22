const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const hashPassword = (password, salt) => {
  const token = salt ? null : uid2(64);
  salt = salt ? salt : uid2(64);
  const hash = SHA256(password + salt).toString(encBase64);
  return { salt: salt, hash: hash, token: token };
};

module.exports = hashPassword;
