const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Resend } = require('resend');
require('dotenv').config();

const Contact = require('./models/Contact');

const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, '../')));

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('MongoDB Connection Failed:', err));

// Initialize Resend with API Key from Environment Variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Contact Form Endpoint (Saves to MongoDB AND Sends Email using Resend)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // 1. Save to MongoDB Database
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    // 2. Send Email using Resend API
    const data = await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: process.env.EMAIL_USER, // Ungaloda Gmail address Render environment variable-il iruppathu moolamaga inga work aagum
      subject: `New Portfolio Message: ${subject || 'No Subject'}`,
      html: `
        <h3>You have a new message from your portfolio contact form:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `
    });

    console.log('Email sent successfully:', data);
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
