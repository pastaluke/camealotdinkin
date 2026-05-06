import { EventBus } from './EventBus.js'

const _registry = new Map()

export const PluginRegistry = {
  register(PluginClass) {
    _registry.set(PluginClass.id, PluginClass)
  },

  get(id) { return _registry.get(id) ?? null },

  all() { return [..._registry.values()] },

  byType(type) { return [..._registry.values()].filter(C => C.type === type) },

  instantiate(PluginClass, engine, audioCtx) {
    const instance = new PluginClass(engine, audioCtx)
    EventBus.emit('plugin:loaded', { id: PluginClass.id })
    return instance
  },
}
