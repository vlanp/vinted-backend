const nodemailer = require("nodemailer");
const { emailHost, emailAddress, emailPassword } = require("../config");

const transporter = nodemailer.createTransport({
  host: emailHost,
  secure: true,
  port: 465,
  auth: {
    user: emailAddress,
    pass: emailPassword,
  },
});

const sendEmail = async (recipient, subject, text) => {
  const mailOptions = {
    from: emailAddress,
    to: recipient,
    subject: subject,
    text: text,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
