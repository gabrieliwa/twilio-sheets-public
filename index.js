// index.js

require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const port = process.env.PORT;


// Middleware Setup
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Google Sheets API Authentication
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Use credentials from environment variable or JSON key file
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS),
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

// Twilio Credentials from environment variables
const twilio = require('twilio');
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Initialize Twilio client
const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

// Define the Webhook Endpoint
app.post('/twilio-webhook', async (req, res) => {
  console.log('Received a request on /twilio-webhook');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  // Twilio passes data in req.body
  const fromNumber = req.body.From;
  const messageBody = req.body.Body;
  const timestamp = new Date().toISOString();

  // Append data to Google Sheet
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID; // Use Spreadsheet ID from environment variable
    const range = 'Sheet1!A:Z'; // Adjust based on your sheet structure

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[fromNumber, messageBody, timestamp]],
      },
    });

    console.log('Data appended to Google Sheet successfully.');

    res.status(200).send('<Response></Response>'); // Twilio expects a 200 response
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server Error');
  }
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});