import type { AnyFeature, FeatureSchemaField } from '@/core/feature/types';

import { SchemaFieldRenderer } from './SchemaFieldRenderer';

interface FeatureSectionProps {
  feature: AnyFeature;
}

export function FeatureSection({ feature }: FeatureSectionProps) {
  const handleToggleFeature = (enabled: boolean) => {
    // if (enabled) {
    //   feature.onEnable?.(/** ctx **/);
    // } else {
    //   feature.onDisable?.(/** ctx **/);
    // }
    // feature.onToggle?.(/** ctx **/, enabled);
  };

  return (
    <div class="feature-item-card">
      <header class="feature-item-header">
        <div>
          <h3>{feature.id}</h3>
        </div>
        <label class="switch">
          <input
            type="checkbox"
            onChange={(e) => handleToggleFeature(e.currentTarget.checked)}
          />
          <span class="slider"></span>
        </label>
      </header>

      {feature.fields && feature.fields.length > 0 && (
        <div class="feature-item-fields">
          {feature.fields.map((field) => (
            <SchemaFieldRenderer
              key={field.key}
              field={field as unknown as FeatureSchemaField}
              feature={feature}
            />
          ))}
        </div>
      )}
    </div>
  );
}
