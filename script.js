
const clientId = "YOUR_SPOTIFY_CLIENT_ID"; // replace with your app's Client ID
const redirectUri = "http://localhost:5500"; // change to your GitHub Pages URL later
const scopes = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-email"
];

// authenticiaotkns
function getLoginUrl() {
  return (
    "https://accounts.spotify.com/authorize" +
    "?response_type=token" +
    "&client_id=" + encodeURIComponent(clientId) +
    "&scope=" + encodeURIComponent(scopes.join(" ")) +
    "&redirect_uri=" + encodeURIComponent(redirectUri)
  );
}

// Parse the hash in the URL after redirect
function getTokenFromUrl() {
  const hash = window.location.hash
    .substring(1)
    .split("&")
    .reduce((initial, item) => {
      if (item) {
        const parts = item.split("=");
        initial[parts[0]] = decodeURIComponent(parts[1]);
      }
      return initial;
    }, {});
  window.location.hash = "";
  return hash.access_token;
}

let accessToken = getTokenFromUrl();

document.getElementById("login-btn").addEventListener("click", () => {
  window.location = getLoginUrl();
});

// fetch stuff
async function fetchPlaylists() {
  if (!accessToken) return;

  const response = await fetch("https://api.spotify.com/v1/me/playlists", {
    headers: { Authorization: "Bearer " + accessToken }
  });
  const data = await response.json();

  const container = document.getElementById("playlists");
  container.innerHTML = "<h2>Your Playlists:</h2>";

  data.items.forEach((playlist) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p><strong>${playlist.name}</strong> (${playlist.tracks.total} tracks)</p>
    `;
    container.appendChild(div);
  });
}

// Fetch playlists if we already have a token
if (accessToken) {
  fetchPlaylists();
}
