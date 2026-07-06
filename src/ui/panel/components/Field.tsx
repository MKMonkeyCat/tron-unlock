import type { FeatureSchemaField } from '@/core/feature/types';

export interface FieldProps {
  field: FeatureSchemaField<string, any>;
  value: unknown;
  onChange: (value: unknown) => void;
}

const coerce = (raw: string, sample: unknown): unknown => {
  if (typeof sample === 'number') {
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? sample : parsed;
  }
  if (typeof sample === 'boolean') return raw === 'true';
  return raw;
};

export const Field = ({ field, value, onChange }: FieldProps) => {
  if (field.type === 'toggle') {
    return (
      <label class="mk-panel-field">
        <span class="mk-panel-field-key">{field.key}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        />
      </label>
    );
  }

  if (field.type === 'number') {
    return (
      <label class="mk-panel-field">
        <span class="mk-panel-field-key">{field.key}</span>
        <input
          type="number"
          step={field.step}
          min={field.min}
          max={field.max}
          value={Number(value)}
          onInput={(e) =>
            onChange(Number((e.target as HTMLInputElement).value))
          }
        />
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label class="mk-panel-field">
        <span class="mk-panel-field-key">{field.key}</span>
        <select
          value={String(value)}
          onChange={(e) =>
            onChange(coerce((e.target as HTMLSelectElement).value, value))
          }
        >
          {field.options.map((option: unknown) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label class="mk-panel-field">
      <span class="mk-panel-field-key">{field.key}</span>
      <input
        type="text"
        value={String(value ?? '')}
        onInput={(e) =>
          onChange(coerce((e.target as HTMLInputElement).value, value))
        }
      />
    </label>
  );
};
