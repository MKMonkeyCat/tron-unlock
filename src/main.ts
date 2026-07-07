import { GITHUB_REPO_URL, VERSION } from './constants';
import { createPageBridge } from './core/runtime';
import { initializeFeatures, manager, registry } from './feature';
import { createPersistingLocalClient } from './ui/panel/client';
import { mountInlinePanel } from './ui/panel/mount';

import './style';

const printArtLog = () => {
  const art = `%c
████████╗██████╗  ██████╗ ███╗   ██╗██╗   ██╗███╗   ██╗██╗      ██████╗  ██████╗ ██╗  ██╗
╚══██╔══╝██╔══██╗██╔═══██╗████╗  ██║██║   ██║████╗  ██║██║     ██╔═══██╗██╔════╝ ██║ ██╔╝
   ██║   ██████╔╝██║   ██║██╔██╗ ██║██║   ██║██╔██╗ ██║██║     ██║   ██║██║  ███╗█████╔╝ 
   ██║   ██╔══██╗██║   ██║██║╚██╗██║██║   ██║██║╚██╗██║██║     ██║   ██║██║   ██║██╔═██╗ 
   ██║   ██║  ██║╚██████╔╝██║ ╚████║╚██████╔╝██║ ╚████║███████╗╚██████╔╝╚██████╔╝██║  ██╗
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝

%cTronUnlock - ${VERSION}%c${GITHUB_REPO_URL}%c
`;

  console.log(
    art,
    'color:#00d4ff;font-weight:bold;font-size:8px;',
    'padding:5px 8px;background:#ee5566;color:#fff;border-radius:4px 0 0 4px;font-size:12px;',
    'padding:4.5px 8px;border:1px solid #ee5566;border-radius:0 4px 4px 0;',
    '',
  );
};

(async () => {
  await initializeFeatures();
  await manager.setupWatcher();

  const panelClient = await createPersistingLocalClient(manager, registry);

  const panel = await mountInlinePanel(panelClient);

  const bridge = createPageBridge();
  bridge.registerHandler('get-snapshot', () => panelClient.getSnapshot());
  bridge.registerHandler('set-enabled', (id, enabled) =>
    panelClient.setEnabled(id, enabled),
  );
  bridge.registerHandler('set-config', (id, patch) =>
    panelClient.setConfig(id, patch),
  );
  bridge.registerHandler('toggle-panel', () => panel.toggle());
  panelClient.onChange(() =>
    bridge.push('snapshot-changed', panelClient.getSnapshot()),
  );

  printArtLog();
})();

if (import.meta.env.DEV) {
  console.log(
    '%c DevTools Plugin Template %c',
    'color: #fff; background: linear-gradient(90deg, #ff7e5f, #feb47b); padding: 4px 8px; border-radius: 4px;',
    '',
  );
}
