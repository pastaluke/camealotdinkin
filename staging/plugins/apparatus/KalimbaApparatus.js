// KalimbaApparatus — renders a visual kalimba whose tines map to the active key's notes.
// Clicking a tine plays that individual note through PianoVoice (or any loaded instrument plugin).

export class KalimbaApparatus {
  static type = 'apparatus'
  static id = 'kalimba-apparatus'
  static version = '1.0.0'

  constructor(opts = {}) {
    this.position    = opts.position    ?? 'bottom'  // 'bottom' | 'top'
    this.tineCount   = 7   // one per diatonic note in the key
    this._engine     = null
    this._host       = null
    this._audioCtx   = null
    this._activeKey  = null
    this._tineRects  = [] // { note, freq, x, y, w, h }
    this._pressedNote = null
    this._hoverNote   = null
  }

  init(engine, audioCtx) {
    this._engine   = engine
    this._audioCtx = audioCtx
    this._activeKey = engine.activeCode
  }

  onKeyChange(newCode) {
    this._activeKey = newCode
  }

  onPointerDown(x, y) {
    const tine = this._hitTine(x, y)
    if (!tine) return
    this._pressedNote = tine.note
    this._playNote(tine)
  }

  onPointerUp() {
    if (this._pressedNote) {
      this._stopNote(this._pressedNote)
      this._pressedNote = null
    }
  }

  onPointerMove(x, y) {
    const tine = this._hitTine(x, y)
    this._hoverNote = tine ? tine.note : null
  }

  onPointerLeave() {
    if (this._pressedNote) {
      this._stopNote(this._pressedNote)
      this._pressedNote = null
    }
    this._hoverNote = null
  }

  // ─── Audio ───────────────────────────────────────────────────────────────

  _playNote(tine) {
    const ctx = this._audioCtx
    if (!ctx || ctx.state === 'suspended') ctx?.resume()
    const now = ctx.currentTime

    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = tine.freq

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.35, now + 0.008)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)

    if (!this._activeNodes) this._activeNodes = new Map()
    this._activeNodes.set(tine.note, { osc, gain })
  }

  _stopNote(note) {
    const node = this._activeNodes?.get(note)
    if (!node) return
    const ctx = this._audioCtx
    const now = ctx.currentTime
    node.gain.gain.cancelScheduledValues(now)
    node.gain.gain.setValueAtTime(node.gain.gain.value, now)
    node.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
    node.osc.stop(now + 0.55)
    this._activeNodes.delete(note)
  }

  // ─── Rendering ───────────────────────────────────────────────────────────

  render(canvas, ctx) {
    const W = canvas.width
    const H = canvas.height

    const key = this._engine?.getKey(this._activeKey)
    if (!key) return

    const notes = key.notes // 7 notes
    const tineCount = notes.length

    // dpr lets us cap dimensions in CSS pixels so the kalimba scales correctly
    // on high-density screens instead of being tiny in canvas pixels.
    const dpr     = canvas.width / (canvas.offsetWidth || canvas.width)
    const bodyH   = Math.round(Math.min(window.innerHeight * 0.22, 180) * dpr)
    // 70 CSS px bottom margin keeps tines above OS home-gesture / browser chrome zones.
    const safeBottom = Math.round(70 * dpr)
    const bodyY   = this.position === 'bottom' ? H - bodyH - safeBottom : 8
    const bodyX   = W * 0.1
    const bodyW   = W * 0.8

    // Body background
    ctx.save()
    ctx.fillStyle = '#2a1a0a'
    ctx.strokeStyle = '#8b6533'
    ctx.lineWidth = 2
    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 12)
    ctx.fill()
    ctx.stroke()

    // Title
    ctx.fillStyle = '#c8a96e'
    ctx.font = `bold ${Math.round(bodyH * 0.14)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(`${key.label} · ${key.code}`, W / 2, bodyY + 6)

    // Tines — kalimba layout: longest in centre, shortest at edges (alternating).
    // Map notes to tine order: centre = root, alternating out.
    const orderedNotes = kalimbaOrder(notes)
    this._tineRects = []

    const tineMargin = bodyW * 0.04
    const tineAreaW  = bodyW - tineMargin * 2
    const tineW      = (tineAreaW / tineCount) * 0.72
    const tineSpacing = tineAreaW / tineCount
    const maxTineH   = bodyH * 0.65
    const minTineH   = maxTineH * 0.55
    const tineBase   = bodyY + bodyH - 14

    const NOTE_FREQS_KALIMBA = buildFreqMap()

    orderedNotes.forEach((note, i) => {
      // Height decreases from centre outward
      const distFromCentre = Math.abs(i - (tineCount - 1) / 2) / ((tineCount - 1) / 2)
      const tineH = maxTineH - (maxTineH - minTineH) * distFromCentre
      const tx = bodyX + tineMargin + i * tineSpacing + (tineSpacing - tineW) / 2
      const ty = tineBase - tineH

      const isHover   = note === this._hoverNote
      const isPressed = note === this._pressedNote

      ctx.fillStyle = isPressed ? '#ffdd88' : isHover ? '#e8c87a' : '#c8a044'
      ctx.strokeStyle = '#5a3a10'
      ctx.lineWidth = 1
      roundRect(ctx, tx, ty, tineW, tineH, 4)
      ctx.fill()
      ctx.stroke()

      // Note label at top of tine
      ctx.fillStyle = '#1a0a00'
      ctx.font = `bold ${Math.round(tineW * 0.55)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(note, tx + tineW / 2, ty + 4)

      const freq = NOTE_FREQS_KALIMBA[note] ?? 440
      this._tineRects.push({ note, freq, x: tx, y: ty, w: tineW, h: tineH })
    })

    ctx.restore()
  }

  _hitTine(x, y) {
    return this._tineRects.find(t => x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) ?? null
  }

  getControls() {
    return [
      { id: 'position', type: 'select', label: 'Position', options: ['bottom', 'top'], value: this.position },
    ]
  }

  destroy() {
    this._activeNodes?.forEach((_, note) => this._stopNote(note))
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Re-order 7 notes so the root is centre and notes alternate outward (kalimba layout).
function kalimbaOrder(notes) {
  // Standard kalimba: centre = longest (highest), alternating left/right going lower.
  // We keep it simple: root at centre (index 3), then alternate.
  const result = new Array(notes.length)
  const mid = Math.floor(notes.length / 2)
  result[mid] = notes[0]
  for (let i = 1; i < notes.length; i++) {
    if (i % 2 === 1) result[mid + Math.ceil(i / 2)] = notes[i]
    else             result[mid - i / 2]             = notes[i]
  }
  return result
}

function buildFreqMap() {
  const base = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18,
    'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63, 'Fb': 329.63,
    'F': 349.23, 'E#': 349.23, 'F#': 369.99, 'Gb': 369.99,
    'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
    'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
    'B': 493.88, 'Cb': 493.88,
  }
  return base
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
