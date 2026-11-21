// input.js — keyboard (WASD / arrows, Shift to run, Space to wait) plus an
// optional mouse click that sets a walk-to destination. One shared state
// object, read by the player update and the menus.

export function createInput(canvas) {
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    run: false,
    pressed: {}, // edge-triggered keys, consumed by the game loop
    click: null, // {x, y} in world coordinates, consumed by the game loop
  };
  const keys = {};

  function setKey(code, down) {
    keys[code] = down;
    input.left = !!(keys.KeyA || keys.ArrowLeft);
    input.right = !!(keys.KeyD || keys.ArrowRight);
    input.up = !!(keys.KeyW || keys.ArrowUp);
    input.down = !!(keys.KeyS || keys.ArrowDown);
    input.run = !!(keys.ShiftLeft || keys.ShiftRight);
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) input.pressed[e.code] = true;
    setKey(e.code, true);
  });
  window.addEventListener('keyup', (e) => setKey(e.code, false));
  window.addEventListener('blur', () => {
    for (const k of Object.keys(keys)) keys[k] = false;
    setKey('', false);
  });

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 960 / rect.width;
    const scaleY = 600 / rect.height;
    input.click = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  });

  return input;
}
