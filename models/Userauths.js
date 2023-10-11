const {DataTypes} = require("sequelize");
const sequelize = require("./database");

const Userauths = sequelize.define("Userauths", {
    userName: {
      type: DataTypes.STRING,
    },
    Password: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.STRING,
    },
    resetToken: {
      type: DataTypes.STRING, // Make sure resetToken is defined here
    },
  });

  module.exports=Userauths;