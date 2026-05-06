// PianoVoice — synthesises a soft piano-like tone using Web Audio oscillators.
// On press: plays root note of the active key.
// On hold (>200 ms): adds the full triad (root, 3rd, 5th).

const NOTE_FREQS = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18,
  'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
  'E': 329.63, 'Fb': 329.63,
  'F': 349.23, 'E#': 349.23, 'F#': 369.99, 'Gb': 369.99,
  'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
  'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
  'B': 493.88, 'Cb': 493.88,
}

function noteFreq(name, octave = 4) {
  const base = NOTE_FREQS[name]
  if (!base) return 440
  return base * Math.pow(2, octave - 4)
}

export class PianoVoice {
  static type = 'instrument'
  static id = 'piano-voice'
  static version = '1.0.0'

  constructor(opts = {}) {
    this.waveform = opts.waveform ?? 'sine'
    this.attack   = opts.attack   ?? 0.01
    this.release  = opts.release  ?? 0.6
    this.volume   = opts.volume   ?? 0.4

    this._audioCtx = null
    this._engine   = null
    this._nodes    = new Map() // code → [oscillator nodes]
  }

  init(engine, audioCtx) {
    this._engine   = engine
    this._audioCtx = audioCtx
  }

  onKeyPress(code) {
    this._stopAll()
    const key = this._engine.getKey(code)
    if (!key) return

    const ctx = this._audioCtx
    const now = ctx.currentTime
    const nodes = []

    // Root note + octave above (soft piano: fundamental + soft upper harmonic)
    const freqs = [noteFreq(key.root, 4), noteFreq(key.root, 5) * 0.3]

    for (const [freq, gainScale] of freqs.map((f, i) => [f, i === 0 ? 1 : 0.3])) {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = this.waveform
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(this.volume * gainScale, now + this.attack)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      nodes.push({ osc, gain })
    }

    this._nodes.set(code, nodes)
  }

  onKeyRelease(code) {
    const nodes = this._nodes.get(code)
    if (!nodes) return
    const ctx = this._audioCtx
    const now = ctx.currentTime
    for (const { gain, osc } of nodes) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + this.release)
      osc.stop(now + this.release + 0.05)
    }
    this._nodes.delete(code)
  }

  _stopAll() {
    for (const code of [...this._nodes.keys()]) {
      this.onKeyRelease(code)
    }
  }

  onKeyChange() {}
  render() {}

  getControls() {
    return [
      { id: 'waveform', type: 'select', label: 'Waveform', options: ['sine', 'triangle', 'sawtooth', 'square'], value: this.waveform },
      { id: 'attack',   type: 'range',  label: 'Attack',   min: 0.001, max: 0.5, step: 0.001, value: this.attack },
      { id: 'release',  type: 'range',  label: 'Release',  min: 0.05,  max: 2.0, step: 0.05,  value: this.release },
      { id: 'volume',   type: 'range',  label: 'Volume',   min: 0,     max: 1,   step: 0.01,  value: this.volume },
    ]
  }

  destroy() {
    this._stopAll()
  }
}
