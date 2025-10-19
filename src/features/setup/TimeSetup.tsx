/**
 * Página TimeSetup - Página principal de configuración de tiempo
 * 
 * Características:
 * - Display odómetro inteligente (ss/mm:ss)
 * - Presets rápidos con scroll horizontal
 * - Steppers para minutos y segundos
 * - Toggles para sonidos, vibración y notificaciones
 * - Modales para keypad y grid de presets
 * - CTA pegajoso con previsualización
 * - Persistencia en localStorage
 * - Accesibilidad completa
 */

import { useReducer, useState, useEffect, useCallback, FC } from 'react';
import { motion } from 'framer-motion';
import { TimeSetupProps, TimeState, TimeAction, AppSettings, CustomPreset, NotificationPermission } from '../../types';
import { DEFAULT_PRESETS, DEFAULT_SETTINGS } from '../../data/presets';
import { getStorageValue, setStorageValue } from '../../shared/utils/storage';
import { toMinutesAndSeconds, fromMinutesAndSeconds, normalizeSeconds } from '../../shared/utils/time';

// Componentes
import TimeDisplay from '../../shared/components/TimeDisplay';
import PresetChip from '../../shared/components/PresetChip';
import Stepper from '../../shared/components/Stepper';
import ToggleRow from '../../shared/components/ToggleRow';
import KeypadModal from '../../shared/components/KeypadModal';
import PresetGridModal from '../../shared/components/PresetGridModal';
import StickyCTA from '../../shared/components/StickyCTA';

// Reducer para manejo de estado del tiempo
const timeReducer = (state: TimeState, action: TimeAction): TimeState => {
  switch (action.type) {
    case 'SET_TOTAL_SECONDS':
      const normalized = normalizeSeconds(action.payload);
      const { minutes, seconds } = toMinutesAndSeconds(normalized);
      return { totalSeconds: normalized, minutes, seconds };
    
    case 'SET_MINUTES':
      const newTotalFromMinutes = fromMinutesAndSeconds(action.payload, state.seconds);
      return {
        totalSeconds: newTotalFromMinutes,
        minutes: action.payload,
        seconds: state.seconds
      };
    
    case 'SET_SECONDS':
      const newTotalFromSeconds = fromMinutesAndSeconds(state.minutes, action.payload);
      return {
        totalSeconds: newTotalFromSeconds,
        minutes: state.minutes,
        seconds: action.payload
      };
    
    case 'INCREMENT_MINUTES':
      return {
        ...state,
        totalSeconds: normalizeSeconds(state.totalSeconds + action.payload * 60),
        minutes: Math.min(99, state.minutes + action.payload)
      };
    
    case 'INCREMENT_SECONDS':
      return {
        ...state,
        totalSeconds: normalizeSeconds(state.totalSeconds + action.payload),
        seconds: Math.min(59, state.seconds + action.payload)
      };
    
    case 'RESET':
      return { totalSeconds: 30, minutes: 0, seconds: 30 };
    
    default:
      return state;
  }
};

