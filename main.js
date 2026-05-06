import { InstrumentHost } from './core/InstrumentHost.js'
import { WheelUI } from './plugins/ui/WheelUI.js'
import { PianoVoice } from './plugins/instrument/PianoVoice.js'
import { KalimbaApparatus } from './plugins/apparatus/KalimbaApparatus.js'

InstrumentHost.boot({
  canvas: document.getElementById('stage'),
  plugins: [
    new WheelUI({ colorScheme: 'dark', showCompatibleHighlight: true }),
    new PianoVoice({ waveform: 'sine', attack: 0.01, release: 0.6 }),
    new KalimbaApparatus({ position: 'bottom' }),
  ],
  initialKey: '8B',
})
