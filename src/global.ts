import { doc } from './utils';
import { VersionUtils } from './utils/version';

export const getTCVersion = () => {
  const htmlEl = doc.documentElement;

  const getAttr = (name: string) => htmlEl.attributes.getNamedItem(name)?.value;

  const version = getAttr('version') ?? null;

  return {
    rawVersion: version,
    version: version ? VersionUtils.parse(version) : null,
    host: getAttr('host'),
    deliveryOrg: getAttr('delivery-org'),
  };
};
