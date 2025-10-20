import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  volume: number; // 0-100
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
  className?: string;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({
  volume,
  onVolumeChange,
  isPlaying,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastVolume, setLastVolume] = useState(50);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cerrar popup al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isOpen &&
        popupRef.current &&
        buttonRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Toggle mute rápido
  const handleToggleMute = () => {
    if (volume === 0) {
      onVolumeChange(lastVolume);
    } else {
      setLastVolume(volume);
      onVolumeChange(0);
    }
  };

  // Abrir popup
  const handleOpenPopup = () => {
    setIsOpen(true);
  };

  // Cambiar volumen con slider
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    onVolumeChange(newVolume);
  };

  // Botones de volumen rápido
  const quickVolumes = [0, 25, 50, 75, 100];
  const handleQuickVolume = (vol: number) => {
    onVolumeChange(vol);
    if (vol > 0) {
      setLastVolume(vol);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón de volumen */}
      <button
        ref={buttonRef}
        onClick={handleToggleMute}
        onContextMenu={(e) => {
          e.preventDefault();
          handleOpenPopup();
        }}
        className={`flex items-center gap-2 transition-colors ${
          volume === 0 ? 'text-red-400 hover:text-red-300' : 'text-white/60 hover:text-white'
        }`}
        title="Clic: silenciar/activar | Clic derecho: control de volumen"
      >
        {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Popup de control de volumen */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 z-50"
          >
            <div className="bg-black/95 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl min-w-[280px]">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {volume === 0 ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-white" />}
                  <span className="text-white font-medium">Volumen</span>
                </div>
                <div className="text-white/60 text-sm">
                  {volume}%
                </div>
              </div>

              {/* Slider horizontal */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={volume}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, rgba(255,255,255,0.2) ${volume}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>

              {/* Botones de volumen rápido */}
              <div className="flex justify-between gap-2">
                {quickVolumes.map((vol) => (
                  <button
                    key={vol}
                    onClick={() => handleQuickVolume(vol)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      volume === vol
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {vol === 0 ? 'Mute' : `${vol}%`}
                  </button>
                ))}
              </div>

              {/* Estado de reproducción */}
              <div className="mt-3 text-center">
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                  volume === 0 
                    ? 'bg-red-500/20 text-red-400' 
                    : isPlaying 
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {volume === 0 ? 'Silenciado' : isPlaying ? 'Reproduciendo' : 'Pausado'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default VolumeSlider;