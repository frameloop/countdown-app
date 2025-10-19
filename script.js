// DOM
const countdownEl = document.getElementById('countdown');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const backBtn = document.getElementById('backBtn');
const goToCountdownBtn = document.getElementById('goToCountdownBtn');
const setupScreen = document.getElementById('setup-screen');
const countdownScreen = document.getElementById('countdown-screen');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
// Los sonidos ahora se generan sintéticamente

let intervalId = null;
let remaining = 0;
let isPaused = false;

// Utilidad: crea el HTML animado tipo odómetro
function renderDigits(value) {
  const str = value;
  countdownEl.innerHTML = '';

  for (const char of str) {
    const digit = document.createElement('div');
    digit.className = 'digit';

    if (char === ':') {
      // Para los dos puntos, crear un elemento simple
      digit.innerHTML = '<span class="colon">:</span>';
    } else {
      const inner = document.createElement('div');
      inner.className = 'digit-inner';

      for (let i = 0; i <= 9; i++) {
        const d = document.createElement('div');
        d.textContent = i;
        d.setAttribute('data-digit', i);
        inner.appendChild(d);
      }

      // Ajustar la transformación para el nuevo tamaño
      inner.style.transform = `translateY(-${parseInt(char) * 1.4}em)`;
      digit.appendChild(inner);
    }

    countdownEl.appendChild(digit);
  }
}

// Convierte segundos a mm:ss o ss
function formatTimeDisplay(total) {
  const min = Math.floor(total / 60);
  const sec = total % 60;

  if (total < 60) return `${sec.toString().padStart(2, '0')}`;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  renderDigits(formatTimeDisplay(remaining));
}

// Función para generar pitido corto
function playTickSound() {
  try {
    // Crear un tono corto usando Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Frecuencia del pitido
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.log('No se pudo reproducir el sonido:', error);
  }
}

// Función para generar pitido largo
function playEndSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log('No se pudo reproducir el sonido:', error);
  }
}

function startCountdown() {
  if (remaining <= 0) return;

  pauseBtn.disabled = false;
  startBtn.disabled = true;

  intervalId = setInterval(() => {
    if (!isPaused) {
      remaining--;

      // Reproducir pitido corto cada segundo
      playTickSound();

      updateDisplay();

      if (remaining <= 0) {
        clearInterval(intervalId);
        countdownEl.classList.add('flash');
        // Reproducir pitido largo al terminar
        playEndSound();
        startBtn.textContent = "Reiniciar";
        pauseBtn.disabled = true;
        startBtn.disabled = false;
      }
    }
  }, 1000);
}

startBtn.addEventListener('click', () => {
  if (startBtn.textContent === "Reiniciar") {
    countdownEl.classList.remove('flash');
    updateDisplay();
    startBtn.textContent = "Iniciar";
    pauseBtn.disabled = true;
    return;
  }

  isPaused = false;
  startCountdown();
});

pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Reanudar" : "Pausar";
});

backBtn.addEventListener('click', () => {
  clearInterval(intervalId);
  isPaused = false;
  startBtn.textContent = "Iniciar";
  pauseBtn.textContent = "Pausar";
  pauseBtn.disabled = true;
  countdownEl.innerHTML = '';
  setupScreen.classList.add('active');
  countdownScreen.classList.remove('active');
});

goToCountdownBtn.addEventListener('click', () => {
  const min = parseInt(minutesInput.value) || 0;
  const sec = parseInt(secondsInput.value) || 0;
  remaining = min * 60 + sec;

  if (remaining > 0) {
    updateDisplay();
    setupScreen.classList.remove('active');
    countdownScreen.classList.add('active');
    pauseBtn.disabled = true;
    startBtn.disabled = false;
  }
});
