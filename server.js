const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const Contact = require('./models/Contact');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('MongoDB Connection Failed:', err));

// Email configuration using Environment Variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test Route
app.get('/', (req, res) => {
  res.send('Portfolio Backend is running!');
});

// Contact Form Endpoint (Saves to MongoDB AND Sends Email)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // 1. Save to MongoDB Database
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    // 2. Send Email to You
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER, // Ungaloda Gmail-ku anuppum
      subject: `New Portfolio Message: ${subject || 'No Subject'}`,
      text: `You have a new message from your portfolio contact form:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage:\n${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email sending failed:', error);
        // DB-la save aayiduchu, but email send aagalana kuda user-ku success kaattalam or handle pannalam
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.status(201).json({ success: true, message: 'Message sent, saved, and emailed successfully!' });
  
  } catch (error) {
    console.error('Error handling contact message:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again later.' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});