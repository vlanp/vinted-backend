const {
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
} = require("../config");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
});

const uploadPicture = (picture, folder = null, needConversion = true) => {
  const convertToBase64 = () => {
    return `data:${picture.mimetype};base64,${picture.data.toString("base64")}`;
  };
  picture = needConversion ? convertToBase64() : picture;
  return cloudinary.uploader.upload(picture, { folder: folder });
};

const deletePicture = (publicId, folder) => {
  return cloudinary.uploader.destroy(publicId).then(() => {
    cloudinary.api.delete_folder(folder);
  });
};

module.exports = { uploadPicture, deletePicture };
