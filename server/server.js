require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3001;

const cookieParser = require('cookie-parser');

const clientId = process.env.REACT_APP_QUICKBOOKS_CLIENT_ID;
const clientSecret = process.env.REACT_APP_QUICKBOOKS_CLIENT_SECRET;
const redirectUri = 'http://localhost:3001/callback'; 
const qbSandboxBase = 'https://sandbox-quickbooks.api.intuit.com';

// Load environment variables
require('dotenv').config();

app.use(cookieParser());

app.get('/authorize', (req, res) => {
  const scopes = 'com.intuit.quickbooks.accounting';
  res.redirect(`https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=1234`);
});

app.get('/callback', async (req, res) => {
  const authCode = req.query.code;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: redirectUri
    }, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token } = response.data;

    res.cookie('access_token', access_token, { httpOnly: true });
    res.cookie('refresh_token', refresh_token, { httpOnly: true });

    res.send('Token exchange complete. Check your cookies for the tokens.');
  } catch (error) {
    console.error('Error during token exchange', error);
    res.status(500).send('Error during token exchange');
  }
});

app.get('/api/quickbooks_tb', async (req, res) => {
  const accessToken = req.cookies.access_token;
  
  if (!accessToken) {
    return res.status(400).json({ message: "Access Token Missing" });
  }

  try {
    const response = await axios.get(`${qbSandboxBase}/v3/company/4620816365318211620/reports/TrialBalance?minorversion=65`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error making API call');
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
