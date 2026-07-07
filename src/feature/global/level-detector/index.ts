import { clamp, rand } from '@/utils';

type Vec2 = { x: number; y: number };

export const createHumanLikePointerBehavior = (
  target: Document,
  win: Window,
): (() => void) => {
  let stopped = false;

  const screenW = () => win.innerWidth;
  const screenH = () => win.innerHeight;

  let pos: Vec2 = {
    x: Math.random() * screenW(),
    y: Math.random() * screenH(),
  };

  let velocity: Vec2 = { x: 0, y: 0 };

  const updateVelocity = () => {
    velocity.x = velocity.x * 0.88 + (Math.random() - 0.5) * 4;
    velocity.y = velocity.y * 0.88 + (Math.random() - 0.5) * 4;
  };

  const fatigue = () => {
    velocity.x *= 0.985;
    velocity.y *= 0.985;
  };

  const burst = () => {
    if (Math.random() < 0.06) {
      velocity.x += rand(-10, 10);
      velocity.y += rand(-10, 10);
    }
  };

  // TODO check event `isTrusted` is true ?
  const emitMouse = () => {
    target.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: pos.x,
        clientY: pos.y,
        view: win,
      }),
    );
  };

  // const emitScroll = () => {
  //   target.dispatchEvent(
  //     new WheelEvent('wheel', { bubbles: true, deltaY: rand(-120, 120) }),
  //   );
  // };

  // const emitKey = () => {
  //   const el = target.activeElement ?? target;
  //   const key = pick(['Shift', 'Control', 'Alt']);

  //   el.dispatchEvent(
  //     new KeyboardEvent('keydown', {
  //       key,
  //       bubbles: true,
  //     }),
  //   );

  //   setTimeout(
  //     () => {
  //       el.dispatchEvent(
  //         new KeyboardEvent('keyup', {
  //           key,
  //           bubbles: true,
  //         }),
  //       );
  //     },
  //     rand(30, 120),
  //   );
  // };

  const step = () => {
    if (stopped) return;

    updateVelocity();
    burst();
    fatigue();

    pos.x += velocity.x;
    pos.y += velocity.y;

    pos.x = clamp(pos.x, 0, screenW());
    pos.y = clamp(pos.y, 0, screenH());

    emitMouse();

    // const r = Math.random();
    // if (r < 0.08) emitScroll();
    // else if (r < 0.12) emitKey();
  };

  const loop = () => {
    if (stopped) return;

    step();
    // Aim for around 60-70 events per second, but add some randomness to avoid being too regular
    setTimeout(loop, 16 + Math.random() * 80);
  };

  loop();

  return () => (stopped = true);
};
