import { InstrumentHost } from './core/InstrumentHost.js'
import { PluginRegistry } from './core/PluginRegistry.js'
import { WheelUI } from './plugins/ui/WheelUI.js'
import { PatchSelector, PATCH_BAR_HEIGHT } from './plugins/ui/PatchSelector.js'
import { RootVoice } from './plugins/instrument/RootVoice.js'
import { PianoVoice } from './plugins/instrument/PianoVoice.js'
import { KalimbaApparatus } from './plugins/apparatus/KalimbaApparatus.js'

PluginRegistry.register(RootVoice)
PluginRegistry.register(PianoVoice)

// Kalimba bottom footprint in CSS px (matches KalimbaApparatus constants).
const KALIMBA_BOTTOM_CSS_PX = 180 + 70  // bodyH cap + safeBottom

InstrumentHost.boot({
  canvas: document.getElementById('stage'),
  plugins: [
    new WheelUI({
      colorScheme: 'dark',
      showCompatibleHighlight: true,
      topOffsetCssPx:    PATCH_BAR_HEIGHT,
      bottomOffsetCssPx: KALIMBA_BOTTOM_CSS_PX,
    }),
    new PatchSelector(),
    new PianoVoice({ waveform: 'sine', attack: 0.01, release: 0.6 }),
    new KalimbaApparatus({ position: 'bottom' }),
  ],
  initialKey: '8B',
})
