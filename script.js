const SHEET_ID = '1v_l6HE6zcx22ADXNJHbcn3FwJ95I3TcaH9lhN2qkNVY';
const GOOGLE_API_KEY = 'AIzaSyDMaLLPOkf6U-bZn2tni5oYT3JOE6gLt4g';
const SPOTIFY_CLIENT_ID = 'c6ac848d1a84407fac1ef488542331eb';
const SPOTIFY_CLIENT_SECRET = 'd5206b845b2840ceb64de514f6e0549e';
const notFoundSongs = [];

async function fetchSongs() {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Songs!B:C?key=${GOOGLE_API_KEY}`);
    const data = await response.json();
    return data.values.slice(1); // Ignore the first row
}

async function fetchSpotifyToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

async function searchSpotify(songTitle, artist) {
    const token = await fetchSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(songTitle)}%20artist:${encodeURIComponent(artist)}&type=track`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data.tracks.items[0]; // Returning the first found track
}

async function displaySongs() {
    const songs = await fetchSongs();
    const songList = document.getElementById('songList');
    songList.innerHTML = ''; // Clear the list before adding new items
    for (let i = 0; i < songs.length; i++) { // Start from 0 to include all rows
        const [title, artist] = songs[i];
        const spotifyTrack = await searchSpotify(title, artist);

        const songItem = document.createElement('div');
        songItem.classList.add('song-item');
        if (spotifyTrack) {
            const { name, artists, album } = spotifyTrack;
            songItem.innerHTML = `
                <img class="cover" src="${album.images[0].url}" alt="${name}">
                <div class="song-info">
                    <strong>${name}</strong>
                    <span>${artists.map(a => a.name).join(', ')}</span>
                </div>
                <a class="link" href="https://open.spotify.com/track/${spotifyTrack.id}" target="_blank">🔗</a>
            `;
        } else {
            notFoundSongs.push({ title, artist });
        }
        songList.appendChild(songItem);
    }
    displayNotFoundSongs();
}

function displayNotFoundSongs() {
    const notFoundList = document.getElementById('notFoundList');
    notFoundList.innerHTML = ''; // Clear the list before adding new items
    notFoundSongs.forEach(song => {
        const notFoundItem = document.createElement('div');
        notFoundItem.classList.add('not-found-item');
        notFoundItem.innerHTML = `
            <div class="song-item">
                <img class="cover" src="https://via.placeholder.com/50" alt="${song.title}"> <!-- Placeholder Bild für nicht gefundene Songs -->
                <div class="song-info">
                    <strong>${song.title}</strong> - ${song.artist}<br>
                    <a href="#">Manueller Link</a>
                </div>
            </div>
        `;
        notFoundList.appendChild(notFoundItem);
    });
}

document.getElementById('notFoundButton').addEventListener('click', () => {
    const notFoundPopover = document.getElementById('notFoundPopover');
    notFoundPopover.style.display = 'block'; // Show the popover
});

document.getElementById('closePopover').addEventListener('click', () => {
    const notFoundPopover = document.getElementById('notFoundPopover');
    notFoundPopover.style.display = 'none'; // Hide the popover
});

window.onload = displaySongs;
