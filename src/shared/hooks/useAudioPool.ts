import { useCallback, useRef, useEffect, useState } from 'react';

interface AudioPoolState {
  tickPool: HTMLAudioElement[];
  finishPool: HTMLAudioElement[];
  backgroundMusic: HTMLAudioElement | null;
  currentTickIndex: number;
  currentFinishIndex: number;
  isInitialized: boolean;
  audioLost: boolean;
  lastPlayTime: number;
  backgroundMusicPlaying: boolean;
}

export const useAudioPool = () => {
  const audioState = useRef<AudioPoolState>({
    tickPool: [],
    finishPool: [],
    backgroundMusic: null,
    currentTickIndex: 0,
    currentFinishIndex: 0,
    isInitialized: false,
    audioLost: false,
    lastPlayTime: 0,
    backgroundMusicPlaying: false
  });

  const [audioLost, setAudioLost] = useState(false);

  // Detectar si es un dispositivo móvil
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }, []);


  // Crear datos de audio más robustos
  const createRobustAudioData = useCallback((frequency: number, duration: number, volume: number = 0.1) => {
    const sampleRate = 44100;
    const length = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header más robusto
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Generar onda más compleja para mejor compatibilidad
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t) * 
                    Math.exp(-t * 2) * // Envelope para evitar clicks
                    volume * 32767;
      view.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, sample)), true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }, []);

  // Inicializar pool de audio
  const initializeAudio = useCallback(async () => {
    if (audioState.current.isInitialized) return true;

    try {
      // Crear múltiples instancias de cada sonido
      const poolSize = isMobile() ? 5 : 3; // Más instancias en móviles
      
      // Crear datos de audio
      const tickData = createRobustAudioData(1000, 0.15, 0.2); // Más largo y más fuerte
      const finishData = createRobustAudioData(800, 0.8, 0.4);

      const tickUrl = URL.createObjectURL(tickData);
      const finishUrl = URL.createObjectURL(finishData);

      const tickPool: HTMLAudioElement[] = [];
      const finishPool: HTMLAudioElement[] = [];

      // Crear pool de instancias
      for (let i = 0; i < poolSize; i++) {
        const tickAudio = new Audio(tickUrl);
        const finishAudio = new Audio(finishUrl);

        // Configuración agresiva para móviles
        if (isMobile()) {
          tickAudio.preload = 'auto';
          finishAudio.preload = 'auto';
          tickAudio.volume = 1.0; // Volumen máximo
          finishAudio.volume = 1.0;
          tickAudio.load(); // Forzar carga
          finishAudio.load();
        } else {
          tickAudio.volume = 0.2;
          finishAudio.volume = 0.4;
        }

        tickPool.push(tickAudio);
        finishPool.push(finishAudio);
      }

      // Crear música de fondo usando archivo real
      const backgroundMusic = new Audio('/background-music.mp3');
      backgroundMusic.loop = true;
      backgroundMusic.volume = isMobile() ? 0.3 : 0.2; // Más audible
      backgroundMusic.preload = 'auto';
      backgroundMusic.load();

      audioState.current = {
        tickPool,
        finishPool,
        backgroundMusic,
        currentTickIndex: 0,
        currentFinishIndex: 0,
        isInitialized: true,
        audioLost: false,
        lastPlayTime: 0,
        backgroundMusicPlaying: false
      };

      return true;
    } catch (error) {
      console.warn('Error inicializando pool de audio:', error);
      return false;
    }
  }, [createRobustAudioData, isMobile]);

  // Detectar pérdida de audio
  const detectAudioLoss = useCallback(() => {
    const now = Date.now();
    const timeSinceLastPlay = now - audioState.current.lastPlayTime;
    
    // Detectar pérdida más agresivamente
    if (timeSinceLastPlay > 1500 && audioState.current.lastPlayTime > 0) {
      if (!audioState.current.audioLost) {
        audioState.current.audioLost = true;
        setAudioLost(true);
        console.warn('Audio perdido detectado - tiempo desde última reproducción:', timeSinceLastPlay);
      }
    }
  }, []);

  // Reproducir sonido de tick con rotación de pool
  const playTickSound = useCallback(async () => {
    if (!audioState.current.isInitialized) {
      await initializeAudio();
    }

    const now = Date.now();
    audioState.current.lastPlayTime = now;
    audioState.current.audioLost = false;
    setAudioLost(false);

    // Intentar reproducir con múltiples instancias
    const promises: Promise<void>[] = [];
    
    // Usar 2-3 instancias simultáneamente para mayor confiabilidad
    const instancesToUse = isMobile() ? 3 : 2;
    
    for (let i = 0; i < instancesToUse; i++) {
      const audioIndex = (audioState.current.currentTickIndex + i) % audioState.current.tickPool.length;
      const audio = audioState.current.tickPool[audioIndex];
      
      if (audio) {
        const promise = new Promise<void>((resolve) => {
          try {
            audio.currentTime = 0;
            audio.play()
              .then(() => {
                resolve();
              })
              .catch((error) => {
                console.warn(`Tick audio ${audioIndex} falló:`, error);
                resolve(); // No fallar si una instancia falla
              });
          } catch (error) {
            console.warn(`Tick audio ${audioIndex} error:`, error);
            resolve();
          }
        });
        
        promises.push(promise);
      }
    }

    // Rotar índice para próxima reproducción
    audioState.current.currentTickIndex = (audioState.current.currentTickIndex + 1) % audioState.current.tickPool.length;

    // Esperar al menos una reproducción exitosa
    try {
      await Promise.race(promises);
    } catch (error) {
      console.warn('Todas las instancias de tick fallaron:', error);
    }
  }, [initializeAudio, isMobile]);

  // Reproducir sonido de finalización
  const playFinishSound = useCallback(async () => {
    if (!audioState.current.isInitialized) {
      await initializeAudio();
    }

    // Usar múltiples instancias para finalización
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < 2; i++) {
      const audioIndex = (audioState.current.currentFinishIndex + i) % audioState.current.finishPool.length;
      const audio = audioState.current.finishPool[audioIndex];
      
      if (audio) {
        const promise = new Promise<void>((resolve) => {
          try {
            audio.currentTime = 0;
            audio.play()
              .then(() => {
                resolve();
              })
              .catch((error) => {
                console.warn(`Finish audio ${audioIndex} falló:`, error);
                resolve();
              });
          } catch (error) {
            console.warn(`Finish audio ${audioIndex} error:`, error);
            resolve();
          }
        });
        
        promises.push(promise);
      }
    }

    audioState.current.currentFinishIndex = (audioState.current.currentFinishIndex + 1) % audioState.current.finishPool.length;

    try {
      await Promise.race(promises);
    } catch (error) {
      console.warn('Todas las instancias de finish fallaron:', error);
    }
  }, [initializeAudio]);

  // Iniciar música de fondo
  const startBackgroundMusic = useCallback(async () => {
    if (audioState.current.backgroundMusic && !audioState.current.backgroundMusicPlaying) {
      try {
        console.log('Intentando iniciar música de fondo...');
        
        // Verificar si el archivo está cargado
        if (audioState.current.backgroundMusic.readyState < 2) {
          console.log('Esperando a que se cargue el archivo de música...');
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout cargando música')), 5000);
            audioState.current.backgroundMusic!.addEventListener('canplay', () => {
              clearTimeout(timeout);
              resolve(void 0);
            });
            audioState.current.backgroundMusic!.addEventListener('error', (e) => {
              clearTimeout(timeout);
              reject(e);
            });
          });
        }
        
        await audioState.current.backgroundMusic.play();
        audioState.current.backgroundMusicPlaying = true;
        console.log('Música de fondo iniciada exitosamente');
      } catch (error) {
        console.warn('Error iniciando música de fondo:', error);
        // Intentar recargar el archivo
        if (audioState.current.backgroundMusic) {
          audioState.current.backgroundMusic.load();
        }
      }
    } else {
      console.log('Música de fondo no disponible o ya reproduciéndose');
    }
  }, []);

  // Detener música de fondo
  const stopBackgroundMusic = useCallback(() => {
    if (audioState.current.backgroundMusic && audioState.current.backgroundMusicPlaying) {
      audioState.current.backgroundMusic.pause();
      audioState.current.backgroundMusic.currentTime = 0;
      audioState.current.backgroundMusicPlaying = false;
      console.log('Música de fondo detenida');
    }
  }, []);

  // Reactivar audio
  const reactivateAudio = useCallback(async () => {
    // Recargar todas las instancias
    audioState.current.tickPool.forEach(audio => {
      audio.load();
    });
    audioState.current.finishPool.forEach(audio => {
      audio.load();
    });

    // Reiniciar música de fondo si estaba reproduciéndose
    if (audioState.current.backgroundMusicPlaying) {
      await startBackgroundMusic();
    }

    audioState.current.audioLost = false;
    setAudioLost(false);
    console.log('Audio pool reactivado');
  }, [startBackgroundMusic]);

  // Limpiar recursos
  const cleanup = useCallback(() => {
    audioState.current.tickPool.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    audioState.current.finishPool.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    
    if (audioState.current.backgroundMusic) {
      audioState.current.backgroundMusic.pause();
      audioState.current.backgroundMusic.src = '';
    }
    
    audioState.current = {
      tickPool: [],
      finishPool: [],
      backgroundMusic: null,
      currentTickIndex: 0,
      currentFinishIndex: 0,
      isInitialized: false,
      audioLost: false,
      lastPlayTime: 0,
      backgroundMusicPlaying: false
    };
    setAudioLost(false);
  }, []);

  // Detectar pérdida de audio periódicamente
  useEffect(() => {
    const interval = setInterval(detectAudioLoss, 800); // Más frecuente
    return () => clearInterval(interval);
  }, [detectAudioLoss]);

  // Limpiar al desmontar
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    playTickSound,
    playFinishSound,
    initializeAudio,
    reactivateAudio,
    startBackgroundMusic,
    stopBackgroundMusic,
    audioLost,
    cleanup
  };
};
