import { featureManager } from '@/feature';
import { skipHookFunc } from '@/utils';
import { bindText, K } from '@/utils/i18n';

import { buildContentUI } from './contentBuild';
import { createTooltip } from './floating';

import { createElement } from '#/dom';

export const buildSettingsPanel = (panel: HTMLElement, onClose: () => void) => {
  // Title
  const title = createElement('div', 'mk-settings-title');
  bindText(title, K['control-panel'].settings.title);
  panel.append(title);

  // Tabs
  const tabs = createElement('div', 'mk-settings-tabs');
  const tabContents: Record<string, HTMLElement> = {};

  const content = createElement('div', 'mk-settings-content');
  for (const [index, [id, module]] of Array.from(
    featureManager.get() // Map<string, FeatureModule<any>>
  ).entries()) {
    const moduleInfo = module.getI18N()?.module;
    const moduleContentEl = buildContentUI(id, module);
    const label = moduleInfo?.name;
    const description = moduleInfo?.description;
    tabContents[id] = moduleContentEl;

    const btn = createElement('button', 'mk-settings-tab');
    if (label) bindText(btn, label);
    else btn.textContent = id;
    btn.dataset.tab = id;

    if (description) createTooltip(btn, description);
    if (index === 0) {
      moduleContentEl.classList.add('active');
      btn.classList.add('active');
    }

    tabs.append(btn);
    content.append(moduleContentEl);
  }

  panel.append(tabs, content);

  // Tab switching logic
  tabs.addEventListener(
    'click',
    skipHookFunc((e) => {
      const btn = (e.target as HTMLElement).closest(
        '.mk-settings-tab'
      ) as HTMLButtonElement;
      if (!btn) return;

      const targetTab = btn.dataset.tab;

      // Update active tab button
      tabs
        .querySelectorAll('.mk-settings-tab.active')
        .forEach((tab) => tab.classList.remove('active'));
      btn.classList.add('active');

      content
        .querySelectorAll('.mk-settings-module.active')
        .forEach((module) => module.classList.remove('active'));

      content
        .querySelector(`[data-module="${targetTab}"]`)
        ?.classList.add('active');
    })
  );

  // Close on Escape key
  const onKeyDown = skipHookFunc((ev: KeyboardEvent) => {
    if (ev.key === 'Escape') onClose();
  });
  document.addEventListener('keydown', onKeyDown);

  return () => {
    document.removeEventListener('keydown', onKeyDown);
  };
};
