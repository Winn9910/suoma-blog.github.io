
document.addEventListener('DOMContentLoaded', function () {
    if (window.__win7MusicInited__) return;
    window.__win7MusicInited__ = true;

    if (typeof musicConfig === 'undefined' || !musicConfig.playlist || musicConfig.playlist.length === 0) {
        return;
    }

    var PLAY_ICON = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
    var PAUSE_ICON = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';

    var playlist = musicConfig.playlist;
    var currentSongIndex = 0;
    var isPlaying = false;

    var audio = document.getElementById('audioPlayer');
    var playBtn = document.getElementById('playBtn');
    var playIcon = document.getElementById('playIcon');
    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');
    var progressBar = document.getElementById('progressBar');
    var progressContainer = document.getElementById('progressContainer');
    var songTitle = document.getElementById('songTitle');
    var albumArt = document.getElementById('albumArt');

    function loadSong(song) {
        songTitle.innerText = (song.title || 'Unknown') + (song.artist ? ' - ' + song.artist : '');
        audio.src = song.url;
        albumArt.style.backgroundImage = song.cover ? 'url("' + song.cover + '")' : '';
        progressBar.style.width = '0%';
    }

    function playSong() {
        playIcon.innerHTML = PAUSE_ICON;
        var p = audio.play();
        if (p && p.catch) p.catch(function (e) { console.log('Auto-play prevented:', e); });
        isPlaying = true;
    }

    function pauseSong() {
        playIcon.innerHTML = PLAY_ICON;
        audio.pause();
        isPlaying = false;
    }

    playBtn.addEventListener('click', function () {
        isPlaying ? pauseSong() : playSong();
    });

    prevBtn.addEventListener('click', function () {
        currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
        loadSong(playlist[currentSongIndex]);
        playSong();
    });

    nextBtn.addEventListener('click', function () {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
        loadSong(playlist[currentSongIndex]);
        playSong();
    });

    audio.addEventListener('timeupdate', function (e) {
        var duration = e.target.duration;
        var currentTime = e.target.currentTime;
        if (isNaN(duration)) return;
        progressBar.style.width = (currentTime / duration) * 100 + '%';
    });

    if (progressContainer) {
        progressContainer.addEventListener('click', function (e) {
            if (!audio.duration) return;
            var rect = progressContainer.getBoundingClientRect();
            audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
        });
    }

    audio.addEventListener('ended', function () {
        nextBtn.click();
    });

    var toggleBtn = document.getElementById('musicToggle');
    var gadget = document.querySelector('.music-gadget');
    if (toggleBtn && gadget) {
        toggleBtn.addEventListener('click', function () {
            var collapsed = gadget.classList.toggle('collapsed');
            try {
                if (collapsed) localStorage.setItem('win7-music-collapsed', '1');
                else localStorage.removeItem('win7-music-collapsed');
            } catch (e) {  }
        });
    }

    if (gadget && window.win7MakeDraggable) {
        window.win7MakeDraggable(gadget, { storeKey: 'win7-music-pos', breakpoint: 820 });
    }

    loadSong(playlist[currentSongIndex]);
    if (musicConfig.autoplay) playSong();
});
