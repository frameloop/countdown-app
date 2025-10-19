/**
 * Utilidades para manejo de tiempo en formato mm:ss
 * Proporciona funciones para parsear, formatear, normalizar y convertir tiempo
 */

/**
 * Convierte segundos a formato mm:ss o ss según la duración
 * @param seconds - Número de segundos
 * @returns String formateado (ej: "07" para <60s, "01:30" para >=60s)
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return seconds.toString().padStart(2, '0');
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Convierte formato mm:ss a segundos
 * @param timeString - String en formato "mm:ss" o "ss"
 * @returns Número de segundos
 */
export function parseTime(timeString: string): number {
  if (!timeString) return 0;
  
  const parts = timeString.split(':');
  
  if (parts.length === 1) {
    // Formato ss
    return Math.max(0, parseInt(parts[0], 10) || 0);
  }
  
  if (parts.length === 2) {
    // Formato mm:ss
    const minutes = Math.max(0, parseInt(parts[0], 10) || 0);
    const seconds = Math.max(0, parseInt(parts[1], 10) || 0);
    return minutes * 60 + seconds;
  }
  
  return 0;
}

/**
 * Parsea entrada de teclado numérico (mmss) a segundos
 * @param input - String numérico (ej: "90" → 1:30)
 * @returns Número de segundos
 */
export function parseKeypadInput(input: string): number {
  const num = parseInt(input, 10);
  if (isNaN(num) || num < 0) return 0;
  
  // Si es menor a 100, tratarlo como segundos
  if (num < 100) {
    return Math.min(num, 59); // Máximo 59 segundos
  }
  
  // Si es >= 100, tratarlo como mmss
  const minutes = Math.floor(num / 100);
  const seconds = num % 100;
  
  // Validar que los segundos no excedan 59
  const validSeconds = Math.min(seconds, 59);
  
  return minutes * 60 + validSeconds;
}

/**
 * Normaliza segundos a rango válido (0 - 99:59)
 * @param seconds - Número de segundos
 * @returns Segundos normalizados
 */
export function normalizeSeconds(seconds: number): number {
  return Math.max(0, Math.min(seconds, 99 * 60 + 59));
}

/**
 * Convierte segundos a objeto con minutos y segundos
 * @param seconds - Número de segundos
 * @returns Objeto con minutos y segundos
 */
export function toMinutesAndSeconds(seconds: number): { minutes: number; seconds: number } {
  const normalized = normalizeSeconds(seconds);
  return {
    minutes: Math.floor(normalized / 60),
    seconds: normalized % 60
  };
}

/**
 * Convierte minutos y segundos a segundos totales
 * @param minutes - Número de minutos
 * @param seconds - Número de segundos
 * @returns Segundos totales
 */
export function fromMinutesAndSeconds(minutes: number, seconds: number): number {
  return normalizeSeconds(minutes * 60 + seconds);
}

/**
 * Valida si un string es un tiempo válido
 * @param timeString - String a validar
 * @returns true si es válido
 */
export function isValidTime(timeString: string): boolean {
  if (!timeString) return false;
  
  // Verificar formato básico
  if (timeString.includes(':')) {
    const parts = timeString.split(':');
    if (parts.length !== 2) return false;
    
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    
    if (isNaN(minutes) || isNaN(seconds)) return false;
    if (minutes < 0 || minutes > 99) return false;
    if (seconds < 0 || seconds > 59) return false;
    
    return true;
  } else {
    const seconds = parseInt(timeString, 10);
    if (isNaN(seconds)) return false;
    if (seconds < 0 || seconds > 59) return false;
    
    return true;
  }
}

/**
 * Genera un string de tiempo para el keypad (mmss)
 * @param seconds - Número de segundos
 * @returns String en formato mmss
 */
export function toKeypadString(seconds: number): string {
  const { minutes, seconds: secs } = toMinutesAndSeconds(seconds);
  return `${minutes.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`;
}
