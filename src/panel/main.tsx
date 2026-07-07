import { PanelApp } from '@/ui/panel/PanelApp';
import { createRemotePanelClient } from '@/ui/panel/remote-client';

import { render } from 'preact';

const client = createRemotePanelClient();
const root = document.getElementById('root')!;

render(
  <PanelApp client={client} container={root} mode="docked" canUsePlugin />,
  root,
);