const TimeSetup: FC<TimeSetupProps> = ({ onStart }) => {
  // Estado del tiempo
  const [timeState, dispatch] = useReducer(timeReducer, {
    totalSeconds: 30,
    minutes: 0,
    seconds: 30
  });

  // Estado de la aplicación
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Estado de modales
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [isPresetGridOpen, setIsPresetGridOpen] = useState(false);

  // Cargar configuración guardada al montar
  useEffect(() => {
    const savedSettings = getStorageValue('settings', DEFAULT_SETTINGS);
    const savedCustomPresets = getStorageValue('customPresets', []);
    const savedTime = getStorageValue('lastTime', 30);
    
    setSettings(savedSettings);
    setCustomPresets(savedCustomPresets);
    dispatch({ type: 'SET_TOTAL_SECONDS', payload: savedTime });

    // Verificar permiso de notificaciones
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Guardar configuración cuando cambie
  useEffect(() => {
    setStorageValue('settings', settings);
  }, [settings]);

  useEffect(() => {
    setStorageValue('customPresets', customPresets);
  }, [customPresets]);

  useEffect(() => {
    setStorageValue('lastTime', timeState.totalSeconds);
  }, [timeState.totalSeconds]);

  // Manejar selección de preset
  const handlePresetSelect = useCallback((preset: typeof DEFAULT_PRESETS[0] | CustomPreset) => {
    dispatch({ type: 'SET_TOTAL_SECONDS', payload: preset.seconds });
    setSelectedPreset(preset.id);
  }, []);

  // Manejar cambios en steppers
  const handleMinutesChange = useCallback((increment: boolean) => {
    dispatch({ 
      type: 'INCREMENT_MINUTES', 
      payload: increment ? 1 : -1 
    });
    setSelectedPreset(null);
  }, []);

  const handleSecondsChange = useCallback((increment: boolean) => {
    dispatch({ 
      type: 'INCREMENT_SECONDS', 
      payload: increment ? 1 : -1 
    });
    setSelectedPreset(null);
  }, []);

  // Manejar cambios en toggles
  const handleSoundsToggle = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, soundsEnabled: enabled }));
  }, []);

  const handleVibrationToggle = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, vibrationEnabled: enabled }));
  }, []);

  const handleNotificationsToggle = useCallback(async (enabled: boolean) => {
    if (enabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
    
    setSettings(prev => ({ ...prev, notificationsEnabled: enabled }));
  }, []);

  // Manejar keypad
  const handleKeypadConfirm = useCallback((seconds: number) => {
    dispatch({ type: 'SET_TOTAL_SECONDS', payload: seconds });
    setSelectedPreset(null);
    setIsKeypadOpen(false);
  }, []);

  // Manejar inicio del temporizador
  const handleStart = useCallback((totalSeconds: number) => {
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('timer:start', { 
      detail: { totalSeconds, settings } 
    }));
    
    // Llamar callback con configuración completa
    onStart(totalSeconds, settings);
  }, [onStart, settings]);

  // Manejar previsualización
  const handlePreview = useCallback(() => {
    // Aquí se podría implementar lógica de previsualización
    console.log('Previsualizando countdown...');
  }, []);

  // Obtener estado del permiso de notificaciones
  const getNotificationStatus = () => {
    switch (notificationPermission) {
      case 'granted': return 'Concedido';
      case 'denied': return 'Denegado';
      default: return 'Pendiente';
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#EDEDED] overflow-x-hidden">
      {/* Contenido principal */}
      <div className="max-w-md mx-auto px-4 py-6 pb-32">
        {/* Título */}
        <motion.h1
          className="text-2xl font-bold text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Configura tu cuenta atrás
        </motion.h1>

        {/* Display odómetro */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <TimeDisplay totalSeconds={timeState.totalSeconds} />
        </motion.div>

        {/* Presets rápidos */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Rápidos</h2>
            <button
              className="text-sm text-white/60 hover:text-white transition-colors"
              onClick={() => setIsPresetGridOpen(true)}
              aria-label="Ver todos los presets"
            >
              Ver todos
            </button>
          </div>

          {/* Scroll horizontal de presets */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {DEFAULT_PRESETS.slice(0, 4).map((preset) => (
              <PresetChip
                key={preset.id}
                preset={preset}
                isSelected={selectedPreset === preset.id}
                onSelect={handlePresetSelect}
                className="flex-shrink-0"
              />
            ))}
          </div>
        </motion.section>

        {/* Selector de tiempo */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold mb-4">Duración</h2>
          
          <div className="flex gap-6 justify-center">
            {/* Stepper de minutos */}
            <Stepper
              value={timeState.minutes}
              min={0}
              max={99}
              step={1}
              label="Minutos"
              onIncrement={() => handleMinutesChange(true)}
              onDecrement={() => handleMinutesChange(false)}
            />

            {/* Stepper de segundos */}
            <Stepper
              value={timeState.seconds}
              min={0}
              max={59}
              step={1}
              label="Segundos"
              onIncrement={() => handleSecondsChange(true)}
              onDecrement={() => handleSecondsChange(false)}
            />
          </div>

          {/* Botón teclado numérico */}
          <div className="mt-4 text-center">
            <button
              className="
                px-4 py-2 rounded-lg border border-white/20 text-white/80
                hover:border-white/40 hover:text-white hover:bg-white/10
                transition-all duration-200 text-sm
              "
              onClick={() => setIsKeypadOpen(true)}
              aria-label="Abrir teclado numérico"
            >
              ⌨️ Teclado numérico
            </button>
          </div>
        </motion.section>

        {/* Configuraciones */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold mb-4">Configuraciones</h2>
          
          <div className="space-y-3">
            {/* Toggle de sonidos */}
            <ToggleRow
              label="Sonidos"
              description="Pitido al final y clics de rueda"
              enabled={settings.soundsEnabled}
              onChange={handleSoundsToggle}
              icon="🔊"
            />

            {/* Toggle de vibración */}
            <ToggleRow
              label="Vibración"
              description="Pulso al terminar"
              enabled={settings.vibrationEnabled}
              onChange={handleVibrationToggle}
              icon="📳"
            />

            {/* Toggle de notificaciones */}
            <ToggleRow
              label="Notificaciones"
              description={`Avísame si salgo de la app (${getNotificationStatus()})`}
              enabled={settings.notificationsEnabled}
              onChange={handleNotificationsToggle}
              icon="🔔"
            />
          </div>
        </motion.section>
      </div>

      {/* CTA pegajoso */}
      <StickyCTA
        onStart={handleStart}
        onPreview={handlePreview}
        totalSeconds={timeState.totalSeconds}
        disabled={timeState.totalSeconds === 0}
      />

      {/* Modales */}
      <KeypadModal
        isOpen={isKeypadOpen}
        onClose={() => setIsKeypadOpen(false)}
        onConfirm={handleKeypadConfirm}
        initialValue={timeState.totalSeconds}
      />

      <PresetGridModal
        isOpen={isPresetGridOpen}
        onClose={() => setIsPresetGridOpen(false)}
        onSelect={handlePresetSelect}
        customPresets={customPresets}
        onDeleteCustom={(id) => {
          setCustomPresets(prev => prev.filter(p => p.id !== id));
        }}
      />
    </div>
  );
};

export default TimeSetup;
