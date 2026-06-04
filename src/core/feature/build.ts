import type { AnyFeature, Feature } from './types';

class FeatureRegistry {
  #map = new Map<string, Feature>();

  register(feature: Feature) {
    this.#map.set(feature.id, feature);
  }

  getAll() {
    return [...this.#map.values()];
  }
}

const registry = new FeatureRegistry();

class GroupBuilder {
  constructor(
    private tab: string,
    private group: string,
  ) {}

  append(...features: AnyFeature[]) {
    for (const f of features) {
      registry.register({ ...f, category: this.tab, group: this.group });
    }
    return this;
  }
}

class TabBuilder {
  constructor(private tab: string) {}

  group(group: string, callback: (builder: GroupBuilder) => void) {
    const groupBuilder = new GroupBuilder(this.tab, group);
    callback(groupBuilder);
    return this;
  }

  append(...features: AnyFeature[]) {
    for (const f of features) {
      registry.register({ ...f, category: this.tab });
    }
    return this;
  }
}

class Builder {
  tab(tab: string) {
    return new TabBuilder(tab);
  }
}

export const builder = new Builder();
