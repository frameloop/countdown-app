import { useState, useEffect } from 'react';

// Componente principal de la aplicación
const App = () => {
  // Estado de navegación
  const [currentPage, setCurrentPage] = useState<'landing' | 'home' | 'settings'>('landing');
  
  // Estado del temporizador
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(30);
  
  // Configuraciones
  const [settings, setSettings] = useState({
    soundsEnabled: true,
    vibrationEnabled: true,
    notificationsEnabled: true,
    theme: 'dark'
  });

  // Estado para la música de fondo
  const [backgroundMusic, setBackgroundMusic] = useState<HTMLAudioElement | null>(null);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  // Temas disponibles
  const themes = {
    dark: {
      bg: 'bg-[#0C0C0D]',
      text: 'text-[#EDEDED]',
      card: 'bg-[#0E0E10]',
      border: 'border-white/10'
    },
    blue: {
      bg: 'bg-[#0A0A2E]',
      text: 'text-[#E0E6FF]',
      card: 'bg-[#16213E]',
      border: 'border-blue-500/20'
    },
    green: {
      bg: 'bg-[#0A2E0A]',
      text: 'text-[#E0FFE0]',
      card: 'bg-[#162E16]',
      border: 'border-green-500/20'
    },
    purple: {
      bg: 'bg-[#2E0A2E]',
      text: 'text-[#FFE0FF]',
      card: 'bg-[#3E163E]',
      border: 'border-purple-500/20'
    }
  };

  const currentTheme = themes[settings.theme as keyof typeof themes];

  // Función para iniciar música de fondo
  const startBackgroundMusic = async () => {
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
    
    try {
      const audio = new Audio('/background-music.mp3');
      audio.volume = isMusicMuted ? 0 : 0.15;
      audio.loop = true;
      await audio.play();
      setBackgroundMusic(audio);
      console.log('🎵 Música de fondo iniciada');
    } catch (error) {
      console.error('🎵 Error iniciando música:', error);
    }
  };

  // Función para detener música de fondo con fade out
  const stopBackgroundMusic = () => {
    if (backgroundMusic) {
      // Fade out suave durante 2 segundos
      const fadeOut = () => {
        const currentVolume = backgroundMusic.volume;
        if (currentVolume > 0.01) {
          backgroundMusic.volume = Math.max(0, currentVolume - 0.05);
          setTimeout(fadeOut, 100);
        } else {
          backgroundMusic.pause();
          backgroundMusic.currentTime = 0;
          backgroundMusic.volume = 0.15; // Restaurar volumen para próxima vez
        }
      };
      fadeOut();
    }
  };

  // Función para toggle mute
  const toggleMusicMute = () => {
    setIsMusicMuted(!isMusicMuted);
    if (backgroundMusic) {
      backgroundMusic.volume = !isMusicMuted ? 0 : 0.15;
    }
  };
  const [history, setHistory] = useState<Array<{
    id: string;
    duration: number;
    completedAt: Date;
    preset?: string;
  }>>([]);

  // Landing Page - Configuración inicial del tiempo
  const LandingPage = () => (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} p-4 flex flex-col items-center justify-center`}>
      <div className="max-w-md mx-auto">
               {/* Título */}
               <h1 className="text-3xl font-bold text-center mb-8">
                 CounterDown
               </h1>


        {/* Display odómetro */}
        <div className="mb-8">
          <div className={`relative rounded-3xl ${currentTheme.card} border ${currentTheme.border} shadow-[inset_0_2px_12px_rgba(0,0,0,.8)] p-8`}>
            <div className="flex items-center justify-center">
              <div className={`text-[min(12vw,120px)] font-mono ${currentTheme.text} leading-none tracking-tight`}>
                {formatTime(minutes * 60 + seconds)}
              </div>
            </div>
          </div>
        </div>

        {/* Presets atajos */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-center">Atajos</h2>
          <div className="flex gap-3 justify-center overflow-x-auto pb-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setMinutes(Math.floor(preset.value / 60));
                  setSeconds(preset.value % 60);
                }}
                className="flex-shrink-0 px-4 py-2 rounded-full border border-white/20 text-white/80 hover:border-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controles de tiempo */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-center">Duración</h2>
          <div className="flex gap-6 justify-center">
            {/* Minutos */}
            <div className="text-center">
              <div className="text-sm text-white/60 mb-2">Minutos</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMinutes(Math.max(0, minutes - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-white/20 flex items-center justify-center hover:border-white/40 transition-colors"
                >
                  -
                </button>
                <div className="text-2xl font-mono w-12 text-center">{minutes}</div>
                <button
                  onClick={() => setMinutes(Math.min(99, minutes + 1))}
                  className="w-10 h-10 rounded-lg border-2 border-white/20 flex items-center justify-center hover:border-white/40 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Segundos */}
            <div className="text-center">
              <div className="text-sm text-white/60 mb-2">Segundos</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSeconds(Math.max(0, seconds - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-white/20 flex items-center justify-center hover:border-white/40 transition-colors"
                >
                  -
                </button>
                <div className="text-2xl font-mono w-12 text-center">{seconds}</div>
                <button
                  onClick={() => setSeconds(Math.min(59, seconds + 1))}
                  className="w-10 h-10 rounded-lg border-2 border-white/20 flex items-center justify-center hover:border-white/40 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botón para continuar */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              setTimeLeft(minutes * 60 + seconds);
              setCurrentPage('home');
            }}
            className="px-8 py-4 rounded-2xl font-semibold text-lg bg-white text-black hover:bg-white/90 transition-all duration-200"
          >
            Iniciar
          </button>
        </div>
      </div>
    </div>
  );

         // Home Page - Solo el contador
         const HomePage = () => (
           <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} p-4 flex flex-col`}>
             {/* Header con botón de configuración */}
             <div className="flex justify-between items-center mb-8">
               <button
                 onClick={() => setCurrentPage('landing')}
                 className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
               >
                 <span className="font-bold">←</span> Volver
               </button>
               
               <div className="flex items-center gap-4">
                 <button
                   onClick={toggleMusicMute}
                   className={`flex items-center gap-2 transition-colors ${
                     isMusicMuted ? 'text-red-400 hover:text-red-300' : 'text-white/60 hover:text-white'
                   }`}
                 >
                   {isMusicMuted ? '🔇' : '🔊'}
                 </button>
                 
                 <button
                   onClick={() => setCurrentPage('settings')}
                   className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                 >
                   ⚙️
                 </button>
               </div>
             </div>

             {/* Contenido centrado */}
             <div className="flex-1 flex flex-col items-center justify-center">
               {/* Display odómetro principal */}
               <div className="mb-8">
                 <div className={`relative rounded-3xl ${currentTheme.card} border ${currentTheme.border} shadow-[inset_0_2px_12px_rgba(0,0,0,.8)] p-8`}>
                   <div className="flex items-center justify-center">
                     <div className={`font-mono ${currentTheme.text} leading-none tracking-tight ${
                       Math.floor(timeLeft / 60) > 0 
                         ? 'text-[min(12vw,160px)]' // Tamaño normal cuando hay minutos
                         : 'text-[min(18vw,240px)]' // Tamaño más grande cuando solo hay segundos
                     }`}>
                       {formatTime(timeLeft)}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Controles principales */}
               <div className="flex gap-4 justify-center mb-8">
                 <button
                   onClick={toggleTimer}
                   className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                     isRunning 
                       ? 'bg-red-600 hover:bg-red-700 text-white' 
                       : 'bg-white text-black hover:bg-white/90'
                   }`}
                 >
                   {isRunning ? 'Pausar' : 'Iniciar'}
                 </button>

                 <button
                   onClick={resetTimer}
                   className="px-6 py-4 rounded-2xl border border-white/20 text-white hover:border-white/40 hover:bg-white/10 transition-all duration-200"
                 >
                   Reset
                 </button>
               </div>

               {/* Estado */}
               <div className="text-center text-sm text-white/60">
                 {isRunning ? 'Ejecutando' : 'Listo'} • Tiempo configurado: {formatTime(minutes * 60 + seconds)}
               </div>
             </div>
           </div>
         );

  // Settings Page - Configuraciones avanzadas
  const SettingsPage = () => (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} p-4`}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            ← Volver
          </button>
          
          <h1 className="text-xl font-bold">Configuración</h1>
        </div>

        {/* Configuraciones */}
        <div className="space-y-6">
          {/* Toggle de sonidos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔊</span>
              <div>
                <div className="font-medium">Sonidos</div>
                <div className="text-sm text-white/60">Pitido al finalizar</div>
              </div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, soundsEnabled: !prev.soundsEnabled }))}
              className={`w-12 h-6 rounded-full border-2 transition-colors duration-200 ${
                settings.soundsEnabled 
                  ? 'bg-white border-white' 
                  : 'bg-transparent border-white/40'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-black transition-transform duration-200 ${
                settings.soundsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Toggle de vibración */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📳</span>
              <div>
                <div className="font-medium">Vibración</div>
                <div className="text-sm text-white/60">Pulso al finalizar</div>
              </div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }))}
              className={`w-12 h-6 rounded-full border-2 transition-colors duration-200 ${
                settings.vibrationEnabled 
                  ? 'bg-white border-white' 
                  : 'bg-transparent border-white/40'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-black transition-transform duration-200 ${
                settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Toggle de notificaciones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <div className="font-medium">Notificaciones</div>
                <div className="text-sm text-white/60">Aviso al finalizar</div>
              </div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}
              className={`w-12 h-6 rounded-full border-2 transition-colors duration-200 ${
                settings.notificationsEnabled 
                  ? 'bg-white border-white' 
                  : 'bg-transparent border-white/40'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-black transition-transform duration-200 ${
                settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Selector de tema */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <div className="font-medium">Tema</div>
                <div className="text-sm text-white/60">Color de la interfaz</div>
              </div>
            </div>
            <div className="flex gap-2">
              {Object.keys(themes).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => setSettings(prev => ({ ...prev, theme: themeKey }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    settings.theme === themeKey 
                      ? 'border-white scale-110' 
                      : 'border-white/40 hover:border-white/60'
                  }`}
                  style={{
                    backgroundColor: themeKey === 'dark' ? '#0C0C0D' :
                                   themeKey === 'blue' ? '#0A0A2E' :
                                   themeKey === 'green' ? '#0A2E0A' :
                                   '#2E0A2E'
                  }}
                  title={themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Historial */}
        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Historial</h2>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {history.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⏱️</span>
                    <div>
                      <div className="font-mono">{formatTime(entry.duration)}</div>
                      <div className="text-xs text-white/60">
                        {entry.completedAt.toLocaleTimeString()}
                        {entry.preset && ` • ${entry.preset}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Presets rápidos
  const presets = [
    { label: '10s', value: 10 },
    { label: '20s', value: 20 },
    { label: '40s', value: 40 },
    { label: '50s', value: 50 }
  ];

  // Función para formatear tiempo
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para reproducir sonido de tick (cada segundo)
  const playTickSound = () => {
    if (!settings.soundsEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pitido corto y agudo
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('No se pudo reproducir el sonido de tick:', error);
    }
  };

  // Función para reproducir sonido de finalización
  const playFinishSound = () => {
    if (!settings.soundsEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pitido largo de finalización
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.0);
    } catch (error) {
      console.warn('No se pudo reproducir el sonido de finalización:', error);
    }
  };

  // Función para vibrar
  const vibrate = () => {
    if (!settings.vibrationEnabled || !('vibrate' in navigator)) return;
    
    try {
      // Patrón de vibración: corto-largo-corto
      navigator.vibrate([200, 100, 300, 100, 200]);
    } catch (error) {
      console.warn('No se pudo activar la vibración:', error);
    }
  };

  // Función para mostrar notificación
  const showNotification = () => {
    if (!settings.notificationsEnabled) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('¡Tiempo terminado!', {
        body: `El temporizador de ${formatTime(minutes * 60 + seconds)} ha finalizado`,
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: 'timer-finished'
      });
    }
  };

  // Función para solicitar permisos
  const requestPermissions = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Función para manejar preset (no se usa actualmente)
  // const handlePreset = (value: number) => {
  //   setTimeLeft(value);
  //   setMinutes(Math.floor(value / 60));
  //   setSeconds(value % 60);
  //   setIsRunning(false);
  // };

  // Función para iniciar/pausar
  const toggleTimer = async () => {
    if (isRunning) {
      setIsRunning(false);
      stopBackgroundMusic();
    } else {
      setIsRunning(true);
      await startBackgroundMusic();
    }
  };

  // Función para resetear
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(minutes * 60 + seconds);
  };

  // Efecto para el countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Ejecutar alertas cuando termine
            playFinishSound(); // Sonido largo de finalización
            vibrate();
            showNotification();
            stopBackgroundMusic(); // Fade out de la música de fondo
            
            // Agregar al historial
            const newEntry = {
              id: Date.now().toString(),
              duration: minutes * 60 + seconds,
              completedAt: new Date(),
              preset: presets.find(p => p.value === minutes * 60 + seconds)?.label
            };
            setHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Mantener solo 10 entradas
            
            return 0;
          }
          
          // Reproducir tick cada segundo (excepto en el último segundo)
          if (prev > 1) {
            playTickSound();
          }
          
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, minutes, seconds, settings, presets]);

  // Cargar configuración guardada al montar
  useEffect(() => {
    const savedSettings = localStorage.getItem('timer-settings');
    const savedHistory = localStorage.getItem('timer-history');
    
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    
    // Solicitar permisos al cargar
    requestPermissions();
  }, []);

  // Guardar configuración cuando cambie
  useEffect(() => {
    localStorage.setItem('timer-settings', JSON.stringify(settings));
  }, [settings]);

  // Guardar historial cuando cambie
  useEffect(() => {
    localStorage.setItem('timer-history', JSON.stringify(history));
  }, [history]);

  // Renderizar página actual
  return (
    <>
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'settings' && <SettingsPage />}
    </>
  );
};

export default App;
