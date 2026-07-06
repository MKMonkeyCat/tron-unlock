import { Field } from './Field';
import type { PanelFeatureItem } from '../client';

export interface FeatureRowProps {
  item: PanelFeatureItem;
  onToggle: (enabled: boolean) => void;
  onFieldChange: (key: string, value: unknown) => void;
}

export const FeatureRow = ({ item, onToggle, onFieldChange }: FeatureRowProps) => {
  return (
    <div class="mk-panel-row">
      <div class="mk-panel-row-main">
        <div class="mk-panel-row-text">
          <div class="mk-panel-row-name">{item.label.name}</div>
          {item.label.description ? (
            <div class="mk-panel-row-desc">{item.label.description}</div>
          ) : null}
        </div>
        <label class={`mk-panel-switch${item.enabled ? ' is-on' : ''}`}>
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(e) =>
              onToggle((e.target as HTMLInputElement).checked)
            }
          />
          <span class="mk-panel-switch-knob" />
        </label>
      </div>
      {item.enabled && item.fields.length > 0 ? (
        <div class="mk-panel-fields">
          {item.fields.map((field) => (
            <Field
              key={field.key}
              field={field}
              value={item.config[field.key]}
              onChange={(value) => onFieldChange(field.key, value)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
