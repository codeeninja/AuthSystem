// models/Notes.js
const { DataTypes } = require("sequelize");
const sequelize = require("./database");
const Userauths = require("./Userauths"); // Import the Userauths model

const Notes = sequelize.define("Notes", {
  title: {
    type: DataTypes.STRING,
  },
  content: {
    type: DataTypes.STRING,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Userauths, // Use the Userauths model here
      key: "id",
    },
  },
});

module.exports = Notes;
