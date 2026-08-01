document.addEventListener('DOMContentLoaded', function() {
    if (window.__musicPlayerInited__) return;
    window.__musicPlayerInited__ = true;

    // 检查配置是否存在
    if (typeof musicConfig === 'undefined' || !musicConfig.playlist || musicConfig.playlist.length === 0) {
        return;
    }

    const playlist = musicConfig.playlist;
    let currentSongIndex = 0;
    let isPlaying = false;

    // 获取DOM元素
    const audio = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const playlistToggle = document.getElementById('playlistToggle');
    const playlistPanel = document.getElementById('playlistPanel');
    const playlistItems = document.getElementById('playlistItems');
    const playModeBtn = document.getElementById('playModeBtn');
    const playModeIcon = document.getElementById('playModeIcon');
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const songTitle = document.getElementById('songTitle');
    const albumArt = document.getElementById('albumArt');
    const widget = document.querySelector('.music-widget');

    const playModes = ['sequence', 'single', 'shuffle'];
    let playModeIndex = 0; // 0: 顺序播放, 1: 单曲循环, 2: 随机播放

    function updatePlayModeButton() {
        const mode = playModes[playModeIndex];
        playModeBtn.title = mode === 'sequence' ? '顺序播放' : mode === 'single' ? '单曲循环' : '随机播放';
        playModeIcon.className = '';
        if (mode === 'sequence') {
            playModeIcon.classList.add('ri-repeat-line');
        } else if (mode === 'single') {
            playModeIcon.classList.add('ri-repeat-one-line');
        } else {
            playModeIcon.classList.add('ri-shuffle-line');
        }
    }

    function loadSong(song) {
        songTitle.innerText = `${song.title} - ${song.artist}`;
        audio.src = song.url;
        albumArt.style.backgroundImage = `url("${song.cover}")`;

        // 重置进度条
        progressBar.style.width = '0%';
    }

    function getSeekTime(event) {
        const rect = progressContainer.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        let ratio = (clientX - rect.left) / rect.width;
        ratio = Math.min(Math.max(ratio, 0), 1);
        return ratio * audio.duration || 0;
    }

    let isSeeking = false;

    function setCurrentTimeByEvent(event) {
        if (!audio.duration) return;
        const time = getSeekTime(event);
        audio.currentTime = time;
        const progressPercent = (time / audio.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
    }

    // 播放歌曲
    function playSong() {
        widget.classList.add('playing');
        playIcon.classList.remove('ri-play-large-fill');
        playIcon.classList.add('ri-pause-large-fill');
        audio.play().catch(e => console.log("Auto-play prevented:", e));
        isPlaying = true;
    }

    // 暂停歌曲
    function pauseSong() {
        widget.classList.remove('playing');
        playIcon.classList.remove('ri-pause-large-fill');
        playIcon.classList.add('ri-play-large-fill');
        audio.pause();
        isPlaying = false;
    }

    function updatePlaylistHighlight() {
        if (!playlistItems) return;
        Array.from(playlistItems.children).forEach((item) => {
            item.classList.toggle('active', Number(item.dataset.index) === currentSongIndex);
        });
    }

    function renderPlaylist() {
        if (!playlistItems) return;
        playlistItems.innerHTML = playlist.map((song, index) => {
            return `
                <li class="playlist-item${index === currentSongIndex ? ' active' : ''}" data-index="${index}">
                    <span class="playlist-item-title">${song.title}</span>
                    <span class="playlist-item-artist">${song.artist}</span>
                </li>`;
        }).join('');
    }

    // 切换播放状态
    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseSong();
        } else {
            playSong();
        }
    });

    // 上一首
    prevBtn.addEventListener('click', () => {
        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = playlist.length - 1;
        }
        loadSong(playlist[currentSongIndex]);
        playSong();
        updatePlaylistHighlight();
    });

    // 下一首
    nextBtn.addEventListener('click', () => {
        currentSongIndex++;
        if (currentSongIndex > playlist.length - 1) {
            currentSongIndex = 0;
        }
        loadSong(playlist[currentSongIndex]);
        playSong();
        updatePlaylistHighlight();
    });

    // 更新进度条
    audio.addEventListener('timeupdate', (e) => {
        if (isSeeking) return;
        const { duration, currentTime } = e.srcElement;
        if(isNaN(duration)) return;
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
    });

    progressContainer.addEventListener('click', (event) => {
        setCurrentTimeByEvent(event);
    });

    progressContainer.addEventListener('mousedown', (event) => {
        isSeeking = true;
        event.preventDefault();
        setCurrentTimeByEvent(event);
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (event) => {
        if (!isSeeking) return;
        setCurrentTimeByEvent(event);
    });

    document.addEventListener('mouseup', () => {
        if (!isSeeking) return;
        isSeeking = false;
        document.body.style.userSelect = '';
    });

    progressContainer.addEventListener('touchstart', (event) => {
        isSeeking = true;
        setCurrentTimeByEvent(event);
    }, { passive: true });

    progressContainer.addEventListener('touchmove', (event) => {
        if (!isSeeking) return;
        setCurrentTimeByEvent(event);
    }, { passive: true });

    document.addEventListener('touchend', () => {
        if (!isSeeking) return;
        isSeeking = false;
    });

    playlistToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        playlistPanel.classList.toggle('open');
    });

    playlistItems.addEventListener('click', (event) => {
        const item = event.target.closest('.playlist-item');
        if (!item) return;
        const index = Number(item.dataset.index);
        if (Number.isNaN(index)) return;
        currentSongIndex = index;
        loadSong(playlist[currentSongIndex]);
        playSong();
        updatePlaylistHighlight();
        playlistPanel.classList.remove('open');
    });

    playModeBtn.addEventListener('click', () => {
        playModeIndex = (playModeIndex + 1) % playModes.length;
        updatePlayModeButton();
    });

    document.addEventListener('click', (event) => {
        if (!playlistPanel.contains(event.target) && !playlistToggle.contains(event.target)) {
            playlistPanel.classList.remove('open');
        }
    });

    // 当前歌曲结束后根据播放模式处理
    audio.addEventListener('ended', () => {
        const mode = playModes[playModeIndex];
        if (mode === 'single') {
            audio.currentTime = 0;
            playSong();
            return;
        }

        if (mode === 'shuffle') {
            if (playlist.length > 1) {
                let nextIndex;
                do {
                    nextIndex = Math.floor(Math.random() * playlist.length);
                } while (nextIndex === currentSongIndex);
                currentSongIndex = nextIndex;
            }
        } else {
            currentSongIndex++;
            if (currentSongIndex > playlist.length - 1) {
                currentSongIndex = 0;
            }
        }

        loadSong(playlist[currentSongIndex]);
        playSong();
        updatePlaylistHighlight();
    });

    // 初始加载第一首
    loadSong(playlist[currentSongIndex]);
    renderPlaylist();
    updatePlaylistHighlight();
    updatePlayModeButton();

    if (musicConfig.autoplay) {
        playSong();
    }
});