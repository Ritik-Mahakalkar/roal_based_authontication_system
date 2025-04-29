require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json()); 
app.use(cors()); 

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD || '123456789',
  database: process.env.DB_NAME || 'role_app', 
});

db.connect(err => {
  if (err) {
    console.error("MySQL Connection Error: ", err);
    process.exit(1); 
  }
  console.log("MySQL Connected");
});


const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; 
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};


const authorize = roles => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log("Login Attempt - Username:", username, "Password:", password);  

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('Error fetching user: ', err);
      return res.status(500).json({ message: 'Server error' });
    }
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = results[0];
    console.log("Stored Password in DB:", user.password);  

    
    if (user.password !== password) {
      console.log("Passwords do not match.");
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token });
  });
});


app.get('/profile', authenticate, (req, res) => {
  db.query('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.user.id], (err, result) => {
    if (err) {
      console.error('Error fetching profile: ', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(result[0]);
  });
});

app.get('/profile/admin', authenticate, authorize(['Admin']), (req, res) => {
  res.json({ message: 'Welcome, Admin!' });
});

app.get('/profile/editor', authenticate, authorize(['Admin', 'Editor']), (req, res) => {
  res.json({ message: 'Welcome, Editor or Admin!' });
});

app.get('/profile/viewer', authenticate, authorize(['Admin', 'Editor', 'Viewer']), (req, res) => {
  res.json({ message: 'Welcome, Viewer!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
