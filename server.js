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

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Contact Form Endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 1. Save to MongoDB Database
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();
    console.log('Saved to MongoDB successfully!');

    // 2. Send Email using Resend API
    const response = await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: process.env.EMAIL_USER,
      reply_to: email, // Direct-ah client email-ku reply panna
      subject: `New Portfolio Message: ${subject || 'No Subject'}`,
      html: `
        <h3>You have a new message from your portfolio contact form:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `
    });

    // Resend SDK error handling
    if (response.error) {
      console.error('Resend API Error:', response.error);
      return res.status(400).json({ success: false, error: response.error });
    }

    console.log('Email sent successfully:', response.data);
    return res.status(201).json({ success: true, message: 'Message sent and emailed successfully!' });

  } catch (error) {
    console.error('Error handling contact message:', error);
    return res.status(500).json({ success: false, message: 'Server error, please try again later.' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
