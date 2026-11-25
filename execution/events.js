const { EventEmitter } = require('events');

class RunEventBus {
  constructor() {
    this.events = new Map();
    this.sequences = new Map();
    this.emitters = new Map();
  }

  publish(runId, type, payload = {}) {
    const sequence = (this.sequences.get(runId) || 0) + 1;
    this.sequences.set(runId, sequence);
    const event = {
      id: `${runId}:${sequence}`,
      sequence,
      runId,
      type,
      kind: type.split('.')[0],
      timestamp: new Date().toISOString(),
      ...payload,
    };
    const events = this.events.get(runId) || [];
    events.push(event);
    if (events.length > 2000) events.splice(0, events.length - 2000);
    this.events.set(runId, events);
    const emitter = this.emitters.get(runId);
    if (emitter) emitter.emit('event', event);
    return event;
  }

  seed(runId, events = []) {
    if (!events.length) return;
    const copy = events.map(event => ({ ...event }));
    this.events.set(runId, copy.slice(-2000));
    this.sequences.set(runId, Math.max(...copy.map(event => Number(event.sequence) || 0)));
  }

  getSince(runId, since = 0) {
    const sequence = Number(since) || 0;
    return (this.events.get(runId) || []).filter(event => event.sequence > sequence);
  }

  subscribe(runId, listener) {
    let emitter = this.emitters.get(runId);
    if (!emitter) {
      emitter = new EventEmitter();
      this.emitters.set(runId, emitter);
    }
    emitter.on('event', listener);
    return () => {
      emitter.off('event', listener);
      if (emitter.listenerCount('event') === 0) this.emitters.delete(runId);
    };
  }
}

module.exports = { RunEventBus };
