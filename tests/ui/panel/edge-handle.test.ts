import {
  fromRelativePosition,
  HANDLE_WIDTH,
  toRelativePosition,
} from '../../../src/ui/panel/components/EdgeHandle';

import { describe, expect, test } from 'vitest';

describe('toRelativePosition / fromRelativePosition', () => {
  test('preserves docked side and y% across a viewport resize', () => {
    const oldViewport = { width: 1000, height: 800 };
    const newViewport = { width: 2000, height: 1600 };

    // docked to the right edge, a quarter of the way down
    const before = { x: 990, y: 200 };

    const relative = toRelativePosition(before, oldViewport);
    expect(relative).toEqual({ side: 'right', yPercent: 25 });

    const after = fromRelativePosition(relative, newViewport);
    expect(after).toEqual({
      x: newViewport.width - HANDLE_WIDTH,
      y: 400, // still 25% down the new, taller viewport
    });
  });

  test('a big resize does not flip a left-docked handle to the right', () => {
    // small viewport, docked left
    const before = { x: 0, y: 100 };
    const relative = toRelativePosition(before, { width: 400, height: 400 });
    expect(relative.side).toBe('left');

    // growing the viewport a lot must not re-derive the side from stale
    // pixels against the new width - it should stay left-docked
    const after = fromRelativePosition(relative, {
      width: 3000,
      height: 400,
    });
    expect(after.x).toBe(0);
  });
});
