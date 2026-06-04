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

interface ActionLifeCycles<T extends BaseStateType> {
  enable?: (ctx: FeatureContext<T>) => MaybePromise<CleanupFn<T> | void>;
  disable?: (ctx: FeatureContext<T>) => MaybePromise<void>;
  toggle?: (ctx: FeatureContext<T>, value: boolean) => MaybePromise<void>;
}

type PluginType = 'tab' | 'group' | 'feature';

export type UiControl =
  | SelectControl
  | RangeControl
  | CheckboxControl
  | TextControl;

export interface SelectControl {
  type: 'select';
  options: { label: string; value: string | number | boolean }[];
  multiple?: boolean;
}

export interface RangeControl {
  type: 'range';
  min: number;
  max: number;
  step?: number;
}

export interface CheckboxControl {
  type: 'checkbox';
}

export interface TextControl {
  type: 'text';
  placeholder?: string;
}

export type PluginDefinition<
  T extends BaseStateType = BaseStateType,
  I18N extends Translations = Translations,
  Type extends PluginType = PluginType,
> = {
  id: PluginID;
  type?: Type; // default to 'feature'
  enabled?: boolean; // default to true
  state?: T;
  parentId?: PluginID;
  children?: PluginDefinition<T, I18N, Type>[];
  dependencies?: PluginID[];

  ui?: {
    hidden?: boolean;
    description?: string;
    icon?: string;
    control?: UiControl;
  };
  // metadata?: {};

  test?:
    | ((ctx: FeatureContext<T>, route: RouteSnapshot) => MaybePromise<boolean>)
    | RegExp;
  setup?: (
    ctx: FeatureContext<T>,
    value: boolean,
  ) => MaybePromise<CleanupFn<T> | void>;

  order?: number;
} & (Type extends 'feature' ? ActionLifeCycles<T> : {});

export interface SubPluginDefinition<
  T extends BaseStateType = BaseStateType,
  I18N extends Translations = Translations,
> extends Omit<PluginDefinition<T, I18N>, 'id' | 'parentId'> {
  id?: `.${string}` | (string & {});
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

export const definePluginWithConfig = <
  T extends BaseStateType,
  I18N extends Translations,
>(
  basePlugin: PluginDefinition<T, I18N>,
  configPlugins: SubPluginDefinition<T, I18N>[],
): PluginDefinition<T, I18N>[] => [
  { type: 'group', ...basePlugin },
  ...configPlugins.map((cfg, index) => {
    let id = cfg.id;
    if (!id) id = `${basePlugin.id}.config.${index}`;
    else if (id.startsWith('.')) id = `${basePlugin.id}${id}`;
    else id = `${basePlugin.id}.${id}`;

    return { ...cfg, id, parentId: basePlugin.id };
  }),
];

export interface FeatureControlModule {
  id: PluginID;
  plugins: PluginDefinition<any, Translations>[];
}
