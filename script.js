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

    notFoundSongs.length = 0; // Leere das Array für nicht gefundene Songs

    for (let i = 0; i < songs.length; i++) { // Start from 0 to include all rows
        const [title, artist, manualLink] = songs[i]; // Manual link from column D
        const spotifyTrack = await searchSpotify(title, artist);

        if (spotifyTrack) {
            const { name, artists, album, external_urls } = spotifyTrack;
            const songItem = document.createElement('div');
            songItem.classList.add('song-item');
            songItem.innerHTML = `
                <a href="${external_urls.spotify}" target="_blank" class="cover-container">
                    <img class="cover" src="${album.images[0].url}" alt="${name}">
                </a>
                <div class="song-info">
                    <strong>${name}</strong>
                    <span>${artists.map(a => a.name).join(', ')}</span>
                </div>
            `;
            songList.appendChild(songItem);
        } else {
            // Wenn der Song nicht gefunden wurde, speichere ihn im Array
            notFoundSongs.push({ title, artist, manualLink });
        }
    }

    displayNotFoundSongs(); // Zeige die nicht gefundenen Songs separat an
}

function displayNotFoundSongs() {
    const notFoundList = document.getElementById('notFoundList');
    notFoundList.innerHTML = ''; // Clear the list before adding new items

    notFoundSongs.forEach(song => {
        const notFoundItem = document.createElement('div');
        notFoundItem.classList.add('not-found-item');
        notFoundItem.innerHTML = `
                <a href="${song.manualLink}" target="_blank">
                    <img class="cover" src="placeholder.png">
                </a>
                <div class="song-info">
                    <strong>${song.title}</strong>
                    <span>${song.artist}</span>
                </div>
        `;
        notFoundList.appendChild(notFoundItem);
    });
}

document.getElementById('foundTab').addEventListener('click', () => {
    document.getElementById('songList').classList.remove('hidden');
    document.getElementById('notFoundList').classList.add('hidden');
    document.getElementById('foundTab').classList.add('active');
    document.getElementById('notFoundTab').classList.remove('active');
    document.querySelector('.tab-slider').style.left = '0'; // Slider anpassen
});

document.getElementById('notFoundTab').addEventListener('click', () => {
    document.getElementById('notFoundList').classList.remove('hidden');
    document.getElementById('songList').classList.add('hidden');
    document.getElementById('notFoundTab').classList.add('active');
    document.getElementById('foundTab').classList.remove('active');
    document.querySelector('.tab-slider').style.left = '50%'; // Slider anpassen
});

displaySongs();