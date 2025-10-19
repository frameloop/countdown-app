/**
 * Utilidades para persistencia en localStorage
 * Maneja errores de almacenamiento y proporciona interfaz type-safe
 */

const STORAGE_NAMESPACE = 'timer-config';

/**
 * Obtiene un valor del localStorage con manejo de errores
 * @param key - Clave del valor
 * @param defaultValue - Valor por defecto si no existe o hay error
 * @returns Valor parseado o valor por defecto
 */
export function getStorageValue<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`${STORAGE_NAMESPACE}:${key}`);
    if (item === null) return defaultValue;
    
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Error reading from localStorage for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Guarda un valor en localStorage con manejo de errores
 * @param key - Clave del valor
 * @param value - Valor a guardar
 * @returns true si se guardó correctamente, false si hubo error
 */
export function setStorageValue<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(`${STORAGE_NAMESPACE}:${key}`, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error writing to localStorage for key "${key}":`, error);
    return false;
  }
}

/**
 * Elimina un valor del localStorage
 * @param key - Clave del valor a eliminar
 */
export function removeStorageValue(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_NAMESPACE}:${key}`);
  } catch (error) {
    console.warn(`Error removing from localStorage for key "${key}":`, error);
  }
}

/**
 * Limpia todos los valores del namespace
 */
export function clearStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${STORAGE_NAMESPACE}:`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Error clearing localStorage:', error);
  }
}

/**
 * Verifica si localStorage está disponible
 * @returns true si está disponible
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
