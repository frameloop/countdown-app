/**
 * Datos de presets por defecto y configuración de la aplicación
 */

import type { Preset } from '../types';

/**
 * Presets por defecto de la aplicación
 * Incluye emojis, etiquetas y duraciones en segundos
 */
export const DEFAULT_PRESETS: Preset[] = [
  { id: 'fast30', emoji: '⏱️', label: 'Rápido', seconds: 30 },
  { id: 'pom1', emoji: '🍅', label: 'Pomodoro', seconds: 60 },
  { id: 'rest2', emoji: '☕', label: 'Descanso', seconds: 120 },
  { id: 'fit5', emoji: '🏃', label: 'Ejercicio', seconds: 300 },
  { id: 'study10', emoji: '📚', label: 'Estudio', seconds: 600 },
  { id: 'med15', emoji: '🧘', label: 'Meditación', seconds: 900 },
  { id: 'cook60', emoji: '🍳', label: 'Cocina', seconds: 3600 },
];

/**
 * Configuración por defecto de la aplicación
 */
export const DEFAULT_SETTINGS = {
  soundsEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
  lastUsedTime: 30, // 30 segundos por defecto
};

/**
 * Límites de tiempo para validación
 */
export const TIME_LIMITS = {
  MIN_SECONDS: 0,
  MAX_SECONDS: 99 * 60 + 59, // 99:59
  MAX_MINUTES: 99,
  MAX_SECONDS_IN_MINUTE: 59,
} as const;

/**
 * Configuración de accesibilidad
 */
export const ACCESSIBILITY = {
  MIN_TOUCH_TARGET: 44, // 44px mínimo para área táctil
  FOCUS_VISIBLE: true,
  ARIA_LIVE_POLITE: 'polite',
} as const;
