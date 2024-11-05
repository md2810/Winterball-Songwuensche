const clientId = 'c6ac848d1a84407fac1ef488542331eb';
const clientSecret = '2715776b65f94f918dc9a9672e3a4d41';
const googleApiKey = 'AIzaSyDMaLLPOkf6U-bZn2tni5oYT3JOE6gLt4g'; // Dein Google API-Key
const spreadsheetId = '1f7aJpZMk3HV-aSmBlL1p-Zs7FdRMJ2BfvLbjeq58_lw'; // ID des Google Sheets

async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

async function searchSongs(query) {
    const accessToken = await getAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/search?query=${encodeURIComponent(query)}&type=track`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    });
    return response.json();
}

async function fetchManualList() {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/ManuelleListe?key=${googleApiKey}`);
    const data = await response.json();
    return data.values || [];
}

function displaySongs(songs) {
    const songsContainer = document.getElementById('songsContainer');
    songsContainer.innerHTML = '';

    songs.tracks.items.forEach(track => {
        const songPanel = document.createElement('div');
        songPanel.className = 'song-panel';

        const songImage = document.createElement('img');
        songImage.src = track.album.images[0].url;
        songPanel.appendChild(songImage);

        const songDetails = document.createElement('div');
        songDetails.innerHTML = `
            <div class="song-title">${track.name}</div>
            <div>${track.artists.map(artist => artist.name).join(', ')}</div>
        `;
        songPanel.appendChild(songDetails);

        const linkButton = document.createElement('a');
        linkButton.href = track.external_urls.spotify;
        linkButton.target = '_blank';
        linkButton.innerHTML = '🔗';
        songPanel.appendChild(linkButton);

        songsContainer.appendChild(songPanel);
    });
}

function displayManualList(manualSongs) {
    const manualListTableBody = document.getElementById('manualListTable').getElementsByTagName('tbody')[0];
    manualListTableBody.innerHTML = '';

    manualSongs.forEach(song => {
        const row = manualListTableBody.insertRow();
        const titleCell = row.insertCell(0);
        const artistCell = row.insertCell(1);
        const linkCell = row.insertCell(2);
        
        titleCell.textContent = song[0]; // Songtitel
        artistCell.textContent = song[1]; // Künstler
        linkCell.innerHTML = `<a href="${song[2]}" target="_blank">🔗</a>`; // Link
    });
}

document.getElementById('searchButton').addEventListener('click', async () => {
    const songInput = document.getElementById('songInput').value;
    const songs = await searchSongs(songInput);
    displaySongs(songs);
});

document.getElementById('manualListButton').addEventListener('click', async () => {
    const popover = document.getElementById('manualListPopover');
    const manualSongs = await fetchManualList();
    displayManualList(manualSongs);
    popover.style.display = 'block';
});

document.getElementById('closePopover').addEventListener('click', () => {
    const popover = document.getElementById('manualListPopover');
    popover.style.display = 'none';
});
