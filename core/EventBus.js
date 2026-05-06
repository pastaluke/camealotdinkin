const _listeners = new Map()

export const EventBus = {
  on(event, fn) {
    if (!_listeners.has(event)) _listeners.set(event, new Set())
    _listeners.get(event).add(fn)
  },
  off(event, fn) {
    _listeners.get(event)?.delete(fn)
  },
  emit(event, data) {
    _listeners.get(event)?.forEach(fn => fn(data))
  },
}
