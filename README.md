# Configurador de Temporizador

Una aplicación web móvil para configurar temporizadores con un display tipo odómetro antiguo, construida con React + TypeScript + Vite + Tailwind CSS.

## 🎯 Características

### Display Inteligente (Odómetro)
- **Formato automático**: Muestra `ss` para <60s, `mm:ss` para ≥60s
- **Estilo odómetro**: Dígitos monoespaciados con sombras y bordes simulando "palas"
- **Animaciones suaves**: Transiciones al cambiar dígitos
- **Accesibilidad**: `aria-live="polite"` para lectores de pantalla

### Presets Rápidos
- **Chips horizontales**: Scroll horizontal con presets populares
- **Selección visual**: Estado seleccionado con feedback
- **Modal completo**: Botón "Ver todos" abre grid de presets
- **Persistencia**: "Más usados" guardados en localStorage

### Selector de Tiempo
- **Steppers +/-**: Controles con aceleración al mantener (>600ms → saltos de 5s)
- **Teclado numérico**: Modal con keypad 0-9, borrar, confirmar
- **Formato mmss**: Entrada normalizada (ej: `90` → `01:30`)
- **Validación**: No negativos, máximo `99:59`

### Configuraciones
- **Sonidos**: Clic al pasar dígito + beep final
- **Vibración**: `navigator.vibrate` con estado de soporte
- **Notificaciones**: Refleja permiso real del SO con botón "Permitir"

### Acciones Secundarias
- **Guardar preset**: Modal para nombre + emoji de presets personalizados
- **Restablecer**: Vuelve a valores por defecto

### CTA Pegajoso
- **Empezar**: Botón primary que emite `onStart(totalSeconds)`
- **Previsualizar**: Animación 3-2-1 con Framer Motion
- **Evento global**: `window.dispatchEvent(new CustomEvent('timer:start'))`

## 🛠️ Tecnologías

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** para estilos
- **Framer Motion** para animaciones
- **Vitest** para pruebas unitarias
- **Testing Library** para pruebas de componentes

## 🚀 Instalación y Uso

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build
npm run preview

# Ejecutar pruebas
npm test

# Pruebas con UI
npm run test:ui

# Pruebas una sola vez
npm run test:run
```

## 📱 Responsive Design

- **Mobile First**: Optimizado para dispositivos móviles
- **Breakpoints**: 375px, 480px, 768px, 1024px, 1440px
- **Touch Targets**: Mínimo 44×44px para accesibilidad
- **Landscape**: Ajustes específicos para orientación horizontal

## ♿ Accesibilidad

- **Contraste**: Mínimo 4.5:1 en todos los elementos
- **Focus Visible**: Indicadores claros de foco
- **ARIA**: Labels, descriptions y roles apropiados
- **Keyboard**: Navegación completa por teclado
- **Screen Readers**: Soporte completo con `aria-live`
- **Reduced Motion**: Respeta `prefers-reduced-motion`

## 🎨 Tema Visual

### Colores (Dark Mode)
- **Fondo app**: `#0C0C0D`
- **Paneles**: `#111`
- **Texto principal**: `#EDEDED`
- **Display odómetro**: `#0E0E10` con bordes `white/10`

### Display Odómetro
```css
/* Contenedor */
rounded-3xl bg-[#0E0E10] border border-white/10 
shadow-[inset_0_2px_12px_rgba(0,0,0,.8)]

/* Dígitos */
font-mono text-[min(12vw,120px)] leading-none tracking-tight

/* Ruedas individuales */
rounded-xl bg-[#151517] border border-white/8
shadow-[inset_0_-8px_16px_rgba(0,0,0,.65),inset_0_12px_24px_rgba(255,255,255,.03)]
```

## 📁 Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── TimeDisplay.tsx     # Display odómetro
│   ├── PresetChip.tsx       # Chip de preset
│   ├── Stepper.tsx          # Controles +/-
│   ├── ToggleRow.tsx       # Fila de toggle
│   ├── KeypadModal.tsx     # Modal teclado
│   ├── PresetGridModal.tsx # Modal grid presets
│   └── StickyCTA.tsx       # CTA pegajoso
├── pages/
│   └── TimeSetup.tsx        # Página principal
├── utils/
│   ├── time.ts              # Utilidades de tiempo
│   ├── storage.ts            # Persistencia localStorage
│   └── __tests__/
│       └── time.test.ts     # Pruebas unitarias
├── types/
│   └── index.ts              # Tipos TypeScript
├── data/
│   └── presets.ts            # Datos de ejemplo
└── test/
    └── setup.ts              # Configuración pruebas
```

## 🧪 Pruebas

Las pruebas cubren:
- **Utilidades de tiempo**: Formateo, parsing, normalización
- **Conversiones**: mm:ss ↔ segundos
- **Validación**: Rangos y formatos
- **Edge cases**: Valores límite y casos especiales

```bash
# Ejecutar todas las pruebas
npm test

# Pruebas en modo watch
npm run test

# Pruebas con interfaz visual
npm run test:ui
```

## 📊 Datos de Ejemplo

```typescript
DEFAULT_PRESETS = [
  { id: 'fast30', emoji: '⏱️', label: 'Rápido', seconds: 30 },
  { id: 'pom1',   emoji: '🍅', label: 'Pomodoro', seconds: 60 },
  { id: 'rest2',  emoji: '☕', label: 'Descanso', seconds: 120 },
  { id: 'fit5',   emoji: '🏃', label: 'Ejercicio', seconds: 300 },
  { id: 'study10',emoji: '📚', label: 'Estudio', seconds: 600 },
  { id: 'med15',  emoji: '🧘', label: 'Meditación', seconds: 900 },
  { id: 'cook60', emoji: '🍳', label: 'Cocina', seconds: 3600 },
];
```

## 🔧 Configuración

### Tailwind CSS
- Configurado con colores personalizados
- Utilidades para odómetro y animaciones
- Responsive design con breakpoints móviles

### Framer Motion
- Animaciones respetando `prefers-reduced-motion`
- Transiciones suaves ≤150ms
- Microinteracciones optimizadas

### TypeScript
- Tipos estrictos para todos los componentes
- Interfaces para props y estado
- Utilidades type-safe

## 📱 Uso en Móvil

1. **Configurar tiempo**: Usar presets o steppers
2. **Ajustar configuraciones**: Sonidos, vibración, notificaciones
3. **Previsualizar**: Botón "Previsualizar" para countdown 3-2-1
4. **Empezar**: Botón "Empezar" para iniciar temporizador

## 🎯 Próximas Mejoras

- [ ] Temas de color personalizables
- [ ] Configuración avanzada de sonidos (diferentes tonos)
- [ ] Historial de temporizadores
- [ ] Sincronización entre dispositivos
- [ ] Widgets para pantalla de inicio

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas, por favor abre un issue en GitHub.