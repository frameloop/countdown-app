/**
 * Tipos TypeScript para la aplicación de configuración de tiempo
 */

/**
 * Preset de tiempo con metadatos
 */
export interface Preset {
  id: string;
  emoji: string;
  label: string;
  seconds: number;
}

/**
 * Preset personalizado guardado por el usuario
 */
export interface CustomPreset extends Preset {
  isCustom: true;
  createdAt: number;
  usageCount: number;
}

/**
 * Configuración de la aplicación
 */
export interface AppSettings {
  soundsEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  lastUsedTime: number;
}

/**
 * Estado del permiso de notificaciones
 */
export type NotificationPermission = 'default' | 'granted' | 'denied';

/**
 * Estado del componente de tiempo
 */
export interface TimeState {
  totalSeconds: number;
  minutes: number;
  seconds: number;
}

/**
 * Acciones del reducer de tiempo
 */
export type TimeAction = 
  | { type: 'SET_TOTAL_SECONDS'; payload: number }
  | { type: 'SET_MINUTES'; payload: number }
  | { type: 'SET_SECONDS'; payload: number }
  | { type: 'INCREMENT_MINUTES'; payload: number }
  | { type: 'INCREMENT_SECONDS'; payload: number }
  | { type: 'RESET' };

/**
 * Props del componente TimeDisplay
 */
export interface TimeDisplayProps {
  totalSeconds: number;
  className?: string;
}

/**
 * Props del componente PresetChip
 */
export interface PresetChipProps {
  preset: Preset;
  isSelected: boolean;
  onSelect: (preset: Preset) => void;
  className?: string;
}

/**
 * Props del componente Stepper
 */
export interface StepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  onIncrement: () => void;
  onDecrement: () => void;
  onLongPress?: (increment: boolean) => void;
  className?: string;
}

/**
 * Props del componente ToggleRow
 */
export interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  icon?: string;
  className?: string;
}

/**
 * Props del componente KeypadModal
 */
export interface KeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (seconds: number) => void;
  initialValue: number;
}

/**
 * Props del componente PresetGridModal
 */
export interface PresetGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (preset: Preset) => void;
  customPresets: CustomPreset[];
  onDeleteCustom: (id: string) => void;
}

/**
 * Props del componente StickyCTA
 */
export interface StickyCTAProps {
  onStart: (totalSeconds: number) => void;
  onPreview: () => void;
  totalSeconds: number;
  disabled?: boolean;
}

/**
 * Props de la página TimeSetup
 */
export interface TimeSetupProps {
  onStart: (totalSeconds: number, settings: AppSettings) => void;
}
