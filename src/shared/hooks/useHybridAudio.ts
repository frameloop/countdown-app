import { useCallback, useRef, useEffect, useState } from 'react';

interface HybridAudioState {
  // HTML5 Audio elements
  tickAudio: HTMLAudioElement | null;
  finishAudio: HTMLAudioElement | null;
  
  // Web Audio API fallback
  audioContext: AudioContext | null;
  isInitialized: boolean;
  
  // Audio loss detection
  lastPlayTime: number;
  audioLost: boolean;
}

export const useHybridAudio = () => {
  const audioState = useRef<HybridAudioState>({
    tickAudio: null,
    finishAudio: null,
    audioContext: null,
    isInitialized: false,
    lastPlayTime: 0,
    audioLost: false
  });

  const [audioLost, setAudioLost] = useState(false);

  // Detectar si es un dispositivo móvil
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }, []);

  // Crear sonidos usando Web Audio API
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

  // Inicializar audio híbrido
  const initializeAudio = useCallback(async () => {
    if (audioState.current.isInitialized) return true;

    try {
      // 1. Crear archivos HTML5 Audio
      const tickData = createAudioData(1000, 0.1, 0.1);
      const finishData = createAudioData(800, 0.5, 0.3);

      const tickUrl = URL.createObjectURL(tickData);
      const finishUrl = URL.createObjectURL(finishData);

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

      // 2. Crear Web Audio API como fallback
      let audioContext: AudioContext | null = null;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
        if (isMobile() && audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      } catch (error) {
        console.warn('Web Audio API no disponible:', error);
      }

      audioState.current = {
        tickAudio,
        finishAudio,
        audioContext,
        isInitialized: true,
        lastPlayTime: 0,
        audioLost: false
      };

      return true;
    } catch (error) {
      console.warn('Error inicializando audio híbrido:', error);
      return false;
    }
  }, [createAudioData, isMobile]);

  // Detectar pérdida de audio
  const detectAudioLoss = useCallback(() => {
    const now = Date.now();
    const timeSinceLastPlay = now - audioState.current.lastPlayTime;
    
    // Si han pasado más de 2 segundos sin reproducción, considerar audio perdido
    if (timeSinceLastPlay > 2000 && audioState.current.lastPlayTime > 0) {
      if (!audioState.current.audioLost) {
        audioState.current.audioLost = true;
        setAudioLost(true);
        console.warn('Audio perdido detectado');
      }
    }
  }, []);

  // Reproducir sonido de tick con múltiples estrategias
  const playTickSound = useCallback(async () => {
    if (!audioState.current.isInitialized) {
      await initializeAudio();
    }

    const now = Date.now();
    audioState.current.lastPlayTime = now;
    audioState.current.audioLost = false;
    setAudioLost(false);

    // Estrategia 1: HTML5 Audio
    if (audioState.current.tickAudio) {
      try {
        audioState.current.tickAudio.currentTime = 0;
        await audioState.current.tickAudio.play();
        return; // Si funciona, no usar fallback
      } catch (error) {
        console.warn('HTML5 Audio falló:', error);
      }
    }

    // Estrategia 2: Web Audio API fallback
    if (audioState.current.audioContext) {
      try {
        if (audioState.current.audioContext.state === 'suspended') {
          await audioState.current.audioContext.resume();
        }
        
        const oscillator = audioState.current.audioContext.createOscillator();
        const gainNode = audioState.current.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioState.current.audioContext.destination);
        
        const volume = isMobile() ? 0.2 : 0.1;
        oscillator.frequency.setValueAtTime(1000, audioState.current.audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, audioState.current.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioState.current.audioContext.currentTime + 0.1);
        
        oscillator.start(audioState.current.audioContext.currentTime);
        oscillator.stop(audioState.current.audioContext.currentTime + 0.1);
      } catch (error) {
        console.warn('Web Audio API fallback falló:', error);
      }
    }
  }, [initializeAudio, isMobile]);

  // Reproducir sonido de finalización
  const playFinishSound = useCallback(async () => {
    if (!audioState.current.isInitialized) {
      await initializeAudio();
    }

    // Estrategia 1: HTML5 Audio
    if (audioState.current.finishAudio) {
      try {
        audioState.current.finishAudio.currentTime = 0;
        await audioState.current.finishAudio.play();
        return;
      } catch (error) {
        console.warn('HTML5 Audio finish falló:', error);
      }
    }

    // Estrategia 2: Web Audio API fallback
    if (audioState.current.audioContext) {
      try {
        if (audioState.current.audioContext.state === 'suspended') {
          await audioState.current.audioContext.resume();
        }
        
        const oscillator = audioState.current.audioContext.createOscillator();
        const gainNode = audioState.current.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioState.current.audioContext.destination);
        
        const volume = isMobile() ? 0.5 : 0.3;
        oscillator.frequency.setValueAtTime(800, audioState.current.audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, audioState.current.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioState.current.audioContext.currentTime + 0.5);
        
        oscillator.start(audioState.current.audioContext.currentTime);
        oscillator.stop(audioState.current.audioContext.currentTime + 0.5);
      } catch (error) {
        console.warn('Web Audio API finish falló:', error);
      }
    }
  }, [initializeAudio, isMobile]);

  // Reactivar audio manualmente
  const reactivateAudio = useCallback(async () => {
    if (audioState.current.audioContext && audioState.current.audioContext.state === 'suspended') {
      try {
        await audioState.current.audioContext.resume();
        audioState.current.audioLost = false;
        setAudioLost(false);
        console.log('Audio reactivado');
      } catch (error) {
        console.warn('Error reactivando audio:', error);
      }
    }
  }, []);

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
    if (audioState.current.audioContext) {
      audioState.current.audioContext.close();
    }
    audioState.current = {
      tickAudio: null,
      finishAudio: null,
      audioContext: null,
      isInitialized: false,
      lastPlayTime: 0,
      audioLost: false
    };
    setAudioLost(false);
  }, []);

  // Detectar pérdida de audio periódicamente
  useEffect(() => {
    const interval = setInterval(detectAudioLoss, 1000);
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
    audioLost,
    cleanup
  };
};
