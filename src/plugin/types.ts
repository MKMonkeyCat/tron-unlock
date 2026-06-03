import type { MaybePromise, Translations } from '@/utils';

export type PluginID = string;

export type CleanupFn<T extends BaseStateType = BaseStateType> = (
  ctx: FeatureContext<T>,
) => void;
export type BaseStateType = Record<string, unknown>;

export type RouteSnapshot = Pick<
  Location,
  'href' | 'pathname' | 'search' | 'hash'
>;

export interface PluginApi {
  toggle: (id: PluginID, force?: boolean) => Promise<void>;
  emit: (event: string, detail?: unknown) => void;
}

export const PluginStatus = {
  Disabled: 'DISABLED',
  Incompatible: 'INCOMPATIBLE',
  MissingDep: 'MISSING_DEP',
  Running: 'RUNNING',
} as const;
export type PluginStatus = (typeof PluginStatus)[keyof typeof PluginStatus];

export interface FeatureContext<T extends BaseStateType> {
  state: T;
  node: PluginNode<T>;
  api: PluginApi;
}

export interface PluginDefinitionMetadata {
  hidden?: boolean; // eq ui: { hidden: true }
  ui?: {
    hidden?: boolean;
    control?: 'toggle' | 'select' | 'input'; // default to 'toggle'
  };
}

export interface PluginDefinition<
  T extends BaseStateType = BaseStateType,
  I18N extends Translations = Translations,
> {
  id: PluginID;
  type?: 'tab' | 'group' | 'feature'; // default to 'feature'
  enabled?: boolean; // default to true
  state?: T;
  parentId?: PluginID;
  children?: PluginDefinition<T, I18N>[];

  dependencies?: PluginID[];
  test?:
    | ((ctx: FeatureContext<T>, route: RouteSnapshot) => MaybePromise<boolean>)
    | RegExp;
  setup?: (
    ctx: FeatureContext<T>,
    value: boolean,
  ) => MaybePromise<CleanupFn<T> | void>;
  enable?: (ctx: FeatureContext<T>) => MaybePromise<CleanupFn<T> | void>;
  disable?: (ctx: FeatureContext<T>) => MaybePromise<void>;
  toggle?: (ctx: FeatureContext<T>, value: boolean) => MaybePromise<void>;
  metadata?: PluginDefinitionMetadata;

  order?: number;
}

export interface PluginNode<T extends BaseStateType> extends Omit<
  PluginDefinition<T>,
  'children' | 'enabled' | 'state'
> {
  enabled: boolean;
  state: T;
  children: PluginID[];
}

export const definePlugin = <T extends BaseStateType>(
  plugin: PluginDefinition<T>,
): PluginDefinition<T> => plugin;

export interface FeatureControlModule {
  id: PluginID;
  plugins: PluginDefinition<any, Translations>[];
}
