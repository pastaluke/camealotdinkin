// WheelUI — renders the Camelot Wheel on Canvas and handles hit detection.
// Tracks each pointer by its pointerId so multiple simultaneous touches work independently.
export class WheelUI {
  static type = 'ui'
  static id = 'wheel-ui'
  static version = '1.0.0'

  constructor(opts = {}) {
    this.colorScheme = opts.colorScheme ?? 'dark'
    this.showNoteNames = opts.showNoteNames ?? true
    this.showCompatibleHighlight = opts.showCompatibleHighlight ?? true
    this.ringLabels = opts.ringLabels ?? true

    this._engine = null
    this._host = null

    this._hoverCode = null
    this._pressedPointers = new Map() // pointerId → code
    this._paths = new Map()           // code → Path2D
  }

  init(engine) {
    this._engine = engine
  }

  // ─── Input handlers ──────────────────────────────────────────────────────

  onPointerDown(x, y, e) {
    const code = this._hitTest(x, y)
    if (!code) return
    this._pressedPointers.set(e.pointerId, code)
    this._host.pressKey(code)
  }

  onPointerUp(x, y, e) {
    const code = this._pressedPointers.get(e.pointerId)
    if (code === undefined) return
    this._pressedPointers.delete(e.pointerId)
    this._host.releaseKey(code)
  }

  onPointerMove(x, y) {
    this._hoverCode = this._hitTest(x, y)
  }

  onPointerLeave(x, y, e) {
    const code = this._pressedPointers.get(e.pointerId)
    if (code !== undefined) {
      this._pressedPointers.delete(e.pointerId)
      this._host.releaseKey(code)
    }
    if (this._pressedPointers.size === 0) this._hoverCode = null
  }

  onKeyChange() {}

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

    const activeCode  = this._engine?.activeCode
    const pressedCodes = new Set(this._pressedPointers.values())
    const compatCodes = new Set(
      (this.showCompatibleHighlight && activeCode)
        ? this._engine.getCompatibleKeys(activeCode).map(k => k.code)
        : []
    )

    ctx.save()

    ctx.beginPath()
    ctx.arc(cx, cy, outerR + 4, 0, Math.PI * 2)
    ctx.fillStyle = palette.bg
    ctx.fill()

    const keys = this._engine?.getAllKeys() ?? []
    this._paths.clear()
    this._drawRing(ctx, cx, cy, outerR, innerR + 1, keys.filter(k => k.type === 'major'), palette, pressedCodes, activeCode, compatCodes)
    this._drawRing(ctx, cx, cy, innerR - 1, holeR,  keys.filter(k => k.type === 'minor'), palette, pressedCodes, activeCode, compatCodes)

    ctx.beginPath()
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2)
    ctx.fillStyle = palette.bg
    ctx.fill()

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

  _drawRing(ctx, cx, cy, outerR, innerR, keys, palette, pressedCodes, activeCode, compatCodes) {
    const sliceAngle = (Math.PI * 2) / keys.length
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

      const isPressed = pressedCodes.has(key.code)
      const isActive  = key.code === activeCode

      if (isPressed || isActive) fill = this._blend(fill, palette.active)
      else if (compatCodes.has(key.code)) fill = this._blend(fill, palette.compat)
      if (key.code === this._hoverCode) fill = this._blend(fill, palette.hover)

      ctx.fillStyle = fill
      ctx.fill(path)
      ctx.strokeStyle = stroke
      ctx.lineWidth = (isPressed || isActive) ? 2.5 : 1
      ctx.stroke(path)

      const midAngle = startAngle + sliceAngle / 2
      const midR     = (outerR + innerR) / 2
      const fontSize = Math.round((outerR - innerR) * 0.28)

      ctx.save()
      ctx.translate(cx + Math.cos(midAngle) * midR, cy + Math.sin(midAngle) * midR)
      ctx.rotate(midAngle + Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = palette.text
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillText(key.code, 0, -fontSize * 0.6)
      ctx.font = `${Math.round(fontSize * 0.75)}px sans-serif`
      ctx.fillStyle = palette.label
      ctx.fillText(key.root, 0, fontSize * 0.6)
      ctx.restore()
    })
  }

  _hitTest(x, y) {
    const offscreen = this._offCtx ?? (this._offCtx = document.createElement('canvas').getContext('2d'))
    for (const [code, path] of this._paths) {
      if (offscreen.isPointInPath(path, x, y)) return code
    }
    return null
  }

  _blend(base, overlay) { return overlay ?? base }

  getControls() {
    return [
      { id: 'colorScheme', type: 'select', label: 'Color Scheme', options: ['dark', 'light'], value: this.colorScheme },
      { id: 'showCompatibleHighlight', type: 'toggle', label: 'Highlight Compatible', value: this.showCompatibleHighlight },
    ]
  }

  destroy() {}
}
