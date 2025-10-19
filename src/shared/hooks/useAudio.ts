import { useCallback, useRef, useEffect } from 'react';

interface AudioContextState {
  context: AudioContext | null;
  isInitialized: boolean;
  isSuspended: boolean;
}

export const useAudio = () => {
  const audioState = useRef<AudioContextState>({
    context: null,
    isInitialized: false,
    isSuspended: false
  });

  // Detectar si es un dispositivo móvil
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }, []);

  // Inicializar AudioContext con interacción del usuario
  const initializeAudio = useCallback(async () => {
    if (audioState.current.isInitialized && audioState.current.context) {
      return audioState.current.context;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass();
      
      // En móviles, necesitamos activar el contexto con interacción del usuario
      if (isMobile() && context.state === 'suspended') {
        await context.resume();
      }
      
      audioState.current = {
        context,
        isInitialized: true,
        isSuspended: false
      };
      
      return context;
    } catch (error) {
      console.warn('Error inicializando AudioContext:', error);
      return null;
    }
  }, [isMobile]);

  // Mantener el contexto activo
  const keepContextAlive = useCallback(async () => {
    if (!audioState.current.context) return;
    
    if (audioState.current.context.state === 'suspended') {
      try {
        await audioState.current.context.resume();
        audioState.current.isSuspended = false;
        console.log('AudioContext resumido');
      } catch (error) {
        console.warn('Error resumiendo AudioContext:', error);
      }
    }
  }, []);

  // Función para mantener el contexto activo periódicamente
  const startKeepAlive = useCallback(() => {
    if (!isMobile()) return;
    
    const keepAliveInterval = setInterval(async () => {
      if (audioState.current.context && audioState.current.context.state === 'suspended') {
        try {
          await audioState.current.context.resume();
          console.log('AudioContext mantenido activo');
        } catch (error) {
          console.warn('Error manteniendo AudioContext activo:', error);
        }
      }
    }, 2000); // Cada 2 segundos

    return keepAliveInterval;
  }, [isMobile]);

  // Reproducir sonido silencioso para mantener contexto activo
  const playSilentSound = useCallback(async () => {
    const context = await initializeAudio();
    if (!context) return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Sonido muy silencioso
      oscillator.frequency.setValueAtTime(1000, context.currentTime);
      gainNode.gain.setValueAtTime(0.001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.01);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.01);
    } catch (error) {
      // Silenciar errores del sonido silencioso
    }
  }, [initializeAudio]);

  // Reproducir sonido de tick
  const playTickSound = useCallback(async () => {
    const context = await initializeAudio();
    if (!context) return;

    try {
      // Mantener el contexto activo
      await keepContextAlive();
      
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Configuración del sonido - más fuerte en móviles
      const volume = isMobile() ? 0.2 : 0.1;
      oscillator.frequency.setValueAtTime(1000, context.currentTime);
      gainNode.gain.setValueAtTime(volume, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1);
    } catch (error) {
      console.warn('Error reproduciendo tick sound:', error);
    }
  }, [initializeAudio, keepContextAlive, isMobile]);

  // Reproducir sonido de finalización
  const playFinishSound = useCallback(async () => {
    const context = await initializeAudio();
    if (!context) return;

    try {
      // Mantener el contexto activo
      await keepContextAlive();
      
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Configuración del sonido de finalización - más fuerte en móviles
      const volume = isMobile() ? 0.5 : 0.3;
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      gainNode.gain.setValueAtTime(volume, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
    } catch (error) {
      console.warn('Error reproduciendo finish sound:', error);
    }
  }, [initializeAudio, keepContextAlive, isMobile]);

  // Limpiar recursos
  const cleanup = useCallback(() => {
    if (audioState.current.context) {
      audioState.current.context.close();
      audioState.current = {
        context: null,
        isInitialized: false,
        isSuspended: false
      };
    }
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    playTickSound,
    playFinishSound,
    initializeAudio,
    keepContextAlive,
    startKeepAlive,
    playSilentSound,
    cleanup
  };
};
