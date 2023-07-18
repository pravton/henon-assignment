const express = require("express");
const router = express.Router();
const axios = require("axios");
const qs = require('qs');

// QuickBook API
const qbclientId = process.env.REACT_APP_QUICKBOOKS_CLIENT_ID;
const qbclientSecret = process.env.REACT_APP_QUICKBOOKS_CLIENT_SECRET;
const qbRedirectUri = "http://localhost:3001/qbcallback";
const qbSandboxBase = "https://sandbox-quickbooks.api.intuit.com";

// Zoho API
const zohoClientId = process.env.REACT_APP_ZOHO_CLIENT_ID;
const zohoClientSecret = process.env.REACT_APP_ZOHO_CLIENT_SECRET;
const zohoRedirectUri = "http://localhost:3001/auth/zoho/callback";

// Asynchronous error handling middleware for routes that returns promises
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get("/qbcallback", async (req, res) => {
  const authCode = req.query.code;
  const auth = Buffer.from(`${qbclientId}:${qbclientSecret}`).toString(
    "base64"
  );

  try {
    const response = await axios.post(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      {
        grant_type: "authorization_code",
        code: authCode,
        redirect_uri: qbRedirectUri,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token } = response.data;

    res.cookie("access_token", access_token, { httpOnly: true });
    res.cookie("refresh_token", refresh_token, { httpOnly: true });
    res.redirect("https://localhost:3000");
  } catch (error) {
    console.error("Error during token exchange", error);
    res.status(500).send("Error during token exchange");
  }
});

// Define the scopes and auth details outside of our handler
const scopes = "com.intuit.quickbooks.accounting";
const auth = Buffer.from(`${qbclientId}:${qbclientSecret}`).toString("base64");

// Fetch Data function
const fetchData = async (accessToken) => {
  try {
    const response = await axios.get(
      `${qbSandboxBase}/v3/company/4620816365318211620/reports/TrialBalance?minorversion=65`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    if (error.response && error.response.status === 401) {
      // Invalid Token Error
      return false;
    }
  }
};

router.get("/api/quickbooks_tb", async (req, res) => {
  let accessToken = req.cookies.access_token;

  if (!accessToken) {
    return res.redirect(
      `https://appcenter.intuit.com/connect/oauth2?client_id=${qbclientId}&redirect_uri=${qbRedirectUri}&scope=${scopes}&response_type=code&state=1234`
    );
  }

  let data = await fetchData(accessToken);

  // If fetching data with current token failed, try re-authenticating:
  if (!data.length) {
    const response = await axios.post(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      {
        grant_type: "refresh_token",
        refresh_token: req.cookies.refresh_token,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // check if we got successful response:
    if (response.data && response.data.access_token) {
      accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;

      // Update the access tokens in cookie
      res.cookie("access_token", accessToken, { httpOnly: true });
      res.cookie("refresh_token", refreshToken, { httpOnly: true });

      // Retry data fetch with new token:
      const data = await fetchData(accessToken);

      res.json(data);
    } else {
      res.status(500).send("Error during token refresh");
    }
  }
});

// Zoho OAuth2 Flow
const ZOHO_AUTH_URL = "https://accounts.zoho.com/oauth/v2/auth";
const ZOHO_TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token";
const ZOHO_API_URL = "https://www.zohoapis.com/crm/v2/Accounts";

router.get("/auth/zoho", (req, res) => {
  const scopes = "ZohoCRM.modules.ALL";
  const url = `${ZOHO_AUTH_URL}?scope=${scopes}&client_id=${zohoClientId}&response_type=code&access_type=offline&redirect_uri=${zohoRedirectUri}`;
  res.redirect(url);
});

// Handles the redirect from Zoho
router.get("/auth/zoho/callback", async (req, res) => {
  let authCode = req.query.code;
  try {
    const response = await authorizeZoho(authCode);
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    } = response.data;

    saveTokens(res, accessToken, refreshToken, expiresIn);

    res.redirect("http://localhost:3000");
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
})

async function authorizeZoho(authCode) {
  const auth = Buffer.from(`${zohoClientId}:${zohoClientSecret}`).toString("base64");
  const response = await axios.post(
    ZOHO_TOKEN_URL,
    {
      grant_type: "authorization_code",
      code: authCode,
      client_id: zohoClientId,
      client_secret: zohoClientSecret,
      redirect_uri: zohoRedirectUri,
    },
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response;
}

// Utility function to handle token refresh
async function refreshAccessToken(
  zohoClientId,
  zohoClientSecret,
  refreshToken
) {
  return axios.post(
    ZOHO_TOKEN_URL,
    {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: zohoClientId,
      client_secret: zohoClientSecret,
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${zohoClientId}:${zohoClientSecret}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
}

// Utility function to handle saving tokens
function saveTokens(res, accessToken, refreshToken, expiresInSeconds) {
  const expiryTime = Date.now() + expiresInSeconds * 1000;
  res.cookie("zoho_access_token", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });
  res.cookie("zoho_refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });
  res.cookie("zoho_expiry_time", expiryTime, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });
}

router.get(
  "/api/zoho",
  asyncHandler(async (req, res) => {
    let accessToken = req.cookies.zoho_access_token;
    let refreshToken = req.cookies.zoho_refresh_token;

    if(!accessToken || accessToken === 'undefined') {
      return res.redirect(
        `http://localhost:3001/auth/zoho`
      );
    }

    try {
      const apiResponse = await axios.get(ZOHO_API_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      res.json(apiResponse.data);
    } catch (err) {
      if (err.response && err.response.data.code === "INVALID_TOKEN") {
        const response = await (refreshToken
          ? refreshAccessToken(zohoClientId, zohoClientSecret, refreshToken)
          : authorizeZoho());

        const {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_in: expiresIn,
        } = response.data;

        // Update local copy of access token
        accessToken = newAccessToken;
        refreshToken = newRefreshToken;

        saveTokens(res, accessToken, refreshToken, expiresIn);

        // Retry the API request with new access token
        const retryResponse = await axios.get(ZOHO_API_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        res.json(retryResponse.data);
      } else {
        console.error(err);
        res.status(500).json({ error: "There was an error." });
      }
    }
  })
);

const xero_clientId = process.env.REACT_APP_XERO_CLIENT_ID;
const xero_clientSecret = process.env.REACT_APP_XERO_CLIENT_SECRET;
const redirectUri = 'http://localhost:3001/xero_callback';
const scope = ' accounting.transactions accounting.settings.read accounting.settings';

// Route to start the OAuth2 flow and redirect the user to Xero's authorization page
router.get('/xero_authorize', (req, res) => {
  const url = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${xero_clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=123`;
  res.redirect(url);
});

// Route to handle the redirect from Xero's authorization page
router.get('/xero_callback', async (req, res) => {
  const { code } = req.query;

  try {
      const tokenResponse = await axios({
          method: 'post',
          url: 'https://identity.xero.com/connect/token',
          headers: {
              'Authorization': 'Basic ' + Buffer.from(xero_clientId + ':' + xero_clientSecret).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: qs.stringify({
              grant_type: 'authorization_code',
              code,
              redirect_uri: redirectUri
          })
      });

      const { access_token, refresh_token } = tokenResponse.data;

      // Store the access and refresh tokens securely
      res.cookie("xero_access_token", access_token, { httpOnly: true });
      res.cookie("xero_refresh_token", refresh_token, { httpOnly: true });

      res.send('Successfully authenticated with Xero.');
  } catch (error) {
      console.error('Error during token exchange:', error);
      res.status(500).send('An error occurred during token exchange.');
  }
});

// Route to fetch tenant connections from Xero
router.get('/xero_connections', async (req, res) => {
  // Retrieve the stored access token
  let access_token = req.cookies.xero_access_token;

  try {
      const connectionsResponse = await axios({
          method: 'get',
          url: 'https://api.xero.com/connections',
          headers: {
              'Authorization': 'Bearer ' + access_token,
          },
      });

      res.json(connectionsResponse.data);
  } catch (error) {
      console.error('Error during Xero API call:', error);
      res.status(500).send('An error occurred during the Xero API call.');
  }
});

// Route to fetch accounts from Xero
router.get('/api/xero_accounts', async (req, res) => {
  // Retrieve the stored access token
  let access_token = req.cookies.xero_access_token;

  try {
    const accountsResponse = await axios({
        method: 'get',
        url: 'https://api.xero.com/api.xro/2.0/Accounts',
        headers: {
            'Authorization': 'Bearer ' + access_token,
            'xero-tenant-id': '192cd591-3c40-41f5-bc1b-18936c204498',
            'Accept': 'application/json'
        }
    });

      res.json(accountsResponse.data);
  } catch (error) {
      console.error('Error during Xero API call:', error);
      res.status(500).send('An error occurred during the Xero API call.');
  }
});

module.exports = router;
