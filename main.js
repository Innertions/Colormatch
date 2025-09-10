document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loadingScreen = document.getElementById('loading-screen');
    const mainMenu = document.querySelector('.main-menu');
    const gameContainer = document.querySelector('.game-container');
    const gameOverMenu = document.querySelector('.game-over-menu');
    const startButton = document.getElementById('start-button');
    const howToPlayButton = document.getElementById('how-to-play-button');
    const settingsButton = document.getElementById('settings-button');
    const closeGuideButton = document.getElementById('close-guide-button');
    const closeSettingsButton = document.getElementById('close-settings-button');
    const retryButton = document.getElementById('retry-button');
    const menuButton = document.getElementById('menu-button');
    const guideModal = document.getElementById('guide-modal');
    const settingsModal = document.getElementById('settings-modal');
    const colorTarget = document.getElementById('color-target');
    const colorOptions = document.getElementById('color-options');
    const liveScoreDisplay = document.getElementById('live-score');
    const bestScoreDisplay = document.getElementById('best-score');
    const currentBestScoreDisplay = document.getElementById('current-best-score');
    const timerDisplay = document.getElementById('timer');
    const finalScoreDisplay = document.getElementById('final-score');
    const modeSelect = document.getElementById('mode');
    const colorModeSelect = document.getElementById('color-mode');
    const colorCountSelect = document.getElementById('color-count');
    const countdown = document.getElementById('countdown');
    const countdownNumber = document.getElementById('countdown-number');
    const bgmToggleButton = document.getElementById('bgm-toggle');
    const sfxToggleButton = document.getElementById('sfx-toggle');

    // Audio Elements
    const clickSound = document.getElementById('click-sound');
    const correctSound = document.getElementById('correct-sound');
    const wrongSound = document.getElementById('wrong-sound');
    const backgroundMusic = document.getElementById('background-music');

    // Game Variables
    let liveScore = 0;
    let bestScores = {};
    let targetColor = '';
    let timer;
    let timeLeft;
    let isBgmMuted = false;
    let isSfxMuted = false;
    let audioInitialized = false;

    const colors = [
        '#FF0000', '#00FF00', '#0000FF', 
        '#FFFF00', '#00FFFF', '#FF00FF', 
        '#FFA500', '#800080', '#FF6347',
        '#7CFC00', '#9932CC', '#00BFFF'
    ];

    // Initialize Game
    function init() {
        loadBestScores();
        updateBestScoreDisplays();
        setupEventListeners();
        
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
        }, 2000);
    }

    function loadBestScores() {
        const modes = ['easy', 'normal', 'hard'];
        const colorModes = ['normal', 'colorblind'];
        
        modes.forEach(mode => {
            colorModes.forEach(colorMode => {
                const key = `${mode}_${colorMode}`;
                bestScores[key] = parseInt(localStorage.getItem(`bestScore_${key}`)) || 0;
            });
        });
    }

    function updateBestScoreDisplays() {
        const mode = modeSelect.value;
        const colorMode = colorModeSelect.value;
        const key = `${mode}_${colorMode}`;
        
        const bestScore = bestScores[key] || 0;
        bestScoreDisplay.textContent = bestScore;
        currentBestScoreDisplay.textContent = bestScore;
    }

    function saveBestScore(score) {
        const mode = modeSelect.value;
        const colorMode = colorModeSelect.value;
        const key = `${mode}_${colorMode}`;
        
        if (score > (bestScores[key] || 0)) {
            bestScores[key] = score;
            localStorage.setItem(`bestScore_${key}`, score);
            updateBestScoreDisplays();
        }
    }

    // Audio Initialization
    function initAudio() {
        if (audioInitialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            const buffer = audioContext.createBuffer(1, 1, 22050);
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start();
            
            audioInitialized = true;
            console.log('Audio initialized');
        } catch (e) {
            console.error('Audio initialization failed:', e);
        }
    }

    function handleBackgroundMusic(action) {
        if (!audioInitialized) return;
        
        try {
            switch(action) {
                case 'play':
                    if (!isBgmMuted) {
                        backgroundMusic.currentTime = 0;
                        backgroundMusic.play();
                    }
                    break;
                case 'stop':
                    backgroundMusic.pause();
                    backgroundMusic.currentTime = 0;
                    break;
            }
        } catch (e) {
            console.error('Music control failed:', e);
        }
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Button clicks
        startButton.addEventListener('click', startGame);
        howToPlayButton.addEventListener('click', () => toggleModal(guideModal));
        settingsButton.addEventListener('click', () => toggleModal(settingsModal));
        closeGuideButton.addEventListener('click', () => toggleModal(guideModal));
        closeSettingsButton.addEventListener('click', () => toggleModal(settingsModal));
        retryButton.addEventListener('click', retryGame);
        menuButton.addEventListener('click', exitToMenu);

        // Mode changes
        modeSelect.addEventListener('change', updateBestScoreDisplays);
        colorModeSelect.addEventListener('change', updateBestScoreDisplays);

        // Sound controls
        bgmToggleButton.addEventListener('click', toggleBGM);
        sfxToggleButton.addEventListener('click', toggleSFX);

        // Add click sound to all buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => playSound('click-sound'));
        });
    }

    // Modal Control
    function toggleModal(modal) {
        modal.classList.toggle('active');
        playSound('click-sound');
    }

    // Sound Control Functions
    function playSound(soundId) {
        if (isSfxMuted || !audioInitialized) return;
        
        const sound = document.getElementById(soundId);
        if (!sound) return;
        
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Sound play failed:', e));
    }

    function toggleBGM() {
        isBgmMuted = !isBgmMuted;
        bgmToggleButton.textContent = `BGM: ${isBgmMuted ? 'Off' : 'On'}`;
        
        if (isBgmMuted) {
            backgroundMusic.pause();
        } else if (audioInitialized) {
            backgroundMusic.play().catch(e => console.log('BGM play failed:', e));
        }
    }

    function toggleSFX() {
        isSfxMuted = !isSfxMuted;
        sfxToggleButton.textContent = `SFX: ${isSfxMuted ? 'Off' : 'On'}`;
    }

    // Game Control Functions
    function startGame() {
        if (!audioInitialized) initAudio();
        
        mainMenu.style.display = 'none';
        gameContainer.style.display = 'flex';
        resetGame();
        startCountdown();
        
        handleBackgroundMusic('play');
    }

    function resetGame() {
        liveScore = 0;
        liveScoreDisplay.textContent = liveScore;
        updateBestScoreDisplays();
        colorTarget.style.backgroundColor = '';
        colorTarget.textContent = '';
        colorOptions.innerHTML = '';
    }

    function startCountdown() {
        countdown.style.display = 'block';
        let count = 3;
        countdownNumber.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            countdownNumber.textContent = count;
            
            if (count <= 0) {
                clearInterval(countdownInterval);
                countdown.style.display = 'none';
                generateColors();
                startTimer();
            }
        }, 1000);
    }

    function generateColors() {
        colorOptions.innerHTML = '';
        const colorCount = parseInt(colorCountSelect.value);
        colorOptions.setAttribute('data-color-count', colorCount);
        
        targetColor = colors[Math.floor(Math.random() * colors.length)];
        colorTarget.style.backgroundColor = targetColor;
        
        if (colorModeSelect.value === 'colorblind') {
            colorTarget.textContent = colors.indexOf(targetColor) + 1;
        }
        
        const options = [targetColor];
        
        while (options.length < colorCount) {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            if (!options.includes(randomColor)) {
                options.push(randomColor);
            }
        }
        
        options.sort(() => Math.random() - 0.5);
        
        options.forEach(color => {
            const option = document.createElement('div');
            option.style.backgroundColor = color;
            
            if (colorModeSelect.value === 'colorblind') {
                option.textContent = colors.indexOf(color) + 1;
            }
            
            option.addEventListener('click', () => checkColor(color));
            colorOptions.appendChild(option);
        });
    }

    function checkColor(selectedColor) {
        if (selectedColor === targetColor) {
            playSound('correct-sound');
            liveScore++;
            liveScoreDisplay.textContent = liveScore;
            saveBestScore(liveScore);
            generateColors();
            resetTimer();
        } else {
            playSound('wrong-sound');
            endGame();
        }
    }

    function startTimer() {
        clearInterval(timer);
        
        const mode = modeSelect.value;
        if (mode === 'easy') timeLeft = 3;
        else if (mode === 'normal') timeLeft = 2;
        else if (mode === 'hard') timeLeft = 1;
        
        timerDisplay.textContent = timeLeft.toFixed(1);
        
        timer = setInterval(() => {
            timeLeft -= 0.1;
            timeLeft = Math.max(timeLeft, 0);
            timerDisplay.textContent = timeLeft.toFixed(1);
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                playSound('wrong-sound');
                endGame();
            }
        }, 100);
    }

    function resetTimer() {
        clearInterval(timer);
        startTimer();
    }

    function endGame() {
        clearInterval(timer);
        finalScoreDisplay.textContent = liveScore;
        gameOverMenu.style.display = 'flex';
        saveBestScore(liveScore);
    }

    function retryGame() {
        gameOverMenu.style.display = 'none';
        resetGame();
        startCountdown();
        playSound('click-sound');
    }

    function exitToMenu() {
        gameOverMenu.style.display = 'none';
        gameContainer.style.display = 'none';
        mainMenu.style.display = 'block';
        playSound('click-sound');
    }

    // Initialize the game
    init();
});