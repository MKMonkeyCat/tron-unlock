import type { FeatureRegistry } from '@/core/feature/build';

import { FeatureSection } from './FeatureSection';

import { useMemo, useState } from 'preact/hooks';

export function FeaturePanel({ registry }: { registry: FeatureRegistry }) {
  const features = useMemo(() => registry.getAll(), []);

  const structuredData = useMemo(() => {
    const categories = new Map<string, Map<string, any[]>>();

    features.forEach((feature) => {
      if (!categories.has(feature.category)) {
        categories.set(feature.category, new Map());
      }
      const groups = categories.get(feature.category)!;
      const groupName = feature.group || 'default';

      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(feature);
    });

    return categories;
  }, [features]);

  const tabs = useMemo(() => [...structuredData.keys()], [structuredData]);
  const [activeTab, setActiveTab] = useState(tabs[0] || '');

  const currentGroups = structuredData.get(activeTab);

  return (
    <div class="feature-panel-layout">
      <nav class="feature-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            class={`tab-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main class="feature-content">
        {currentGroups &&
          [...currentGroups.entries()].map(([groupName, list]) => (
            <section key={groupName} class="feature-group-section">
              {groupName !== 'default' && (
                <h2 class="group-title">{groupName}</h2>
              )}

              <div class="feature-list">
                {list.map((feature) => (
                  <FeatureSection key={feature.id} feature={feature} />
                ))}
              </div>
            </section>
          ))}
      </main>
    </div>
  );
}
