// Headless smoke test: boots dist/game/main.js under a minimal DOM shim and
// runs ~60 simulated frames (including key input) to catch runtime errors.
// Usage: npm run build && node tools/smoke.mjs

const noop = () => {};

function makeContext2d() {
  // Any method becomes a no-op; any property is settable/gettable.
  const store = {};
  return new Proxy(store, {
    get(t, prop) {
      if (prop in t) return t[prop];
      return noop;
    },
    set(t, prop, value) {
      t[prop] = value;
      return true;
    },
  });
}

function makeCanvas() {
  return {
    width: 0,
    height: 0,
    style: {},
    getContext: () => makeContext2d(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    addEventListener: noop,
    removeEventListener: noop,
    focus: noop,
  };
}

const canvas = makeCanvas();
const windowListeners = new Map();
const docListeners = new Map();

const rafCallbacks = [];
globalThis.requestAnimationFrame = (cb) => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
};
globalThis.cancelAnimationFrame = noop;

globalThis.document = {
  hidden: false,
  getElementById: (id) => (id === "game" ? canvas : null),
  createElement: (tag) => (tag === "canvas" ? makeCanvas() : {}),
  addEventListener: (type, fn) => docListeners.set(type, fn),
  removeEventListener: noop,
};

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};

globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  addEventListener: (type, fn) => windowListeners.set(type, fn),
  removeEventListener: noop,
};

try {
  await import("../dist/game/main.js");

  // Drive 60 frames at ~16.7ms; press D (move right) partway through,
  // release near the end, and fire a save via the pagehide handler.
  let t = 0;
  for (let frame = 0; frame < 60; frame++) {
    t += 16.7;
    if (frame === 10) windowListeners.get("keydown")?.({ code: "KeyD", repeat: false, preventDefault: noop });
    if (frame === 30) windowListeners.get("keydown")?.({ code: "KeyW", repeat: false, preventDefault: noop });
    if (frame === 50) windowListeners.get("keyup")?.({ code: "KeyD", preventDefault: noop });
    const pending = rafCallbacks.splice(0, rafCallbacks.length);
    for (const cb of pending) cb(t);
  }
  windowListeners.get("pagehide")?.();

  const saved = storage.get("path-of-ascension.save");
  if (!saved) throw new Error("pagehide did not write a save");
  const parsed = JSON.parse(saved);
  if (parsed.version !== 1 || typeof parsed.player.x !== "number") {
    throw new Error("save shape unexpected: " + saved);
  }
  console.log("PASS  booted, ran 60 frames with input, saved:", JSON.stringify(parsed.player));
  console.log("\nSmoke test passed.");
  process.exit(0);
} catch (err) {
  console.error("FAIL  smoke test:", err);
  process.exit(1);
}
