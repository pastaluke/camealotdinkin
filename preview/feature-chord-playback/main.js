import { InstrumentHost } from './core/InstrumentHost.js'
import { PluginRegistry } from './core/PluginRegistry.js'
import { WheelUI } from './plugins/ui/WheelUI.js'
import { PatchSelector } from './plugins/ui/PatchSelector.js'
import { RootVoice } from './plugins/instrument/RootVoice.js'
import { PianoVoice } from './plugins/instrument/PianoVoice.js'
import { KalimbaApparatus } from './plugins/apparatus/KalimbaApparatus.js'

// Register all instrument plugins — PatchSelector discovers them automatically.
// Add any future instrument plugin here and it appears in the UI with no other changes.
PluginRegistry.register(RootVoice)
PluginRegistry.register(PianoVoice)

InstrumentHost.boot({
  canvas: document.getElementById('stage'),
  plugins: [
    new WheelUI({ colorScheme: 'dark', showCompatibleHighlight: true }),
    new PatchSelector(),
    new PianoVoice({ waveform: 'sine', attack: 0.01, release: 0.6 }),
    new KalimbaApparatus({ position: 'bottom' }),
  ],
  initialKey: '8B',
})
