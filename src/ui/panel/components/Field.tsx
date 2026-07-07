import type { FeatureSchemaField } from '@/core/feature/types';

export interface FieldProps {
  field: FeatureSchemaField<string, any>;
  label?: string;
  description?: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

const FieldKey = ({
  label,
  description,
}: {
  label: string;
  description?: string;
}) => (
  <span class="mk-panel-field-key">
    {label}
    {description ? (
      <span class="mk-panel-tooltip">
        <span class="mk-panel-tooltip-icon" tabIndex={0}>
          ?
        </span>
        <span class="mk-panel-tooltip-content">{description}</span>
      </span>
    ) : null}
  </span>
);

const coerce = (raw: string, sample: unknown): unknown => {
  if (typeof sample === 'number') {
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? sample : parsed;
  }
  if (typeof sample === 'boolean') return raw === 'true';
  return raw;
};

const clampNumber = (
  n: number,
  min: number | undefined,
  max: number | undefined,
) => {
  let v = n;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  return v;
};

export const Field = ({
  field,
  label,
  description,
  value,
  onChange,
}: FieldProps) => {
  const fieldLabel = label ?? field.key;

  if (field.type === 'toggle') {
    return (
      <label class="mk-panel-field">
        <FieldKey label={fieldLabel} description={description} />
        <span class="mk-panel-checkbox">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
          />
          <svg
            class="mk-panel-checkbox-mark"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M3.5 8.5l3 3 6-6" />
          </svg>
        </span>
      </label>
    );
  }

  if (field.type === 'number') {
    const step = field.step ?? 1;
    const numValue = Number(value);

    return (
      <label class="mk-panel-field">
        <FieldKey label={fieldLabel} description={description} />
        <span class="mk-panel-number">
          <button
            type="button"
            class="mk-panel-number-btn"
            aria-label="decrease"
            onClick={() =>
              onChange(clampNumber(numValue - step, field.min, field.max))
            }
          >
            −
          </button>
          <input
            type="number"
            step={step}
            min={field.min}
            max={field.max}
            value={numValue}
            onInput={(e) =>
              onChange(
                clampNumber(
                  Number((e.target as HTMLInputElement).value),
                  field.min,
                  field.max,
                ),
              )
            }
          />
          <button
            type="button"
            class="mk-panel-number-btn"
            aria-label="increase"
            onClick={() =>
              onChange(clampNumber(numValue + step, field.min, field.max))
            }
          >
            +
          </button>
        </span>
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label class="mk-panel-field">
        <FieldKey label={fieldLabel} description={description} />
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
      <FieldKey label={fieldLabel} description={description} />
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
