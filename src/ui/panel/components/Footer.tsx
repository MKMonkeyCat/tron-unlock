import type { ConfigData, FeatureId } from '@/core/feature/types';

import type { PanelClient } from '../client';
import type { PanelPlacement } from '../persistence';
import { loadPanelState, savePlacement } from '../persistence';

export interface FooterProps {
  client: PanelClient;
  placement: PanelPlacement;
  canUsePlugin: boolean;
  toggleShortcut: string;
  onPlacementChange: (placement: PanelPlacement) => void;
}

export const Footer = ({
  client,
  placement,
  canUsePlugin,
  toggleShortcut,
  onPlacementChange,
}: FooterProps) => {
  const handleExport = async () => {
    const state = await loadPanelState();
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ulearn-script-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as {
          overrides?: Record<string, boolean>;
          configs?: Record<string, Record<string, unknown>>;
        };

        for (const [id, enabled] of Object.entries(parsed.overrides ?? {})) {
          await client.setEnabled(id as FeatureId, enabled);
        }
        for (const [id, config] of Object.entries(parsed.configs ?? {})) {
          await client.setConfig(
            id as FeatureId,
            config as Partial<ConfigData>,
          );
        }
      } catch {
        // Ignore malformed import files.
      }
    };
    input.click();
  };

  return (
    <div class="mk-panel-footer">
      <button type="button" class="mk-panel-footer-btn" onClick={handleExport}>
        匯出
      </button>
      <button type="button" class="mk-panel-footer-btn" onClick={handleImport}>
        匯入
      </button>
      {canUsePlugin ? (
        <select
          value={placement}
          onChange={(e) => {
            const next = (e.target as HTMLSelectElement)
              .value as PanelPlacement;
            void savePlacement(next);
            onPlacementChange(next);
          }}
        >
          <option value="web">頁內面板</option>
          <option value="plugin">側邊欄</option>
        </select>
      ) : null}
      <span class="mk-panel-shortcut-hint">{toggleShortcut}</span>
    </div>
  );
};
