// controllers/authController.js
const Userauths = require("../models/Userauths");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const key = "mykey";

async function register(req, res) {
  const { userName, Password } = req.body;

  bcrypt.hash(Password, 10, async (err, hash) => {
    if (err) {
      res.json({ message: "Internal server Error" });
    }
    try {
      const user = await Userauths.create({
        userName: userName,
        Password: hash,
        role: "user",
      });
      const playloadtoken = {
        userName: user.userName,
        userId: user.id,
        role: "user",
      };
      const token = jwt.sign(playloadtoken, key, { expiresIn: "3h" });
      res.cookie("userAuth", token, { maxAge: 3 * 60 * 60 * 1000 });
      res.json({ message: "Register Successfully", authToken: token });
    } catch (err) {
      res.json({ message: "Internal server Error", err });
    }
  });
}

async function login(req, res) {
  const { userName, Password } = req.body;
  try {
    const user = await Userauths.findOne({ where: { userName: userName } });
    if (user) {
      const ispassword = await bcrypt.compare(Password, user.Password);
      if (ispassword) {
        const tokenPlayload = {
          userName: user.userName,
          userId: user.id,
          role: user.role || "role",
        };
        const token = jwt.sign(tokenPlayload, key, { expiresIn: "3h" });
        res.cookie("authToken", token, { maxAge: 3 * 60 * 60 * 1000 });
        res.json({ message: "Login Success", authToken: token });
      } else {
        res.json({ message: "Invalid Credentials" });
      }
    }
  } catch (err) {
    res.json({ message: "Internal server Error", err });
  }
}

module.exports = {
  register,
  login,
};
