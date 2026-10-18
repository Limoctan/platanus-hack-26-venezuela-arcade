// Loads game.js (a classic browser script with no imports) inside a node:vm
// sandbox with Phaser/window stubs, exposing its top-level pure functions
// for testing. Nothing here ships with the game.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const gamePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game.js');
const code = readFileSync(gamePath, 'utf8');

export function loadGame() {
  const sandbox = {
    console,
    Phaser: {
      AUTO: 0,
      Scale: { FIT: 0, CENTER_BOTH: 0 },
      Game: class {
        constructor() {}
      },
      Math: {
        Clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
        Wrap: (value, min, max) => (((value - min) % (max - min) + (max - min)) % (max - min)) + min,
        Between: (min, max) => min,
        FloatBetween: (min, max) => min,
        RND: { pick: (array) => array[0] },
      },
    },
    window: {
      addEventListener() {},
      removeEventListener() {},
      localStorage: {
        getItem: () => null,
        setItem() {},
      },
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'game.js' });
  return sandbox;
}

// Reads a top-level `const`/`let` binding (the like of DEFEAT_LINES) that is
// scoped lexically and therefore invisible on the sandbox global object.
export function readGameBinding(sandbox, name) {
  return vm.runInContext(`(${name})`, sandbox, { filename: 'game.js' });
}
