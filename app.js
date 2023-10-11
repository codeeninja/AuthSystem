// app.js
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());
app.use(cookieParser());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const notesRoutes = require("./routes/notesRoutes");
const { verifyToken } = require("./authMiddleware"); 

app.use("/auth", authRoutes);
app.use("/notes", verifyToken, notesRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
