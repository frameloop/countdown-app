import { useCallback, useRef, useEffect } from 'react';

interface AudioFilesState {
  tickAudio: HTMLAudioElement | null;
  finishAudio: HTMLAudioElement | null;
  isInitialized: boolean;
}

export const useAudioFiles = () => {
  const audioState = useRef<AudioFilesState>({
    tickAudio: null,
    finishAudio: null,
    isInitialized: false
  });

  // Detectar si es un dispositivo móvil
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }, []);

  // Crear sonidos usando Web Audio API para generar archivos
  const createAudioData = useCallback((frequency: number, duration: number, volume: number = 0.1) => {
    const sampleRate = 44100;
    const length = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
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
    
    // Generate sine wave
    for (let i = 0; i < length; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * volume * 32767;
      view.setInt16(44 + i * 2, sample, true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }, []);

  // Inicializar archivos de audio
  const initializeAudio = useCallback(async () => {
    if (audioState.current.isInitialized) return true;

    try {
      // Crear datos de audio
      const tickData = createAudioData(1000, 0.1, 0.1);
      const finishData = createAudioData(800, 0.5, 0.3);

      // Crear URLs de blob
      const tickUrl = URL.createObjectURL(tickData);
      const finishUrl = URL.createObjectURL(finishData);

      // Crear elementos de audio
      const tickAudio = new Audio(tickUrl);
      const finishAudio = new Audio(finishUrl);

      // Configurar para móviles
      if (isMobile()) {
        tickAudio.preload = 'auto';
        finishAudio.preload = 'auto';
        tickAudio.volume = 0.8;
        finishAudio.volume = 0.8;
      } else {
        tickAudio.volume = 0.1;
        finishAudio.volume = 0.3;
      }

      audioState.current = {
        tickAudio,
        finishAudio,
        isInitialized: true
      };

      return true;
    } catch (error) {
      console.warn('Error inicializando archivos de audio:', error);
      return false;
    }
  }, [createAudioData, isMobile]);

  // Reproducir sonido de tick
  const playTickSound = useCallback(async () => {
    if (!audioState.current.tickAudio) {
      await initializeAudio();
    }

    if (audioState.current.tickAudio) {
      try {
        // Resetear el audio al inicio
        audioState.current.tickAudio.currentTime = 0;
        await audioState.current.tickAudio.play();
      } catch (error) {
        console.warn('Error reproduciendo tick sound:', error);
      }
    }
  }, [initializeAudio]);

  // Reproducir sonido de finalización
  const playFinishSound = useCallback(async () => {
    if (!audioState.current.finishAudio) {
      await initializeAudio();
    }

    if (audioState.current.finishAudio) {
      try {
        // Resetear el audio al inicio
        audioState.current.finishAudio.currentTime = 0;
        await audioState.current.finishAudio.play();
      } catch (error) {
        console.warn('Error reproduciendo finish sound:', error);
      }
    }
  }, [initializeAudio]);

  // Limpiar recursos
  const cleanup = useCallback(() => {
    if (audioState.current.tickAudio) {
      audioState.current.tickAudio.pause();
      audioState.current.tickAudio.src = '';
    }
    if (audioState.current.finishAudio) {
      audioState.current.finishAudio.pause();
      audioState.current.finishAudio.src = '';
    }
    audioState.current = {
      tickAudio: null,
      finishAudio: null,
      isInitialized: false
    };
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    playTickSound,
    playFinishSound,
    initializeAudio,
    cleanup
  };
};
