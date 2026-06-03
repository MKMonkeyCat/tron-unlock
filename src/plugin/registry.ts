import type {
  BaseStateType,
  PluginDefinition,
  PluginID,
  PluginNode,
} from './types';

export class PluginRegistry<T extends BaseStateType = BaseStateType> {
  readonly nodes = new Map<PluginID, PluginNode<T>>();
  readonly #dependencyOf = new Map<PluginID, PluginID[]>();

  register(config: readonly PluginDefinition<T>[], parentId?: PluginID) {
    const sorted = [...config].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    sorted.forEach((item) => {
      if (this.nodes.has(item.id)) {
        throw new Error(`Duplicate plugin id: ${item.id}`);
      }

      const childDefinitions = item.children ?? [];
      const node: PluginNode<T> = {
        ...item,
        enabled: item.enabled ?? true,
        state: item.state ?? ({} as T),
        children: childDefinitions.map((child) => child.id),
        ...(parentId ? { parentId } : {}),
      };
      this.nodes.set(item.id, node);

      if (item.dependencies) {
        item.dependencies.forEach((depId) => {
          const dependents = this.#dependencyOf.get(depId) ?? [];

          this.#dependencyOf.set(depId, [...dependents, item.id]);
        });
      }

      if (childDefinitions.length > 0) {
        this.register(childDefinitions, item.id);
      }
    });
  }

  getChildren(parentId: PluginID) {
    return this.nodes.get(parentId)?.children ?? [];
  }

  getDependents(id: PluginID) {
    return this.#dependencyOf.get(id) ?? [];
  }
}
