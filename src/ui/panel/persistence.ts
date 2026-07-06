import { createStorage } from '@/core/storage';

export type PanelPlacement = 'web' | 'plugin';

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelState {
  panelOpen: boolean;
  placement: PanelPlacement;
  toggleShortcut: string;
  overrides: Record<string, boolean>;
  configs: Record<string, Record<string, unknown>>;
  bubblePosition: PanelPosition | null;
  panelPosition: PanelPosition | null;
}

const DEFAULT_STATE: PanelState = {
  panelOpen: false,
  placement: 'web',
  toggleShortcut: 'ctrl+shift+u',
  overrides: {},
  configs: {},
  bubblePosition: null,
  panelPosition: null,
};

const panelStore = createStorage({ namespace: 'mk-panel' });

const getOr = async <T>(key: string, fallback: T): Promise<T> =>
  (await panelStore.get(key, fallback)) ?? fallback;

export const loadPanelState = async (): Promise<PanelState> => ({
  panelOpen: await getOr('panelOpen', DEFAULT_STATE.panelOpen),
  placement: await getOr('placement', DEFAULT_STATE.placement),
  toggleShortcut: await getOr('toggleShortcut', DEFAULT_STATE.toggleShortcut),
  overrides: await getOr('overrides', DEFAULT_STATE.overrides),
  configs: await getOr('configs', DEFAULT_STATE.configs),
  bubblePosition: await getOr('bubblePosition', DEFAULT_STATE.bubblePosition),
  panelPosition: await getOr('panelPosition', DEFAULT_STATE.panelPosition),
});

export const savePanelOpen = async (open: boolean) => {
  await panelStore.set('panelOpen', open);
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
  await panelStore.set('bubblePosition', position);
};

export const savePanelPosition = async (position: PanelPosition | null) => {
  await panelStore.set('panelPosition', position);
};
