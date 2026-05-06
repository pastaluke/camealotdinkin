import { CamelotEngine } from './CamelotEngine.js'
import { EventBus } from './EventBus.js'

export class InstrumentHost {
  static async boot({ canvas, plugins = [], initialKey = '8B' } = {}) {
    const host = new InstrumentHost(canvas)
    await host._init(plugins, initialKey)
    return host
  }

  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.engine = new CamelotEngine()
    this.audioCtx = null
    this.plugins = []
    this._rafId = null
    this._boundLoop = this._loop.bind(this)
  }

  async _init(pluginInstances, initialKey) {
    // Audio context must be created/resumed on user gesture; create suspended here.
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    for (const p of pluginInstances) {
      p._host = this
      p._engine = this.engine
      p._audioCtx = this.audioCtx
      if (typeof p.init === 'function') await p.init(this.engine, this.audioCtx)
      this.plugins.push(p)
    }

    this._bindCanvasInput()
    this.engine.setActiveKey(initialKey)
    EventBus.emit('key:change', { from: null, to: initialKey })

    // Notify UI plugins of initial active key after they've all been inited.
    for (const p of this.plugins) {
      if (typeof p.onKeyChange === 'function') p.onKeyChange(initialKey, null)
    }

    this._loop()
  }

  _bindCanvasInput() {
    const uiPlugins = () => this.plugins.filter(p => p.constructor.type === 'ui')

    const dispatch = (e, method) => {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      const points = e.changedTouches
        ? [...e.changedTouches].map(t => ({ x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }))
        : [{ x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }]

      for (const { x, y } of points) {
        for (const ui of uiPlugins()) {
          if (typeof ui[method] === 'function') ui[method](x, y, e)
        }
      }
      if (e.cancelable) e.preventDefault()
    }

    this.canvas.addEventListener('pointerdown',  e => dispatch(e, 'onPointerDown'),  { passive: false })
    this.canvas.addEventListener('pointerup',    e => dispatch(e, 'onPointerUp'),    { passive: false })
    this.canvas.addEventListener('pointermove',  e => dispatch(e, 'onPointerMove'),  { passive: false })
    this.canvas.addEventListener('pointerleave', e => dispatch(e, 'onPointerLeave'), { passive: false })
  }

  // Called by UI plugins when the user activates a key.
  pressKey(code) {
    this._ensureAudio()
    const prev = this.engine.activeCode
    this.engine.setActiveKey(code)

    for (const p of this.plugins) {
      if (typeof p.onKeyPress === 'function') p.onKeyPress(code)
    }
    if (prev !== code) {
      EventBus.emit('key:change', { from: prev, to: code })
      for (const p of this.plugins) {
        if (typeof p.onKeyChange === 'function') p.onKeyChange(code, prev)
      }
    }
    EventBus.emit('key:press', { code })
  }

  async swapInstrument(PluginClass) {
    const idx = this.plugins.findIndex(p => p.constructor.type === 'instrument')
    const toRemove = this.plugins.filter(p => p.constructor.type === 'instrument')
    for (const p of toRemove) p.destroy?.()
    this.plugins = this.plugins.filter(p => p.constructor.type !== 'instrument')

    const p = new PluginClass()
    p._host = this
    p._engine = this.engine
    p._audioCtx = this.audioCtx
    if (typeof p.init === 'function') await p.init(this.engine, this.audioCtx)
    this.plugins.splice(idx < 0 ? this.plugins.length : idx, 0, p)

    EventBus.emit('instrument:changed', { id: PluginClass.id })
  }

  releaseKey(code) {
    for (const p of this.plugins) {
      if (typeof p.onKeyRelease === 'function') p.onKeyRelease(code)
    }
    EventBus.emit('key:release', { code })
  }

  _ensureAudio() {
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume()
  }

  _loop() {
    const { canvas, ctx } = this
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of this.plugins) {
      if (typeof p.render === 'function') p.render(canvas, ctx)
    }
    this._rafId = requestAnimationFrame(this._boundLoop)
  }

  destroy() {
    cancelAnimationFrame(this._rafId)
    for (const p of this.plugins) {
      if (typeof p.destroy === 'function') p.destroy()
    }
    this.audioCtx.close()
  }
}
