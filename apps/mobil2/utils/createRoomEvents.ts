// Hafif global event bus — Tab Bar → Home ekranı arası sinyal için
type Listener = () => void;

const listeners: Listener[] = [];

export const createRoomEvents = {
  emit() {
    listeners.forEach((fn) => fn());
  },
  subscribe(fn: Listener) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  },
};
