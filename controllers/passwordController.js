// controllers/passwordController.js
const { Userauths } = require("../models"); // Import your Userauths model
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const key = "mykey"; // Your secret key for JWT

const emailConfig = {
    host: "smtp.ethereal.email", // Replace with your SMTP server host
    port: 587, // Replace with your SMTP server port
    auth: {
      user: "erick.rutherford65@ethereal.email", // Replace with your email address
      pass: "rNXDmZe9NK4Px6hz3q", // Replace with your email password
    },
  };

const transporter = nodemailer.createTransport(emailConfig);

async function forgotPassword(req, res) {
  const { userName } = req.body;

  try {
    // Generate a unique token for password reset
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Update the user's resetToken in the database
    const user = await Userauths.findOne({ where: { userName: userName } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.resetToken = resetToken;
    await user.save();

    // Send the password reset email with the reset token
    const mailOptions = {
      from: "your-email@example.com", // Replace with your email
      to: user.email, // Use the user's email
      subject: "Password Reset",
      text: `You are receiving this email because you (or someone else) requested a password reset for your account.\n\n
            Please click on the following link to reset your password:\n\n
            http://localhost:5000/reset-password/${resetToken}\n\n
            If you did not request this, please ignore this email, and your password will remain unchanged.`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.json({
        message: "Password reset email sent. Please check your email.",
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function resetPassword(req, res) {
  const { token } = req.params;
  const { Password } = req.body;

  try {
    const user = await Userauths.findOne({ where: { resetToken: token } });

    if (!user) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    // Hash the new password and update it in the database
    const hash = await bcrypt.hash(Password, 10);
    user.Password = hash;
    user.resetToken = null; // Clear the resetToken

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  forgotPassword,
  resetPassword,
};
