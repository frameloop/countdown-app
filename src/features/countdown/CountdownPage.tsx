/**
 * Página CountdownPage - Página del temporizador en funcionamiento
 * 
 * Características:
 * - Display odómetro grande con tiempo restante
 * - Controles de pausa/reanudar
 * - Botón para volver al setup
 * - Notificaciones y sonidos según configuración
 * - Vibración al finalizar
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppSettings } from '../../types';
import { formatTime } from '../../shared/utils/time';
import { useAudioPool } from '../../shared/hooks/useAudioPool';

interface CountdownPageProps {
  totalSeconds: number;
  settings: AppSettings;
  onBack: () => void;
  // onRestart: () => void; // No se usa actualmente
}

const CountdownPage: React.FC<CountdownPageProps> = ({
  totalSeconds,
  settings,
  onBack
  // onRestart // No se usa actualmente
}) => {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Hook personalizado para manejo de audio con pool
  const { playTickSound, playFinishSound, initializeAudio, reactivateAudio, audioLost } = useAudioPool();

  // Inicializar audio cuando el usuario interactúe
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (settings.soundsEnabled) {
        await initializeAudio();
        setAudioInitialized(true);
      }
    };

    // Agregar listeners para interacción del usuario
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [settings.soundsEnabled, initializeAudio]);

  // Sistema de reactivación automática en tiempo real
  useEffect(() => {
    if (!isRunning || !settings.soundsEnabled) return;

    const handleTouch = async () => {
      if (audioLost) {
        await reactivateAudio();
      }
    };

    // Agregar listeners para reactivación automática
    document.addEventListener('touchstart', handleTouch);
    document.addEventListener('touchmove', handleTouch);
    document.addEventListener('touchend', handleTouch);
    document.addEventListener('click', handleTouch);

    return () => {
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('touchmove', handleTouch);
      document.removeEventListener('touchend', handleTouch);
      document.removeEventListener('click', handleTouch);
    };
  }, [isRunning, settings.soundsEnabled, audioLost, reactivateAudio]);

  // Precarga agresiva de audio
  useEffect(() => {
    if (settings.soundsEnabled && !audioInitialized) {
      const precacheAudio = async () => {
        await initializeAudio();
        setAudioInitialized(true);
        
        // Precargar reproduciendo sonidos silenciosos
        try {
          await playTickSound();
          await playTickSound();
        } catch (error) {
          console.warn('Error en precarga de audio:', error);
        }
      };
      
      precacheAudio();
    }
  }, [settings.soundsEnabled, audioInitialized, initializeAudio, playTickSound]);

  // Función para activar audio manualmente
  const handleActivateAudio = useCallback(async () => {
    if (settings.soundsEnabled) {
      await initializeAudio();
      setAudioInitialized(true);
    }
  }, [settings.soundsEnabled, initializeAudio]);

  // Efecto para el countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            return 0;
          }
          
          // Reproducir tick cada segundo (excepto en el último segundo)
          if (prev > 1 && settings.soundsEnabled) {
            playTickSound();
          }
          
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, playTickSound, settings.soundsEnabled]);

  // Efecto para cuando termina el temporizador
  useEffect(() => {
    if (isFinished) {
      // Sonido de finalización (pitido largo)
      if (settings.soundsEnabled) {
        playFinishSound();
      }

      // Vibración más larga
      if (settings.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }

      // Notificación
      if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('¡Tiempo terminado!', {
          body: 'El temporizador ha finalizado',
          icon: '/vite.svg'
        });
      }
    }
  }, [isFinished, settings, playFinishSound]);

  // Manejar inicio/pausa
  const handleToggle = useCallback(() => {
    if (isFinished) {
      // Reiniciar si ya terminó
      setTimeLeft(totalSeconds);
      setIsFinished(false);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
      setIsPaused(!isRunning);
    }
  }, [isRunning, isFinished, totalSeconds]);

  // Manejar reinicio
  const handleRestart = useCallback(() => {
    setTimeLeft(totalSeconds);
    setIsRunning(false);
    setIsPaused(false);
    setIsFinished(false);
  }, [totalSeconds]);

  // Manejar volver al setup
  const handleBack = useCallback(() => {
    setIsRunning(false);
    onBack();
  }, [onBack]);

  const displayTime = formatTime(timeLeft);
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#EDEDED] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          ← Volver al setup
        </button>
        
        <div className="text-sm text-white/40">
          {isRunning ? 'Ejecutando' : isPaused ? 'Pausado' : isFinished ? 'Terminado' : 'Listo'}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Display odómetro principal */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative rounded-3xl bg-[#0E0E10] border border-white/10 shadow-[inset_0_2px_12px_rgba(0,0,0,.8)] p-8">
            <div className="flex items-center justify-center gap-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayTime}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-1"
                >
                  {displayTime.split('').map((char, index) => {
                    if (char === ':') {
                      return (
                        <div
                          key={`colon-${index}`}
                          className="text-[min(15vw,200px)] font-mono text-[#EDEDED] leading-none tracking-tight mx-2"
                        >
                          :
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`digit-${index}-${char}`}
                        className="
                          relative rounded-xl bg-[#151517] border border-white/8 
                          shadow-[inset_0_-8px_16px_rgba(0,0,0,.65),inset_0_12px_24px_rgba(255,255,255,.03)]
                          w-[min(15vw,200px)] h-[min(15vw,200px)] flex items-center justify-center
                          overflow-hidden
                        "
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </div>
                        
                        <span className="text-[min(15vw,200px)] font-mono text-[#EDEDED] leading-none tracking-tight relative z-10">
                          {char}
                        </span>
                        
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Barra de progreso */}
        <div className="w-full max-w-md mb-8">
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-white rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-center text-sm text-white/60 mt-2">
            {Math.round(progress)}% completado
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <button
              onClick={handleToggle}
              className={`
                px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200
                ${isRunning 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : isFinished
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-white text-black hover:bg-white/90'
                }
              `}
            >
              {isFinished ? 'Reiniciar' : isRunning ? 'Pausar' : 'Iniciar'}
            </button>

            {!isRunning && !isFinished && (
              <button
                onClick={handleRestart}
                className="px-6 py-4 rounded-2xl border border-white/20 text-white hover:border-white/40 hover:bg-white/10 transition-all duration-200"
              >
                Reset
              </button>
            )}
          </div>

          {/* Botón de activación de audio para móviles */}
          {settings.soundsEnabled && !audioInitialized && (
            <button
              onClick={handleActivateAudio}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all duration-200"
            >
              🔊 Activar Sonidos
            </button>
          )}

          {/* Indicador de estado del audio */}
          {settings.soundsEnabled && (
            <div className="flex flex-col items-center gap-2">
              {audioLost ? (
                <>
                  <div className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm">
                    ⚠️ Audio perdido - Toca para reactivar
                  </div>
                  <button
                    onClick={reactivateAudio}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all duration-200"
                  >
                    🔄 Reactivar Audio
                  </button>
                </>
              ) : (
                <div className="px-4 py-2 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-sm">
                  🔊 Audio activo
                </div>
              )}
            </div>
          )}
        </div>

        {/* Estado del temporizador */}
        <div className="mt-8 text-center">
          <div className="text-sm text-white/60 mb-2">
            Tiempo total: {formatTime(totalSeconds)}
          </div>
          <div className="text-sm text-white/60">
            Tiempo restante: {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownPage;
