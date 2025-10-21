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
  fadeIntervalRef: NodeJS.Timeout | null;
  shouldBePlaying: boolean; // Nueva flag para control estricto
  watchdogInterval: NodeJS.Timeout | null; // Vigilante para forzar detención
}

export const useAudioPool = (volume: number = 50) => {
  const audioState = useRef<AudioPoolState>({
    tickPool: [],
    finishPool: [],
    backgroundMusic: null,
    currentTickIndex: 0,
    currentFinishIndex: 0,
    isInitialized: false,
    audioLost: false,
    lastPlayTime: 0,
    backgroundMusicPlaying: false,
    fadeIntervalRef: null,
    shouldBePlaying: false,
    watchdogInterval: null
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
      const finishData = createRobustAudioData(800, 1.5, 0.5); // Pitido más largo

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
          finishAudio.volume = 0.5;
        }

        tickPool.push(tickAudio);
        finishPool.push(finishAudio);
      }

      // Crear música de fondo usando archivo real
      const backgroundMusic = new Audio('/background-music.mp3');
      backgroundMusic.loop = true;
      backgroundMusic.volume = volume / 100; // Usar volumen actual
      backgroundMusic.preload = 'auto';
      
      // Agregar listeners para debugging
      backgroundMusic.addEventListener('loadstart', () => console.log('Música: Iniciando carga'));
      backgroundMusic.addEventListener('loadeddata', () => console.log('Música: Datos cargados'));
      backgroundMusic.addEventListener('canplay', () => console.log('Música: Puede reproducir'));
      backgroundMusic.addEventListener('canplaythrough', () => console.log('Música: Carga completa'));
      backgroundMusic.addEventListener('error', (e) => console.error('Música: Error de carga', e));
      backgroundMusic.addEventListener('play', () => console.log('Música: Reproduciendo'));
      backgroundMusic.addEventListener('pause', () => console.log('Música: Pausada'));
      
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
        backgroundMusicPlaying: false,
        fadeIntervalRef: null,
        shouldBePlaying: false,
        watchdogInterval: null
      };

      console.log('Audio inicializado con volumen:', volume);

      return true;
    } catch (error) {
      console.warn('Error inicializando pool de audio:', error);
      return false;
    }
  }, [createRobustAudioData, isMobile, volume]);

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
    if (!audioState.current.backgroundMusic) {
      console.log('Música de fondo no disponible');
      return;
    }

    if (audioState.current.backgroundMusicPlaying) {
      console.log('Música de fondo ya reproduciéndose');
      return;
    }

    try {
      // Asegurar configuración correcta antes de reproducir
      const currentVolume = volume / 100;
      audioState.current.backgroundMusic.volume = currentVolume;
      audioState.current.backgroundMusic.loop = true; // Asegurar que loop esté activado
      
      console.log('🎵 Intentando iniciar música de fondo...');
      console.log('Estado del audio:', audioState.current.backgroundMusic.readyState);
      console.log('Volumen configurado:', currentVolume, `(${volume}%)`);
      console.log('Loop:', audioState.current.backgroundMusic.loop);
      console.log('Paused:', audioState.current.backgroundMusic.paused);
      
      // Marcar que DEBE estar reproduciendo
      audioState.current.shouldBePlaying = true;
      
      // Forzar play
      const playPromise = audioState.current.backgroundMusic.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        audioState.current.backgroundMusicPlaying = true;
        console.log('✅ Música de fondo iniciada exitosamente');
      }
    } catch (error) {
      console.error('❌ Error iniciando música de fondo:', error);
      console.log('Detalles del error:', {
        name: error.name,
        message: error.message,
        code: (error as any).code
      });
      audioState.current.shouldBePlaying = false;
    }
  }, [volume]);

  // Detener música de fondo con fade out
  const stopBackgroundMusic = useCallback((useFade: boolean = false) => {
    console.log('🛑 stopBackgroundMusic llamado, useFade:', useFade);
    console.log('backgroundMusic existe:', !!audioState.current.backgroundMusic);
    console.log('backgroundMusicPlaying:', audioState.current.backgroundMusicPlaying);
    
    // PRIMERO: Marcar que NO debe estar reproduciendo
    audioState.current.shouldBePlaying = false;
    audioState.current.backgroundMusicPlaying = false;
    
    // Limpiar cualquier fade previo
    if (audioState.current.fadeIntervalRef) {
      clearInterval(audioState.current.fadeIntervalRef);
      audioState.current.fadeIntervalRef = null;
    }
    
    if (!audioState.current.backgroundMusic) {
      console.log('No hay música de fondo para detener');
      return;
    }

    const music = audioState.current.backgroundMusic;

    // En móvil, siempre detener inmediatamente como fallback
    if (useFade && !isMobile()) {
      // Fade out gradual solo en desktop
      const startVolume = music.volume;
      const fadeTime = 2000; // 2 segundos
      const steps = 50;
      const stepTime = fadeTime / steps;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      console.log('Iniciando fade out desde volumen:', startVolume);

      audioState.current.fadeIntervalRef = setInterval(() => {
        currentStep++;
        const newVolume = Math.max(0, startVolume - (volumeStep * currentStep));
        
        try {
          music.volume = newVolume;
        } catch (error) {
          console.error('Error ajustando volumen:', error);
        }

        if (currentStep >= steps || newVolume <= 0) {
          if (audioState.current.fadeIntervalRef) {
            clearInterval(audioState.current.fadeIntervalRef);
            audioState.current.fadeIntervalRef = null;
          }
          
          try {
            music.pause();
            music.currentTime = 0;
            music.volume = startVolume; // Restaurar volumen original
          } catch (error) {
            console.error('Error deteniendo música:', error);
          }
          
          audioState.current.backgroundMusicPlaying = false;
          console.log('Música de fondo detenida con fade out');
        }
      }, stepTime);
    } else {
      // Detener inmediatamente (siempre en móvil)
      console.log('🛑 Deteniendo música inmediatamente');
      
      try {
        // Detención ULTRA AGRESIVA para iOS
        
        // 1. Remover el atributo loop
        music.removeAttribute('loop');
        music.loop = false;
        
        // 2. Pausar varias veces
        music.pause();
        music.pause(); // Doble pausa
        
        // 3. Reset tiempo
        music.currentTime = 0;
        
        // 4. En iOS, detener manualmente el src y recargarlo
        if (isMobile()) {
          const originalSrc = music.src;
          music.src = '';
          music.load();
          setTimeout(() => {
            music.src = originalSrc;
            music.load();
          }, 50);
        }
        
        // 5. Verificación múltiple con varios delays
        setTimeout(() => {
          if (music && !music.paused) {
            console.warn('⚠️ Música aún reproduciendo después de 100ms, forzando stop');
            music.pause();
            music.loop = false;
            music.currentTime = 0;
          }
        }, 100);
        
        setTimeout(() => {
          if (music && !music.paused) {
            console.error('🚨 Música TODAVÍA reproduciendo después de 500ms, stop NUCLEAR');
            music.pause();
            music.src = '';
            music.load();
          }
          console.log('✅ Estado final - Paused:', music.paused, 'CurrentTime:', music.currentTime);
        }, 500);
        
      } catch (error) {
        console.error('❌ Error al detener música:', error);
      }
    }
  }, [isMobile]);

  // Actualizar volumen de la música de fondo
  const updateBackgroundMusicVolume = useCallback((newVolume: number) => {
    if (audioState.current.backgroundMusic) {
      audioState.current.backgroundMusic.volume = newVolume / 100;
      console.log('Volumen de música de fondo actualizado:', newVolume);
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

    // Asegurar que el volumen esté configurado correctamente
    if (audioState.current.backgroundMusic) {
      audioState.current.backgroundMusic.volume = volume / 100;
    }

    // Reiniciar música de fondo si estaba reproduciéndose
    if (audioState.current.backgroundMusicPlaying) {
      await startBackgroundMusic();
    }

    audioState.current.audioLost = false;
    setAudioLost(false);
    console.log('Audio pool reactivado');
  }, [startBackgroundMusic, volume]);

  // Watchdog: Vigilante que verifica constantemente si la música debe estar detenida
  useEffect(() => {
    const watchdog = setInterval(() => {
      // Si NO debe estar reproduciendo pero está reproduciendo, detener inmediatamente
      if (!audioState.current.shouldBePlaying && 
          audioState.current.backgroundMusic && 
          !audioState.current.backgroundMusic.paused) {
        
        console.warn('🚨 WATCHDOG: Música reproduciendo cuando NO debería. Deteniendo...');
        const music = audioState.current.backgroundMusic;
        
        try {
          music.pause();
          music.loop = false;
          music.currentTime = 0;
          audioState.current.backgroundMusicPlaying = false;
          console.log('🛡️ WATCHDOG: Música detenida correctamente');
        } catch (error) {
          console.error('WATCHDOG: Error deteniendo música:', error);
        }
      }
    }, 200); // Verificar cada 200ms
    
    audioState.current.watchdogInterval = watchdog;
    
    return () => {
      if (watchdog) clearInterval(watchdog);
    };
  }, []);

  // Limpiar recursos
  const cleanup = useCallback(() => {
    // Limpiar watchdog
    if (audioState.current.watchdogInterval) {
      clearInterval(audioState.current.watchdogInterval);
    }
    
    // Limpiar fade interval si existe
    if (audioState.current.fadeIntervalRef) {
      clearInterval(audioState.current.fadeIntervalRef);
    }
    
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
      backgroundMusicPlaying: false,
      fadeIntervalRef: null,
      shouldBePlaying: false,
      watchdogInterval: null
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
    updateBackgroundMusicVolume,
    audioLost,
    cleanup
  };
};
