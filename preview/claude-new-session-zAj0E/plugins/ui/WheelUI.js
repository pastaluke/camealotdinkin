// WheelUI — renders the Camelot Wheel on Canvas and handles hit detection.
export class WheelUI {
  static type = 'ui'
  static id = 'wheel-ui'
  static version = '1.0.0'

  constructor(opts = {}) {
    this.colorScheme = opts.colorScheme ?? 'dark'
    this.showNoteNames = opts.showNoteNames ?? true
    this.showCompatibleHighlight = opts.showCompatibleHighlight ?? true
    this.ringLabels = opts.ringLabels ?? true

    // Set by InstrumentHost
    this._engine = null
    this._host = null

    this._hoverCode = null
    this._pressedCode = null
    this._paths = new Map() // code → Path2D
  }

  init(engine) {
    this._engine = engine
  }

  // ─── Input handlers ──────────────────────────────────────────────────────

  onPointerDown(x, y) {
    const code = this._hitTest(x, y)
    if (!code) return
    this._pressedCode = code
    this._host.pressKey(code)
  }

  onPointerUp(x, y) {
    if (this._pressedCode) {
      this._host.releaseKey(this._pressedCode)
      this._pressedCode = null
    }
  }

  onPointerMove(x, y) {
    this._hoverCode = this._hitTest(x, y)
  }

  onPointerLeave() {
    this._hoverCode = null
    if (this._pressedCode) {
      this._host.releaseKey(this._pressedCode)
      this._pressedCode = null
    }
  }

  onKeyChange() { /* re-render handled by RAF */ }

  // ─── Rendering ───────────────────────────────────────────────────────────

  render(canvas, ctx) {
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const outerR = Math.min(W, H) * 0.46
    const innerR = outerR * 0.58
    const holeR  = outerR * 0.22

    const dark = this.colorScheme === 'dark'
    const palette = dark
      ? { bg: '#0d0d14', majorFill: '#1a2a4a', minorFill: '#2a1a3a', majorStroke: '#4488cc', minorStroke: '#9944cc', text: '#e8e8f0', hover: '#66aaff44', active: '#ffcc0055', compat: '#44ff8822', label: '#aaaacc' }
      : { bg: '#f5f5f0', majorFill: '#dceeff', minorFill: '#eedcff', majorStroke: '#2266aa', minorStroke: '#7722aa', text: '#111120', hover: '#2266aa22', active: '#ffaa0033', compat: '#22aa4422', label: '#445566' }

    const activeCode = this._engine?.activeCode
    const compatCodes = new Set(
      (this.showCompatibleHighlight && activeCode)
        ? this._engine.getCompatibleKeys(activeCode).map(k => k.code)
        : []
    )

    ctx.save()

    // Background disc
    ctx.beginPath()
    ctx.arc(cx, cy, outerR + 4, 0, Math.PI * 2)
    ctx.fillStyle = palette.bg
    ctx.fill()

    const keys = this._engine?.getAllKeys() ?? []
    const majorKeys = keys.filter(k => k.type === 'major')
    const minorKeys = keys.filter(k => k.type === 'minor')

    // Outer ring = major (B), inner ring = minor (A)
    this._paths.clear()
    this._drawRing(ctx, cx, cy, outerR, innerR + 1, majorKeys, palette, activeCode, compatCodes)
    this._drawRing(ctx, cx, cy, innerR - 1, holeR, minorKeys, palette, activeCode, compatCodes)

    // Centre hole
    ctx.beginPath()
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2)
    ctx.fillStyle = palette.bg
    ctx.fill()

    // Centre label
    if (activeCode) {
      const key = this._engine.getKey(activeCode)
      ctx.fillStyle = palette.text
      ctx.font = `bold ${Math.round(holeR * 0.38)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(key.label, cx, cy)
    }

    ctx.restore()
  }

  _drawRing(ctx, cx, cy, outerR, innerR, keys, palette, activeCode, compatCodes) {
    const count = keys.length // 12
    const sliceAngle = (Math.PI * 2) / count
    // Start at top (−π/2) and go clockwise.
    const startOffset = -Math.PI / 2

    keys.forEach((key, i) => {
      const startAngle = startOffset + i * sliceAngle
      const endAngle   = startAngle + sliceAngle

      const path = new Path2D()
      path.arc(cx, cy, outerR, startAngle, endAngle)
      path.arc(cx, cy, innerR, endAngle, startAngle, true)
      path.closePath()
      this._paths.set(key.code, path)

      const isMajor = key.type === 'major'
      let fill = isMajor ? palette.majorFill : palette.minorFill
      const stroke = isMajor ? palette.majorStroke : palette.minorStroke

      if (key.code === activeCode) fill = this._blendHex(fill, palette.active)
      else if (compatCodes.has(key.code)) fill = this._blendHex(fill, palette.compat)
      if (key.code === this._hoverCode) fill = this._blendHex(fill, palette.hover)

      ctx.fillStyle = fill
      ctx.fill(path)
      ctx.strokeStyle = stroke
      ctx.lineWidth = key.code === activeCode ? 2.5 : 1
      ctx.stroke(path)

      // Label
      const midAngle = startAngle + sliceAngle / 2
      const midR = (outerR + innerR) / 2
      const tx = cx + Math.cos(midAngle) * midR
      const ty = cy + Math.sin(midAngle) * midR
      const fontSize = Math.round((outerR - innerR) * 0.28)

      ctx.save()
      ctx.translate(tx, ty)
      ctx.rotate(midAngle + Math.PI / 2)
      ctx.fillStyle = palette.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillText(key.code, 0, -fontSize * 0.6)
      ctx.font = `${Math.round(fontSize * 0.75)}px sans-serif`
      ctx.fillStyle = palette.label
      ctx.fillText(key.root, 0, fontSize * 0.6)
      ctx.restore()
    })
  }

  _hitTest(x, y) {
    // We need a temporary canvas context to test paths
    const offscreen = this._offCtx ?? (this._offCtx = document.createElement('canvas').getContext('2d'))
    for (const [code, path] of this._paths) {
      if (offscreen.isPointInPath(path, x, y)) return code
    }
    return null
  }

  // Blend a base hex colour with an rgba overlay string (cheap composite).
  _blendHex(base, overlay) {
    // Just return overlay if it has alpha; Canvas compositing handles it.
    return overlay ?? base
  }

  getControls() {
    return [
      { id: 'colorScheme', type: 'select', label: 'Color Scheme', options: ['dark', 'light'], value: this.colorScheme },
      { id: 'showCompatibleHighlight', type: 'toggle', label: 'Highlight Compatible', value: this.showCompatibleHighlight },
    ]
  }

  destroy() {}
}
