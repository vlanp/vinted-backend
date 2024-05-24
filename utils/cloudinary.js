const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
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
