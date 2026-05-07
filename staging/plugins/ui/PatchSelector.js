import { PluginRegistry } from '../../core/PluginRegistry.js'
import { EventBus } from '../../core/EventBus.js'

// Height of the top bar in CSS px — exported so WheelUI can offset itself.
export const PATCH_BAR_HEIGHT = 56

export class PatchSelector {
  static type = 'ui'
  static id = 'patch-selector'
  static version = '1.0.0'

  constructor(opts = {}) {
    this._el = null
    this._host = null
    this._activeId = null
    this._polyBtn = null
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
      top: 0; left: 0; right: 0;
      height: ${PATCH_BAR_HEIGHT}px;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      background: rgba(10, 10, 20, 0.88);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid #223;
      box-sizing: border-box;
    `

    const label = document.createElement('span')
    label.textContent = 'PATCH'
    label.style.cssText = `
      font: 600 9px/1 system-ui, sans-serif;
      letter-spacing: 0.14em;
      color: #556;
      flex-shrink: 0;
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
        padding: 6px 12px;
        font: 600 12px/1 system-ui, sans-serif;
        cursor: pointer;
        white-space: nowrap;
        -webkit-tap-highlight-color: transparent;
      `
      btn.addEventListener('click', () => this._host.swapInstrument(PluginClass))
      el.appendChild(btn)
    }

    // Push POLY to the right
    const spacer = document.createElement('div')
    spacer.style.cssText = 'flex: 1'
    el.appendChild(spacer)

    const divider = document.createElement('div')
    divider.style.cssText = 'width:1px;height:24px;background:#223;flex-shrink:0'
    el.appendChild(divider)

    const polyBtn = document.createElement('button')
    polyBtn.textContent = 'POLY'
    polyBtn.dataset.poly = 'off'
    polyBtn.style.cssText = `
      background: #1a1a2a;
      color: #aab;
      border: 1px solid #334;
      border-radius: 6px;
      padding: 6px 12px;
      font: 700 11px/1 system-ui, sans-serif;
      letter-spacing: 0.08em;
      cursor: pointer;
      flex-shrink: 0;
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
    this._polyBtn.style.background  = on ? '#1a3a2a' : '#1a1a2a'
    this._polyBtn.style.color       = on ? '#44cc88' : '#aab'
    this._polyBtn.style.borderColor = on ? '#336644' : '#334'
  }

  _setActive(id) {
    this._activeId = id
    if (!this._el) return
    for (const btn of this._el.querySelectorAll('button[data-id]')) {
      const isActive = btn.dataset.id === id
      btn.style.background  = isActive ? '#2a3a6a' : '#1a1a2a'
      btn.style.color       = isActive ? '#88aaff' : '#aab'
      btn.style.borderColor = isActive ? '#4466bb' : '#334'
    }
  }

  render() {}
  onKeyPress() {}
  onKeyRelease() {}
  onKeyChange() {}

  destroy() {
    this._el?.remove()
  }
}
