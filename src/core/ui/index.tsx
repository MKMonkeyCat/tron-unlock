import { MK_BASE_CLASS } from '@/constants';

import { FeaturePanel } from './FeaturePanel';
import type { FeatureRegistry } from '../feature';

import type { VNode } from 'preact';
import { options, render } from 'preact';

const oldVnodeHook = options.vnode;

options.vnode = (vnode: VNode) => {
  if (typeof vnode.type === 'string') {
    const props = vnode.props as {
      class?: string;
      className?: string;
      [key: string]: any;
    };

    const rawClass = props.class || props.className || '';
    const currentClass = new Set(rawClass.split(' ').filter(Boolean));
    if (!currentClass.has(MK_BASE_CLASS)) {
      currentClass.add(MK_BASE_CLASS);

      const updatedClass = Array.from(currentClass).join(' ');
      props.class = updatedClass;
      props.className = updatedClass;
    }
  }

  oldVnodeHook?.(vnode);
};

export const injectUI = (registry: FeatureRegistry) => {
  const panelRoot = document.createElement('div');
  panelRoot.id = 'feature-panel-root';
  panelRoot.classList.add('feature-panel-root', MK_BASE_CLASS);
  render(<FeaturePanel registry={registry} />, panelRoot);

  document.body.appendChild(panelRoot);
};
