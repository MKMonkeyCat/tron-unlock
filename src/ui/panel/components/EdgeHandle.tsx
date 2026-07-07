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

const clampY = (y: number) =>
  Math.min(
    Math.max(y, EDGE_MARGIN),
    win.innerHeight - HANDLE_HEIGHT - EDGE_MARGIN,
  );

const snapX = (x: number) =>
  x + HANDLE_WIDTH / 2 < win.innerWidth / 2 ? 0 : win.innerWidth - HANDLE_WIDTH;

export const isDockedLeft = (position: PanelPosition) =>
  position.x + HANDLE_WIDTH / 2 < win.innerWidth / 2;

const ballTopLeft = (clientX: number, clientY: number) => ({
  x: clientX - DRAG_BALL_SIZE / 2,
  y: clampY(clientY - DRAG_BALL_SIZE / 2),
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
      onMove({ x: snapX(position.x), y: clampY(position.y) });
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
