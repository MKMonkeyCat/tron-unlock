import { SVG_EXPERIMENT, SVG_WARN } from '@/assets/svg';
import type { Feature, FeatureModule } from '@/feature';
import { skipHookFunc } from '@/utils';
import { createElement, createSvgFromString } from '@/utils/dom';
import { K, type TranslationKey } from '@/utils/i18n';
import type { BaseStateType } from '@/utils/state';

import { createTooltip } from './floating';

export const buildContentUI = <T extends BaseStateType>(
  id: string,
  module: FeatureModule<T>
) => {
  const container = createElement('div', 'mk-settings-module');
  container.dataset.module = id;

  for (const [groupID, features] of Object.entries(module.groups) as [
    string,
    Feature<T>[]
  ][]) {
    if (!features?.length) continue;

    const groupWrapper = createElement('div', 'mk-settings-group');
    groupWrapper.dataset.group = groupID;

    const title = createElement('h2', 'mk-settings-group-title');
    title.textContent = module.getI18N()?.groups?.[groupID] || groupID;
    title.addEventListener(
      'click',
      skipHookFunc(() => title.classList.toggle('collapsed'))
    );
    groupWrapper.append(title);

    const list = createElement('div', 'mk-settings-group-content');
    for (const feature of features) {
      const featureBox = createElement('div', 'mk-settings-feature');

      const labelEl = createElement('label', 'mk-settings-feature-label');
      const labelText = createElement('h3');
      labelText.textContent = feature.name;

      const wrapper = createElement('div', 'mk-settings-feature-base-wrapper');
      wrapper.append(labelText);

      const createTag = (svgString: string, tooltipKey: TranslationKey) => {
        const tag = createElement('div', 'mk-tag');
        tag.append(createSvgFromString(svgString));
        createTooltip(tag, tooltipKey);
        return tag;
      };

      if (feature.options.liveReload === false) {
        labelText.append(
          createTag(SVG_WARN, K['control-panel'].needLiveReloadTooltip)
        );
      }

      if (feature.options.experimental === true) {
        labelText.append(
          createTag(
            SVG_EXPERIMENT,
            K['control-panel'].experimentalFeatureTooltip
          )
        );
      }

      if (
        'toggle' in feature.options ||
        'enable' in feature.options ||
        'disable' in feature.options
      ) {
        const inputEl = createElement('input', 'mk-settings-feature-input');
        inputEl.name = feature.options.id;
        inputEl.type = 'checkbox';
        inputEl.checked = !!feature.get();
        inputEl.addEventListener(
          'change',
          skipHookFunc(() => feature.click())
        );

        feature.on((_, newValue) => (inputEl.checked = !!newValue));

        wrapper.append(inputEl);
      }

      labelEl.append(wrapper);

      const desc = feature.description;
      if (desc) {
        const descEl = createElement('h4', 'mk-settings-feature-description');
        descEl.textContent = desc;
        labelEl.append(descEl);
      }

      featureBox.append(labelEl);

      // if ('click' in feature.options) {
      //   const btn = createElement('button', 'mk-button');
      //   btn.textContent = feature.name;
      //   btn.addEventListener('click', () => feature.click());
      //   featureBox.append(btn);

      //   descEl && featureBox.append(descEl);
      // }

      list.append(featureBox);
    }

    groupWrapper.append(list);
    container.append(groupWrapper);
  }

  return container;
};
