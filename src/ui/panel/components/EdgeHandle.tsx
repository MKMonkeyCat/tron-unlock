import { skipHookFunc } from '@/hook';
import { win } from '@/utils/dom/element';

import type { PanelPosition } from '../persistence';

import { useEffect, useRef, useState } from 'preact/hooks';

export const HANDLE_WIDTH = 10;
export const HANDLE_HEIGHT = 160;

export const DRAG_BALL_SIZE = 24; // px

const EDGE_MARGIN = 24;
const DRAG_THRESHOLD = 5;

export const defaultHandlePosition = (): PanelPosition => ({
  x: win.innerWidth - HANDLE_WIDTH,
  y: win.innerHeight / 2 - HANDLE_HEIGHT / 2,
});

const clampYFor = (y: number, viewportHeight: number) =>
  Math.min(
    Math.max(y, EDGE_MARGIN),
    viewportHeight - HANDLE_HEIGHT - EDGE_MARGIN,
  );

const clampY = (y: number) => clampYFor(y, win.innerHeight);

export const isDockedLeft = (position: PanelPosition) =>
  position.x + HANDLE_WIDTH / 2 < win.innerWidth / 2;

const ballTopLeft = (clientX: number, clientY: number) => ({
  x: clientX - DRAG_BALL_SIZE / 2,
  y: clampY(clientY - DRAG_BALL_SIZE / 2),
});

export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * Docked side + y as a %-of-height - resolution independent, so a position
 * captured against one viewport (a resize, a saved/reloaded session) still
 * lands in the same relative spot against a differently sized one.
 */
export interface RelativeBubblePosition {
  side: 'left' | 'right';
  yPercent: number;
}

export const toRelativePosition = (
  position: PanelPosition,
  viewport: ViewportSize,
): RelativeBubblePosition => ({
  side:
    position.x + HANDLE_WIDTH / 2 < viewport.width / 2 ? 'left' : 'right',
  yPercent: (position.y / viewport.height) * 100,
});

export const fromRelativePosition = (
  relative: RelativeBubblePosition,
  viewport: ViewportSize,
): PanelPosition => ({
  x: relative.side === 'left' ? 0 : viewport.width - HANDLE_WIDTH,
  y: clampYFor((relative.yPercent / 100) * viewport.height, viewport.height),
});

interface DragState {
  pointerId: number;

  startX: number;
  startY: number;

  origin: PanelPosition;
  lastX: number;
  lastY: number;

  moved: number;
}

export interface EdgeHandleProps {
  position: PanelPosition;
  onMove(position: PanelPosition): void;
  onClick(): void;
  onDraggingChange?(dragging: boolean): void;
}

export const EdgeHandle = ({
  position,
  onMove,
  onClick,
  onDraggingChange,
}: EdgeHandleProps) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const viewportRef = useRef<ViewportSize>({
    width: win.innerWidth,
    height: win.innerHeight,
  });

  const [dragging, setDragging] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handlePointerDown = (e: PointerEvent) => {
    handleRef.current?.setPointerCapture(e.pointerId);

    dragRef.current = {
      pointerId: e.pointerId,

      startX: e.clientX,
      startY: e.clientY,

      origin: position,
      lastX: e.clientX,
      lastY: e.clientY,

      moved: 0,
    };

    setDragging(true);
    setDragActive(false);
  };

  useEffect(() => {
    if (!dragging) return;

    const onMovePointer = skipHookFunc((e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      drag.lastX = e.clientX;
      drag.lastY = e.clientY;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      drag.moved = Math.hypot(dx, dy);

      if (!dragActive && drag.moved < DRAG_THRESHOLD) return;
      if (!dragActive) {
        setDragActive(true);
        onDraggingChange?.(true);
      }

      onMove(ballTopLeft(e.clientX, e.clientY));
    });

    const finish = skipHookFunc(() => {
      const drag = dragRef.current;
      dragRef.current = null;

      setDragging(false);
      setDragActive(false);
      onDraggingChange?.(false);

      if (!drag) return;

      handleRef.current?.releasePointerCapture(drag.pointerId);

      if (drag.moved < DRAG_THRESHOLD) {
        onClick();
        return;
      }

      onMove({
        x: drag.lastX < win.innerWidth / 2 ? 0 : win.innerWidth - HANDLE_WIDTH,
        y: clampY(drag.lastY - HANDLE_HEIGHT / 2),
      });
    });

    win.addEventListener('pointermove', onMovePointer);
    win.addEventListener('pointerup', finish);
    win.addEventListener('pointercancel', finish);

    return () => {
      win.removeEventListener('pointermove', onMovePointer);
      win.removeEventListener('pointerup', finish);
      win.removeEventListener('pointercancel', finish);
    };
  }, [dragging, onMove, onClick]);

  useEffect(() => {
    const onResize = skipHookFunc(() => {
      // Read the docked side + y% against the viewport size the position
      // was last valid for, then re-derive pixels against the new one - a
      // plain re-clamp would compare stale pixels to the new width/height
      // and could flip sides or drift toward the top on a big resize.
      const relative = toRelativePosition(position, viewportRef.current);

      viewportRef.current = { width: win.innerWidth, height: win.innerHeight };
      onMove(fromRelativePosition(relative, viewportRef.current));
    });

    win.addEventListener('resize', onResize);
    return () => win.removeEventListener('resize', onResize);
  }, [position, onMove]);

  const dockedLeft = isDockedLeft(position);

  return (
    <div
      ref={handleRef}
      class={'mk-panel-edge-handle' + (dragActive ? ' is-dragging' : '')}
      data-side={dockedLeft ? 'left' : 'right'}
      style={{
        top: `${position.y}px`,
        left: dragActive ? `${position.x}px` : undefined,
        '--mk-ball-size': `${DRAG_BALL_SIZE}px`,
      }}
      onPointerDown={handlePointerDown}
      aria-label="Toggle settings panel"
    />
  );
};
