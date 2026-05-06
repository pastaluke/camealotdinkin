import { PluginRegistry } from '../../core/PluginRegistry.js'
import { EventBus } from '../../core/EventBus.js'

// PatchSelector — floating HTML overlay listing all registered instrument plugins.
// Tapping a patch swaps the active instrument live via host.swapInstrument().
// Discovers plugins from PluginRegistry automatically — no hardcoding needed.

export class PatchSelector {
  static type = 'ui'
  static id = 'patch-selector'
  static version = '1.0.0'

  constructor(opts = {}) {
    this._el = null
    this._host = null
    this._activeId = null
  }

  init(engine, audioCtx) {
    this._buildDOM()
    EventBus.on('instrument:changed', ({ id }) => {
      this._setActive(id)
      const instrument = this._host?.plugins.find(p => p.constructor.type === 'instrument')
      if (instrument) this._syncPoly(instrument.polyphonic)
    })
  }

  _buildDOM() {
    const el = document.createElement('div')
    el.style.cssText = `
      position: fixed;
      top: 14px;
      left: 14px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 6px;
      pointer-events: auto;
    `

    const label = document.createElement('div')
    label.textContent = 'PATCH'
    label.style.cssText = `
      font: 600 9px/1 system-ui, sans-serif;
      letter-spacing: 0.12em;
      color: #667;
      padding-left: 2px;
    `
    el.appendChild(label)

    for (const PluginClass of PluginRegistry.byType('instrument')) {
      const btn = document.createElement('button')
      btn.textContent = PluginClass.label ?? PluginClass.id
      btn.title = PluginClass.description ?? ''
      btn.dataset.id = PluginClass.id
      btn.style.cssText = `
        background: #1a1a2a;
        color: #aab;
        border: 1px solid #334;
        border-radius: 6px;
        padding: 8px 14px;
        font: 600 12px/1 system-ui, sans-serif;
        cursor: pointer;
        text-align: left;
        min-width: 100px;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
        -webkit-tap-highlight-color: transparent;
      `
      btn.addEventListener('click', () => {
        this._host.swapInstrument(PluginClass)
      })
      el.appendChild(btn)
    }

    // Poly toggle
    const divider = document.createElement('div')
    divider.style.cssText = 'height:1px;background:#223;margin:2px 0'
    el.appendChild(divider)

    const polyBtn = document.createElement('button')
    polyBtn.textContent = 'POLY'
    polyBtn.dataset.poly = 'off'
    polyBtn.style.cssText = `
      background: #1a1a2a;
      color: #aab;
      border: 1px solid #334;
      border-radius: 6px;
      padding: 8px 14px;
      font: 700 11px/1 system-ui, sans-serif;
      letter-spacing: 0.08em;
      cursor: pointer;
      text-align: left;
      -webkit-tap-highlight-color: transparent;
    `
    polyBtn.addEventListener('click', () => {
      const instrument = this._host?.plugins.find(p => p.constructor.type === 'instrument')
      if (!instrument) return
      instrument.polyphonic = !instrument.polyphonic
      this._syncPoly(instrument.polyphonic)
    })
    el.appendChild(polyBtn)
    this._polyBtn = polyBtn

    document.body.appendChild(el)
    this._el = el

    const active = this._host?.plugins.find(p => p.constructor.type === 'instrument')
    if (active) {
      this._setActive(active.constructor.id)
      this._syncPoly(active.polyphonic)
    }
  }

  _syncPoly(on) {
    if (!this._polyBtn) return
    this._polyBtn.dataset.poly = on ? 'on' : 'off'
    this._polyBtn.style.background  = on ? '#1a3a2a' : '#1a1a2a'
    this._polyBtn.style.color       = on ? '#44cc88' : '#aab'
    this._polyBtn.style.borderColor = on ? '#336644' : '#334'
  }

  _setActive(id) {
    this._activeId = id
    if (!this._el) return
    for (const btn of this._el.querySelectorAll('button')) {
      const isActive = btn.dataset.id === id
      btn.style.background    = isActive ? '#2a3a6a' : '#1a1a2a'
      btn.style.color         = isActive ? '#88aaff' : '#aab'
      btn.style.borderColor   = isActive ? '#4466bb' : '#334'
    }
  }

  // PatchSelector has no canvas rendering — it manages its own DOM.
  render() {}
  onKeyPress() {}
  onKeyRelease() {}
  onKeyChange() {}

  destroy() {
    this._el?.remove()
    EventBus.off('instrument:changed', this._setActive)
  }
}
