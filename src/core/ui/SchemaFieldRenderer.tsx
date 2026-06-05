import type { AnyFeature, FeatureSchemaField } from '../feature/types';

interface SchemaFieldRendererProps {
  field: FeatureSchemaField;
  feature: AnyFeature;
}

export function SchemaFieldRenderer({
  field,
  feature,
}: SchemaFieldRendererProps) {
  // const currentValue = feature.config?.[field.key] ?? feature.defaultConfig?.[field.key];
  const currentValue = '';

  const handleChange = (newValue: any) => {
    console.log('');
  };

  // const handleChange = (newValue: any) => {
  //   const oldConfig = { ...feature.config };
  //   if (!feature.config) feature.config = {};

  //   feature.config[field.key] = newValue;

  //   // 觸發生命週期
  //   feature.onConfigChange?.(/** ctx **/, oldConfig);
  // };

  switch (field.type) {
    // case 'toggle':
    //   return (
    //     <div class="field-row">
    //       <span class="field-label">{field.key}</span>
    //       <input
    //         type="checkbox"
    //         checked={!!currentValue}
    //         onChange={(e) => handleChange(e.currentTarget.checked)}
    //       />
    //     </div>
    //   );

    case 'input':
      return (
        <div class="field-row">
          <label>{field.key}</label>
          <input
            type="text"
            value={String(currentValue ?? '')}
            onInput={(e) => handleChange(e.currentTarget.value)}
          />
        </div>
      );

    // case 'number':
    //   return (
    //     <div class="field-row">
    //       <label>{field.key}</label>
    //       <input
    //         type="number"
    //         min={field.min}
    //         max={field.max}
    //         step={field.step}
    //         value={Number(currentValue ?? 0)}
    //         onChange={(e) => handleChange(Number(e.currentTarget.value))}
    //       />
    //     </div>
    //   );

    case 'select':
      return (
        <div class="field-row">
          <label>{field.key}</label>
          <select
            value={String(currentValue)}
            onChange={(e) => handleChange(e.currentTarget.value)}
          >
            {field.options.map((opt) => (
              <option key={String(opt)} value={String(opt)}>
                {String(opt)}
              </option>
            ))}
          </select>
        </div>
      );

    default:
      return null;
  }
}
