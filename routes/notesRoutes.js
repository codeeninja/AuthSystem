// routes/notesRoutes.js
const express = require("express");
const notesController = require("../controllers/notesController");
const { verifyToken } = require("../authMiddleware"); // Import the verifyToken function correctly

const router = express.Router();

router.delete("/delete/:id", verifyToken, notesController.deleteNote);

module.exports = router;
