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
import { AppSettings } from '../../types';
import { formatTime } from '../../shared/utils/time';

interface CountdownPageProps {
  totalSeconds: number;
  settings: AppSettings;
  onBack: () => void;
  onRestart: () => void;
}

const CountdownPage: React.FC<CountdownPageProps> = ({
  totalSeconds,
  settings,
  onBack,
  onRestart
}) => {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

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
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Efecto para cuando termina el temporizador
  useEffect(() => {
    if (isFinished) {
      // Sonido de finalización
      if (settings.soundsEnabled) {
        // Crear un beep simple
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }

      // Vibración
      if (settings.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Notificación
      if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('¡Tiempo terminado!', {
          body: 'El temporizador ha finalizado',
          icon: '/vite.svg'
        });
      }
    }
  }, [isFinished, settings]);

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
