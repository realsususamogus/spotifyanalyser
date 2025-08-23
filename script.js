console.log("Script file loaded successfully!");

const clientId = "b54c6d36472c4852a64f4e313fb565e5"; 
const redirectUri = "http://127.0.0.1:5500/"; 
const scopes = [
  "playlist-read-private",
  "playlist-read-collaborative"
];

// authentication 
function getLoginUrl() {
  return (
    "https://accounts.spotify.com/authorize" +
    "?response_type=token" +
    "&client_id=" + encodeURIComponent(clientId) +
    "&scope=" + encodeURIComponent(scopes.join(" ")) +
    "&redirect_uri=" + encodeURIComponent(redirectUri)
  );
}

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

// fetching playlists
async function fetchPlaylists(accessToken) {
  const response = await fetch("https://api.spotify.com/v1/me/playlists", {
    headers: { Authorization: "Bearer " + accessToken }
  });

   // Add error handling
   if (!response.ok) {
    console.error("Failed to fetch playlists:", response.status, response.statusText);
    return;
  }

  const data = await response.json();

  const container = document.getElementById("playlists");
  container.innerHTML = "<h2>Your Playlists:</h2>";

  data.items.forEach((playlist) => {
    const button = document.createElement("button");
    button.innerText = `${playlist.name} (${playlist.tracks.total} tracks)`;
    button.addEventListener("click", () => fetchTracks(playlist.id, accessToken));
    container.appendChild(button);
  });
}

// fetching features
async function fetchTracks(playlistId, accessToken) {
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
  let allTrackIds = [];

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: "Bearer " + accessToken }
    });

    if (!response.ok) {
      console.error("Failed to fetch tracks:", response.status);
      return;
    }
    const data = await response.json();

    data.items.forEach((item) => {
      if (item.track) allTrackIds.push(item.track.id);
    });

    url = data.next; // pagination
  }

  // Get audio features (max 100 per request)
  let features = [];
  for (let i = 0; i < allTrackIds.length; i += 100) {
    const ids = allTrackIds.slice(i, i + 100).join(",");
    const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
      headers: { Authorization: "Bearer " + accessToken }
    });
    const data = await response.json();
    features = features.concat(data.audio_features.filter(f => f)); // remove nulls
  }

  analyze(features);
}

// analysis part 
function analyze(features) {
  if (features.length === 0) return;

  const avgDance = features.reduce((a, b) => a + b.danceability, 0) / features.length;
  const avgEnergy = features.reduce((a, b) => a + b.energy, 0) / features.length;
  const avgValence = features.reduce((a, b) => a + b.valence, 0) / features.length;
  const avgTempo = features.reduce((a, b) => a + b.tempo, 0) / features.length;

  const ctx = document.getElementById("chart").getContext("2d");
  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Danceability", "Energy", "Happiness (Valence)", "Tempo"],
      datasets: [{
        label: "Playlist Analysis",
        data: [avgDance, avgEnergy, avgValence, avgTempo / 200], // tempo scaled for chart
        fill: true,
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgb(54, 162, 235)",
        pointBackgroundColor: "rgb(54, 162, 235)"
      }]
    },
    options: {
      scale: {
        ticks: { beginAtZero: true, max: 1 }
      }
    }
  });
}

// Wait for DOM to load before running initialization
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM loaded, initializing app...");
  
  let accessToken = getTokenFromUrl();
  console.log("Current URL:", window.location.href);
  console.log("URL hash:", window.location.hash);
  console.log("Extracted access token:", accessToken);
  console.log("Access token type:", typeof accessToken);

  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const loginUrl = getLoginUrl();
      console.log("Generated login URL:", loginUrl);
      console.log("Redirect URI being used:", redirectUri);
      console.log("Client ID being used:", clientId);
      window.location = loginUrl;
    });
  }

  if (accessToken) {
    console.log("Access token found, fetching playlists...");
    fetchPlaylists(accessToken);
  } else {
    console.log("No access token found");
  }
});