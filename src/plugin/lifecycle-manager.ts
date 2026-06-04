import { isFunction } from '@/utils';

import type { PluginRegistry } from './registry';
import type {
  BaseStateType,
  CleanupFn,
  FeatureContext,
  PluginID,
  PluginNode,
} from './types';
import { PluginStatus } from './types';

export class LifecycleManager<T extends BaseStateType = BaseStateType> {
  #registry: PluginRegistry<T>;
  #cleanups = new Map<PluginID, CleanupFn<T>>();
  #activeStatuses = new Map<PluginID, PluginStatus>();

  constructor(registry: PluginRegistry<T>) {
    this.#registry = registry;
  }

  async syncAll(force = false) {
    let changed = true;

    for (
      let iteration = 0;
      changed && iteration < this.#registry.nodes.size;
      iteration++
    ) {
      changed = false;

      for (const id of this.#registry.nodes.keys()) {
        changed = (await this.#updateNodeLifecycle(id, force)) || changed;
      }
    }
  }

  getStatus(id: PluginID) {
    return this.#activeStatuses.get(id);
  }

  async #updateNodeLifecycle(id: PluginID, force = false) {
    const node = this.#registry.nodes.get(id);

    if (!node) return false;

    const previousStatus = this.#activeStatuses.get(id);
    const desiredStatus = await this.#calculateStatus(node);
    const isRunning = this.#cleanups.has(id);

    if (desiredStatus === PluginStatus.Running) {
      if (!isRunning) {
        const started = await this.#execStart(node);

        return started || previousStatus !== this.#activeStatuses.get(id);
      }

      // If already running but force is true, restart the plugin
      if (isRunning && force) {
        await this.#execStop(node);
        const started = await this.#execStart(node);
        return started || previousStatus !== this.#activeStatuses.get(id);
      }

      if (previousStatus !== PluginStatus.Running) {
        this.#activeStatuses.set(id, PluginStatus.Running);
        return true;
      }

      return false;
    }

    if (isRunning) {
      await this.#execStop(node);
    }

    if (desiredStatus !== previousStatus) {
      this.#activeStatuses.set(id, desiredStatus);
      return true;
    }

    return isRunning;
  }

  async #calculateStatus(node: PluginNode<T>): Promise<PluginStatus> {
    if (!node.enabled) {
      return PluginStatus.Disabled;
    }

    if (node.parentId) {
      const parent = this.#registry.nodes.get(node.parentId);
      if (!parent || !this.#cleanups.has(parent.id)) {
        return PluginStatus.MissingDep;
      }
    }

    for (const depId of node.dependencies ?? []) {
      if (!this.#cleanups.has(depId)) {
        return PluginStatus.MissingDep;
      }
    }

    const test = node.test;
    if (
      (test instanceof RegExp && !test.test(location.href)) ||
      (isFunction(test) && !(await test(this.#createContext(node), location)))
    ) {
      return PluginStatus.Incompatible;
    }

    return PluginStatus.Running;
  }

  async #execStart(node: PluginNode<T>) {
    const ctx = this.#createContext(node);
    try {
      if (node.setup) {
        const cleanupFn = await node.setup(ctx, node.enabled);

        if (isFunction(cleanupFn)) this.#cleanups.set(node.id, cleanupFn);
      }

      // if (node.enable && !node.setup) {
      //   const cleanupFn = await node.enable(ctx);

      //   if (isFunction(cleanupFn)) this.#cleanups.set(node.id, cleanupFn);
      // }

      this.#activeStatuses.set(node.id, PluginStatus.Running);

      return true;
    } catch (error) {
      console.error(`Plugin ${node.id} failed to start:`, error);
      this.#activeStatuses.set(node.id, PluginStatus.Incompatible);

      return false;
    }
  }

  async #execStop(node: PluginNode<T>) {
    const cleanup = this.#cleanups.get(node.id);
    if (cleanup) {
      cleanup(this.#createContext(node));
      this.#cleanups.delete(node.id);
    }

    // if (node.disable) await node.disable(this.#createContext(node));
    this.#activeStatuses.set(node.id, PluginStatus.Disabled);
  }

  #createContext(node: PluginNode<T>): FeatureContext<T> {
    return {
      state: node.state,
      node,
      api: {
        toggle: async (id, state) => {
          const target = this.#registry.nodes.get(id);
          if (target) {
            target.enabled = state ?? !target.enabled;
            await this.syncAll();
          }
        },
        emit: (event, detail) => {
          window.dispatchEvent(new CustomEvent(`plugin:${event}`, { detail }));
        },
      },
    };
  }
}
