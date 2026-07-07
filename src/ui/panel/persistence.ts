import { createStorage } from '@/core/storage';
import { win } from '@/utils/dom/element';

import {
  fromRelativePosition,
  type RelativeBubblePosition,
  toRelativePosition,
} from './components/EdgeHandle';

export type PanelPlacement = 'web' | 'plugin';

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelState {
  placement: PanelPlacement;
  toggleShortcut: string;
  overrides: Record<string, boolean>;
  configs: Record<string, Record<string, unknown>>;
  bubblePosition: PanelPosition | null;
}

const DEFAULT_STATE: PanelState = {
  placement: 'web',
  toggleShortcut: 'ctrl+shift+u',
  overrides: {},
  configs: {},
  bubblePosition: null,
};

const panelStore = createStorage({ namespace: 'mk-panel' });

const getOr = async <T>(key: string, fallback: T): Promise<T> =>
  (await panelStore.get(key, fallback)) ?? fallback;

const viewport = () => ({ width: win.innerWidth, height: win.innerHeight });

export const loadPanelState = async (): Promise<PanelState> => {
  const storedBubble = await getOr<RelativeBubblePosition | null>(
    'bubblePosition',
    null,
  );

  return {
    placement: await getOr('placement', DEFAULT_STATE.placement),
    toggleShortcut: await getOr(
      'toggleShortcut',
      DEFAULT_STATE.toggleShortcut,
    ),
    overrides: await getOr('overrides', DEFAULT_STATE.overrides),
    configs: await getOr('configs', DEFAULT_STATE.configs),
    bubblePosition: storedBubble
      ? fromRelativePosition(storedBubble, viewport())
      : null,
  };
};

export const savePlacement = async (placement: PanelPlacement) => {
  await panelStore.set('placement', placement);
};

export const saveToggleShortcut = async (shortcut: string) => {
  await panelStore.set('toggleShortcut', shortcut);
};

export const saveOverride = async (id: string, value: boolean | null) => {
  const overrides = await getOr('overrides', DEFAULT_STATE.overrides);
  const next = { ...overrides };
  if (value === null) delete next[id];
  else next[id] = value;
  await panelStore.set('overrides', next);
};

export const saveFeatureConfig = async (
  id: string,
  patch: Record<string, unknown>,
) => {
  const configs = await getOr('configs', DEFAULT_STATE.configs);
  const next = { ...configs, [id]: { ...(configs[id] ?? {}), ...patch } };
  await panelStore.set('configs', next);
};

export const saveBubblePosition = async (position: PanelPosition | null) => {
  await panelStore.set(
    'bubblePosition',
    position ? toRelativePosition(position, viewport()) : null,
  );
};
