const express = require('express');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
const port = 3000;

const client_id = 'b54c6d36472c4852a64f4e313fb565e5'; // Your Spotify Client ID
const client_secret = 'e5dcc040539941fa89b7043b1f576942'; // Your Spotify Client Secret
const redirect_uri = 'http://127.0.0.1:3000/callback'; // Your Redirect URI

const stateKey = 'spotify_auth_state';

// Generate a random string for the state parameter
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('hex');
}

app.use(cookieParser());

// Login route
app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = 'playlist-read-private playlist-read-collaborative';

  // Use URLSearchParams to construct the query string
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// Callback route
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#error=state_mismatch');
  } else {
    res.clearCookie(stateKey);

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri,
    });

    const authOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
      },
      body: params.toString(),
    };

    try {
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', authOptions);
      const tokenData = await tokenResponse.json();

      const access_token = tokenData.access_token;
      const refresh_token = tokenData.refresh_token;

      // Redirect to the frontend with the tokens
      const redirectParams = new URLSearchParams({
        access_token: access_token,
        refresh_token: refresh_token,
      });

      res.redirect(`http://127.0.0.1:5500/#${redirectParams.toString()}`);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      res.redirect('/#error=invalid_token');
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});