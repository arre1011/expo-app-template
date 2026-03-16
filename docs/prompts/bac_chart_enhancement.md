# BAC Chart Enhancement – Implementierungsspezifikation

## Überblick

Diese Spezifikation beschreibt die Verbesserung des BAC-Verlaufs-Charts durch einen interaktiven Marker mit Tooltip. Der User kann durch Touch-Geste jeden Punkt im Verlauf erkunden.

**Technologie:** Die Implementierung erfolgt mit [Victory Native XL](https://commerce.nearform.com/open-source/victory-native/) (victory-native v41+), einer Skia-basierten Charting-Library für React Native mit exzellentem Touch-Support und 60fps Performance.

## Fachliche Ziele

1. **Zeitliche Orientierung**: User soll sofort sehen, wo "jetzt" im BAC-Verlauf liegt
2. **Interactive Exploration**: User kann jeden Punkt im Verlauf untersuchen (BAC + Uhrzeit)
3. **Harm Reduction**: Bewusstes Trinkverhalten fördern durch besseres Verständnis des BAC-Verlaufs

## Feature: Interaktiver Marker mit Tooltip

### Verhalten

#### 1. Default-Zustand (kein Touch)
**Siehe Screenshot**: `docs/ui/Beispile_for_new_chart/Default_ansicht.png`

- **Marker (Dot)**: Ein Punkt auf der BAC-Kurve bei der aktuellen Uhrzeit
- **Tooltip**: Zeigt die aktuelle Uhrzeit direkt am Marker (z.B. "15:09")
- **Haupt-BAC-Anzeige**: Zeigt aktuellen BAC-Wert groß über dem Chart
- **Chart**: Cleaner Look, keine zusätzlichen Linien

#### 2. Touch-Zustand (User berührt Chart)
**Siehe Screenshot**: `docs/ui/Beispile_for_new_chart/During_touch_ansicht.png`

**Was passiert:**
1. **Marker wandert**: Der Punkt bewegt sich entlang der X-Achse zur Touch-Position
2. **Tooltip aktualisiert sich**: Zeigt Uhrzeit an Touch-Position (z.B. "30. Dec 2024")
3. **Haupt-BAC-Anzeige ändert sich**: Zeigt BAC-Wert an Touch-Position statt aktuellem Wert
4. **Haptisches Feedback**: Leichtes Haptic beim Touch-Start
5. **Achsen-Labels**: X/Y-Achsen-Labels werden sichtbar/prominent während Touch (falls einfach umsetzbar)

#### 3. Release-Zustand (User lässt los)
- Marker springt zurück zur aktuellen Uhrzeit
- Tooltip zeigt wieder aktuelle Uhrzeit
- Haupt-BAC-Anzeige springt zurück auf aktuellen Wert

### Technische Anforderungen

**Bibliothek:** `victory-native` v41+ (Victory Native XL)
- Skia-basiertes Rendering für maximale Performance
- Eingebauter Touch-Support via `useChartPressState` Hook
- Nutzt Reanimated 3 für flüssige 60fps Gestures

**Dependencies (bereits im Projekt installiert):**
```bash
# Alle bereits vorhanden - kein npm install nötig
victory-native@^41.20.2
@shopify/react-native-skia@2.4.14
react-native-reanimated@4.2.1
react-native-gesture-handler@~2.28.0
expo-haptics@~15.0.8
```

**Wichtig:**
- Die bestehende Downsampling-Logik in `BACChart.tsx` (Zeilen 58-78) **muss beibehalten werden** für Performance.
- **Erfordert Development Build** - funktioniert NICHT in Expo Go (wegen Skia native Bindings)

### Akzeptanzkriterien

- [ ] Marker (Dot) wird bei aktueller Uhrzeit angezeigt im Default-Zustand
- [ ] Tooltip zeigt aktuelle Uhrzeit am Marker
- [ ] Bei Touch wandert Marker zur Finger-Position
- [ ] Tooltip aktualisiert sich während Touch (zeigt Uhrzeit an Touch-Position)
- [ ] Haupt-BAC-Anzeige wechselt zwischen aktuellem und Touch-Wert
- [ ] Finger-Drag über Chart funktioniert flüssig (60fps)
- [ ] Nach Release springt Marker zurück zur aktuellen Uhrzeit
- [ ] Haptisches Feedback bei Touch-Start
- [ ] Kein Konflikt mit Scroll-Gestures (wenn Chart in ScrollView)

---

## Design & Styling

**Design-Referenz:** Screenshots in `docs/ui/Beispile_for_new_chart/`
- `Default_ansicht.png` - Marker bei aktueller Uhrzeit
- `During_touch_ansicht.png` - Marker an Touch-Position

### Visuelle Spezifikation

**Chart:**
- **BAC-Kurve**: Schwarze durchgezogene Linie, prominent (strokeWidth 2-3px)
- **Hintergrund**: Hell/Weiß, minimalistisch
- **Gridlines**: Keine sichtbaren Gridlines (cleaner Look)

**Marker (Dot):**
- Größe: 8-10px Durchmesser
- Farbe: `colors.primary` (passend zur Kurve)
- Position: Auf der Kurve an aktueller Uhrzeit (Default) oder Touch-Position

**Tooltip:**
- Erscheint direkt über/neben dem Marker
- Format: "HH:mm" (z.B. "15:09") oder "dd. MMM yyyy" bei Touch
- Schriftgröße: klein, lesbar (fontSize.xs)
- Hintergrund: Leicht transparent oder solid, je nach Lesbarkeit

**Achsen:**
- X-Achse: Labels unterhalb des Charts, Format "HH:mm"
- Y-Achse: Labels (falls einfach umsetzbar rechts, sonst links), Format "0.0‰"

**Haupt-BAC-Anzeige:**
- Über dem Chart, groß und prominent
- Ändert sich flüssig während Touch

### Layout
- Chart Height: 250-300px (größer als aktuell)
- Chart Container: Minimaler Padding, maximale Chart-Fläche
- Kein Border/Shadow um Chart (clean look)

---

## Implementierung mit Victory Native XL

### Kernkomponenten

```tsx
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { Circle, Text as SkiaText } from "@shopify/react-native-skia";
import { useDerivedValue, runOnJS } from "react-native-reanimated";
import * as Haptics from 'expo-haptics';
```

### Touch-State Hook

```tsx
const { state, isActive } = useChartPressState({
  x: 0,           // timestamp
  y: { bac: 0 }   // BAC-Wert
});

// state.x.value     - aktueller X-Wert (Timestamp)
// state.x.position  - X-Position in Pixeln
// state.y.bac.value - aktueller Y-Wert (BAC)
// state.y.bac.position - Y-Position in Pixeln
// isActive          - true wenn Finger auf Chart
```

### ActiveValueIndicator Komponente

```tsx
function ActiveValueIndicator({ state, isActive }) {
  if (!isActive) return null;

  return (
    <>
      {/* Marker dot auf Kurve */}
      <Circle
        cx={state.x.position}
        cy={state.y.bac.position}
        r={6}
        color={colors.primary}
      />
      {/* Zeit-Tooltip über Marker */}
      <SkiaText
        x={state.x.position}
        y={state.y.bac.position - 12}
        text={formatTime(state.x.value)}
      />
    </>
  );
}
```

### CartesianChart Aufbau

```tsx
<CartesianChart
  data={chartData}
  xKey="timestamp"
  yKeys={["bac"]}
  domain={{ x: xDomain, y: yDomain }}
  chartPressState={state}
  gestureLongPressDelay={0}
>
  {({ points }) => (
    <>
      <Line points={points.bac} color={colors.text} strokeWidth={2.5} />
      <ActiveValueIndicator state={state} isActive={isActive} />
    </>
  )}
</CartesianChart>
```

### Callback für BAC-Display Update

```tsx
// In BACChart.tsx
interface BACChartProps {
  timeSeries: BACTimeSeries;
  height?: number;
  onTouchBAC?: (bac: number | null) => void;  // NEU
}

// Bei Touch: onTouchBAC(touchedBACValue)
// Bei Release: onTouchBAC(null)

// In Home Screen
const [touchBAC, setTouchBAC] = useState<number | null>(null);
<BACDisplay currentBAC={touchBAC ?? currentBAC} />
<BACChart timeSeries={bacTimeSeries} onTouchBAC={setTouchBAC} />
```

---

## Migration von bestehender SVG-Implementierung

**Betroffene Datei:** `src/ui/components/BACChart.tsx`

**Was beibehalten:**
- Downsampling-Logik - essentiell für Performance
- Container, Title, Styles
- Props Interface (erweitert um `onTouchBAC`)

**Was ersetzt wird:**
- Custom SVG-Rendering → Victory Native XL `CartesianChart`
- Manuelle Achsen-Label-Berechnung → Victory Native XL `axisOptions`
- `niceNumber()` und `calculateNiceScale()` → Victory Native XL auto-scaling

---

## Anhang: Referenzen

### Victory Native XL Docs
- [GitHub Repository](https://github.com/FormidableLabs/victory-native)
- [Documentation](https://commerce.nearform.com/open-source/victory-native/)
- [CartesianChart API](https://commerce.nearform.com/open-source/victory-native/docs/cartesian/cartesian-chart)
- [useChartPressState Hook](https://commerce.nearform.com/open-source/victory-native/docs/cartesian/use-chart-press-state)

### Vorteile von Victory Native XL vs. andere Libraries

| Feature | Victory Native XL | react-native-wagmi-charts |
|---------|-------------------|---------------------------|
| Rendering | Skia (60fps) | Reanimated + SVG |
| Touch-Support | `useChartPressState` | `LineChart.Provider` |
| Bundle Size | Größer (Skia) | Kleiner |
| Expo Go | Nein | Nein |
| Wartung | Aktiv (Nearform) | Community |

**Hinweis:** Beide Libraries benötigen einen Development Build und funktionieren nicht in Expo Go.
