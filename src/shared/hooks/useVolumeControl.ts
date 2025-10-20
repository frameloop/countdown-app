import { useState, useEffect, useCallback } from 'react';

interface UseVolumeControlOptions {
  initialVolume?: number;
  storageKey?: string;
}

interface UseVolumeControlReturn {
  volume: number;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  lastVolume: number;
  restoreVolume: () => void;
}

export const useVolumeControl = ({
  initialVolume = 50,
  storageKey = 'music-volume'
}: UseVolumeControlOptions = {}): UseVolumeControlReturn => {
  const [volume, setVolumeState] = useState(initialVolume);
  const [lastVolume, setLastVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);

  // Cargar volumen guardado al inicializar
  useEffect(() => {
    const savedVolume = localStorage.getItem(storageKey);
    if (savedVolume !== null) {
      const parsedVolume = parseInt(savedVolume, 10);
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 100) {
        setVolumeState(parsedVolume);
        setLastVolume(parsedVolume);
      }
    }
  }, [storageKey]);

  // Guardar volumen en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(storageKey, volume.toString());
  }, [volume, storageKey]);

  // Función para establecer volumen
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clampedVolume);
    setIsMuted(clampedVolume === 0);
    
    // Si el volumen no es 0, actualizar el último volumen
    if (clampedVolume > 0) {
      setLastVolume(clampedVolume);
    }
  }, []);

  // Función para toggle mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      // Si está silenciado, restaurar último volumen
      setVolumeState(lastVolume);
      setIsMuted(false);
    } else {
      // Si está sonando, guardar volumen actual y silenciar
      setLastVolume(volume);
      setVolumeState(0);
      setIsMuted(true);
    }
  }, [isMuted, lastVolume, volume]);

  // Función para restaurar volumen
  const restoreVolume = useCallback(() => {
    setVolumeState(lastVolume);
    setIsMuted(false);
  }, [lastVolume]);

  return {
    volume,
    setVolume,
    isMuted,
    toggleMute,
    lastVolume,
    restoreVolume
  };
};
