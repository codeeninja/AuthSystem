const express = require("express");
const bodyParser = require("body-parser");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
const port = 5000;

app.use(cors());
app.use(cookieParser());
app.use(express.json());

const key = "mykey";

// MySQL database connection
const sequelize = new Sequelize("mydb", "root", "", {
  dialect: "mysql",
  host: "localhost",
});

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
      model: Userauths,
      key: "id",
    },
  },
});

Userauths.hasMany(Notes, { foreignKey: "userId" });
Notes.belongsTo(Userauths, { foreignKey: "userId" });
Userauths.sync();
sequelize
  .sync()
  .then(() => {
    console.log("Database and tables created");
  })
  .catch((err) => {
    console.error("Error creating tables", err);
  });

const emailConfig = {
  host: "smtp.ethereal.email", // Replace with your SMTP server host
  port: 587, // Replace with your SMTP server port
  auth: {
    user: "erick.rutherford65@ethereal.email", // Replace with your email address
    pass: "rNXDmZe9NK4Px6hz3q", // Replace with your email password
  },
};

const transporter = nodemailer.createTransport(emailConfig);

// Middleware for verifying JWT tokens
  function verifyToken(req, res, next) {
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    jwt.verify(token, key, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Authentication failed" });
      }
      req.user = decoded;
      next();
    });
  }

// User registration
app.post("/register", async (req, res) => {
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
});

// User login
app.post("/login", async (req, res) => {
  const { userName, Password } = req.body;
  try{
    const user=await Userauths.findOne({where:{userName:userName}});
    if(user){
      const ispassword=await bcrypt.compare(Password,user.Password);
      if(ispassword){
        const tokenPlayload={
          userName: user.userName,
          userId:user.id,
          role: user.role||'role',
        }
        const token=jwt.sign(tokenPlayload,key,{expiresIn:'3h'})
        res.cookie('authToken',token, { maxAge: 3 * 60 * 60 * 1000 });
        res.json({message:"Login Success",authToken:token});
      }
      else{
        res.json({message:"invalid Credintial"});
      }
    }
  }catch(err){
    res.json({message:"Internal server Error",err});
  }
});

// Delete note (requires admin role)
app.delete("/delete/:id", verifyToken, async (req, res) => {
if(req.user.role==='admin'){
  const noteId=req.params.id;
  try{
    const deletednoteId=await Notes.destroy({where:{id:noteId}});
    if(deletednoteId>0){
      res.json({ message: `Note with ID ${noteId} has been deleted` });
    }else{
      res.json({ message: `Note with ID ${noteId} Not Found` });
    }
  }catch(err){
    res.json({message:"Internal server error",err});
  }
}
});

app.post("/forgot-password", async (req, res) => {
  const { userName } = req.body; // Change 'username' to 'username' here
  console.log("Received username:", userName);
  try {
    // Generate a unique token for password reset
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Update the user's resetToken in the database
    const user = await Userauths.findOne({ where: { userName: userName } }); // Change 'username' to 'username' here
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.resetToken = resetToken;
    await user.save();

    // Send the password reset email with the reset token
    const transporter = nodemailer.createTransport(emailConfig);
    const mailOptions = {
      from: "erick.rutherford65@ethereal.email", // Replace with your email
      to: "erick.rutherford65@ethereal.email",
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
});

app.post("/reset-password/:token", async (req, res) => {
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
});

// ... other routes ...

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
