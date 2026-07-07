import type { ConfigData } from '@/core/feature/types';
import { injectStyle } from '@/utils';

import type { PanelCategoryItem, PanelClient } from './client';
import {
  defaultHandlePosition,
  EdgeHandle,
  HANDLE_HEIGHT,
  isDockedLeft,
} from './components/EdgeHandle';
import { FeatureRow } from './components/FeatureRow';
import { Footer } from './components/Footer';
import {
  loadPanelState,
  type PanelPlacement,
  type PanelPosition,
  saveBubblePosition,
} from './persistence';
import style from './style.scss?inline';

import { useEffect, useMemo, useState } from 'preact/hooks';

export interface PanelAppProps {
  client: PanelClient;
  mode: 'inline' | 'docked';
  canUsePlugin: boolean;
  onToggleReady?: (toggle: () => void) => void;
  container: ParentNode;
}

export const PanelApp = ({
  client,
  mode,
  canUsePlugin,
  onToggleReady,
  container,
}: PanelAppProps) => {
  useEffect(() => {
    const { remove } = injectStyle(style, { target: container });

    return remove;
  }, []);

  const [categories, setCategories] = useState<PanelCategoryItem[]>(() =>
    client.getSnapshot(),
  );

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [open, setOpen] = useState(mode === 'docked');

  const [handlePosition, setHandlePosition] = useState<PanelPosition | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  const [placement, setPlacement] = useState<PanelPlacement>('web');
  const [toggleShortcut, setToggleShortcut] = useState('ctrl+shift+u');

  // Docked mode (side panel) never depends on a persisted handle position,
  // so it's ready immediately. Inline mode waits for the real persisted
  // side/position to load before rendering anything - otherwise it would
  // briefly render docked to the default (right) side, then visibly slide
  // across the screen once the real (possibly left-docked) position loads.
  const [ready, setReady] = useState(mode === 'docked');

  // load persisted state
  useEffect(() => {
    let cancelled = false;

    loadPanelState().then((state) => {
      if (cancelled) return;

      setHandlePosition(state.bubblePosition);
      setPlacement(state.placement);
      setToggleShortcut(state.toggleShortcut);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  // client sync
  useEffect(() => {
    return client.onChange(() => {
      setCategories(client.getSnapshot());
    });
  }, [client]);

  // default active category
  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]!.category);
    }
  }, [categories, activeCategory]);

  // expose toggle
  useEffect(() => {
    if (!onToggleReady) return;
    onToggleReady(() => setOpen((v) => !v));
  }, [onToggleReady]);

  const toggleOpen = () => {
    setOpen((prev) => !prev);
  };

  // search filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;

    return categories
      .map((category) => ({
        ...category,
        groups: category.groups
          .map((group) => ({
            ...group,
            features: group.features.filter(
              (feature) =>
                feature.id
                  .split('.')
                  .some((part) => part.toLowerCase().includes(q)) ||
                feature.label.name.toLowerCase().includes(q) ||
                (feature.label.description ?? '').toLowerCase().includes(q),
            ),
          }))
          .filter((group) => group.features.length > 0),
      }))
      .filter((category) => category.groups.length > 0);
  }, [categories, query]);

  const active =
    filtered.find((c) => c.category === activeCategory) ?? filtered[0];

  // handle position (controlled)
  const position = handlePosition ?? defaultHandlePosition();
  const dockedLeft = isDockedLeft(position);

  const shellStyle =
    mode === 'inline'
      ? {
          top: `${position.y + HANDLE_HEIGHT / 2}px`,
          left: dockedLeft ? undefined : 'auto',
          right: dockedLeft ? 'auto' : undefined,
        }
      : undefined;

  const shellHidden = mode === 'inline' && dragging;

  return (
    <div class="mk-component mk-panel-root" data-mode={mode}>
      {(mode === 'docked' || ready) && (
        <div
          class={[
            'mk-panel-shell',
            open && 'is-open',
            shellHidden && 'edge-dragging',
          ]
            .filter(Boolean)
            .join(' ')}
          data-mode={mode}
          data-side={mode === 'inline' && dockedLeft ? 'left' : 'right'}
          style={shellStyle}
        >
          <div class="mk-panel-header">
            <span class="mk-panel-title">ULearn 設定</span>

            {mode === 'inline' && (
              <button
                type="button"
                class="mk-panel-close"
                onClick={toggleOpen}
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>

          <input
            class="mk-panel-search"
            type="text"
            placeholder="搜尋功能..."
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          />

          <div class="mk-panel-tabs">
            {filtered.map((category) => (
              <button
                key={category.category}
                type="button"
                class={`mk-panel-tab${
                  category.category === active?.category ? ' is-active' : ''
                }`}
                onClick={() => setActiveCategory(category.category)}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div class="mk-panel-body">
            {!active || active.groups.length === 0 ? (
              <div class="mk-panel-empty">沒有符合的功能</div>
            ) : (
              active.groups.map((group) => (
                <div key={group.group ?? 'default'}>
                  <div class="mk-panel-group-label">{group.label}</div>

                  {group.features.map((item) => (
                    <FeatureRow
                      key={item.id}
                      item={item}
                      onToggle={(enabled) =>
                        void client.setEnabled(item.id, enabled)
                      }
                      onFieldChange={(key, value) =>
                        void client.setConfig(item.id, {
                          [key]: value,
                        } as Partial<ConfigData>)
                      }
                    />
                  ))}
                </div>
              ))
            )}
          </div>

          <Footer
            client={client}
            placement={placement}
            canUsePlugin={canUsePlugin}
            toggleShortcut={toggleShortcut}
            onPlacementChange={setPlacement}
          />
        </div>
      )}

      {mode === 'inline' && ready && (
        <EdgeHandle
          position={position}
          onClick={toggleOpen}
          onDraggingChange={setDragging}
          onMove={(pos) => {
            setOpen(false);
            setHandlePosition(pos);
            void saveBubblePosition(pos);
          }}
        />
      )}
    </div>
  );
};
