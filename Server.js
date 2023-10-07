const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const port = 5000;
const cors = require('cors');
const nodemailer = require('nodemailer'); // Add this line
const crypto = require('crypto');

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const key = "your_secret_key"; // Replace with your secret key

// MySQL database connection
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Replace with your MySQL password
    database: 'mydb', // Replace with your MySQL database name
});

con.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

// Middleware for verifying JWT tokens
function verifyToken(req, res, next) {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ message: 'Authentication failed' });
    }

    jwt.verify(token, key, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        req.user = decoded;
        next();
    });
}

// User registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        const sql = "INSERT INTO usersauth (username, password, role) VALUES (?, ?, 'user')";
        con.query(sql, [username, hash], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            const token = jwt.sign({ username: result.username, role: 'user' }, key, { expiresIn: '3h' });

            // Set the token as a cookie
            res.cookie('authToken', token, { maxAge: 3 * 60 * 60 * 1000 }); // 3 hours
            res.json({ message: 'User registered successfully', authToken: token });
        });
    });
});

// User login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM usersauth WHERE username = ?";

    con.query(sql, [username], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (result.length === 0) {
            console.log("Authentication failed");
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const user = result[0];
        if (!user || !bcrypt.compareSync(password, user.password)) {
            console.log("Wrong username or password");
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const token = jwt.sign({ username: user.username, role: user.role }, key, { expiresIn: '3h' });
        // Set the token as a cookie
        res.cookie('authToken', token, { maxAge: 3 * 60 * 60 * 1000 }); // 3 hours
        res.json({ message: 'Login successful', authToken: token });
    });
});


// Delete note (requires admin role)
app.delete('/delete-note/:id', verifyToken, (req, res) => {
    if (req.user.role === 'admin') {
        const noteId = req.params.id;
        const deleteSql = "DELETE FROM notes WHERE id = ?";
        con.query(deleteSql, [noteId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Note not found' });
            }

            res.json({ message: 'Note deleted successfully' });
        });
    } else {
        res.status(403).json({ message: 'Unauthorized' });
    }
});
const emailConfig = {
    service: 'Gmail',
    auth: {
      user: 'shivamkale1123@gmail.com',
      pass: 'Shivam@1234#',
    },
  };
  
app.post('/forgot-password', (req, res) => {
    const { username } = req.body;
  
    // Generate a unique token for password reset
    const resetToken = crypto.randomBytes(20).toString('hex');
  
    // Update the user's resetToken in the database
    const updateSql = 'UPDATE usersauth SET resetToken = ? WHERE username = ?';
    con.query(updateSql, [resetToken, username], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
  
        if (result.affectedRows === 0) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }
  
        // Send the password reset email with the reset token
        const transporter = nodemailer.createTransport(emailConfig);
        const mailOptions = {
            from: 'shivamkale1123@gmail.com',
            to: 'shivamkale786@gmail.com0', // Use the user's email here
            subject: 'Password Reset',
            text: `You are receiving this email because you (or someone else) requested a password reset for your account.\n\n
                Please click on the following link to reset your password:\n\n
                http://localhost:5000/reset-password/${resetToken}\n\n
                If you did not request this, please ignore this email, and your password will remain unchanged.`,
        };
  
        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal server error' });
            }
  
            res.json({ message: 'Password reset email sent. Please check your email.' });
        });
    });
});

  // Reset password route
  app.post('/reset-password', (req, res) => {
    const { username, token, newPassword } = req.body;
  
    // Check if the reset token matches the user's reset token
    const checkTokenSql = 'SELECT * FROM usersauth WHERE username = ? AND resetToken = ?';
    con.query(checkTokenSql, [username, token], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
      }
  
      if (result.length === 0) {
        console.log('Invalid or expired token');
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
  
      // Hash the new password and update it in the database
      bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Internal server error' });
        }
  
        const updatePasswordSql = 'UPDATE usersauth SET password = ?, resetToken = NULL WHERE username = ?';
        con.query(updatePasswordSql, [hash, username], (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal server error' });
          }
  
          res.json({ message: 'Password reset successful' });
        });
      });
    });
  });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
