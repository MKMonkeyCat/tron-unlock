import { LEARNING_PLATFORM_DOMAINS } from '../const';

import { describe, test } from 'vitest';

const KEY_PATTERNS = [
  { name: 'statisticsSettings', regex: /window\.statisticsSettings\s*=\s*{/ },
  { name: 'orgSettings', regex: /var\s+orgSettings\s*=\s*{/ },
  { name: 'featureToggles', regex: /var\s+featureToggles\s*=\s*{/ },
  { name: 'globalData', regex: /var\s+globalData\s*=\s*{/ },
];

const checkDomain = async (domain: string) => {
  const resp = await fetch(`https://${domain}`, { redirect: 'follow' });
  if (!resp.ok) {
    throw new Error(`[${domain}] HTTP ${resp.status} - cannot load page`);
  }

  const text = await resp.text();
  for (const { name, regex } of KEY_PATTERNS) {
    if (!regex.test(text)) {
      const snippet = text.slice(0, 300).replace(/\s+/g, ' ');
      throw new Error(
        `[${domain}] Missing pattern "${name}"\nRegex: ${regex}\nSnippet: "${snippet}..."`,
      );
    }
  }
};

const IGNORE_DOMAINS: (typeof LEARNING_PLATFORM_DOMAINS)[number][] = [
  'tronclass.com',
  'tronclass.com.tw',
  'tronclass.com.cn',
  // 金华职业技术学院，主頁為自建
  'courses.cxjz.jhc.cn',
  // “中国历代绘画大系”志愿者宣讲，主頁為自建
  'hhdx.zj.zju.edu.cn',
];

describe('Suppers Domain', () => {
  test('should validate all domains with crawler', async () => {
    const targets = LEARNING_PLATFORM_DOMAINS.filter(
      (domain) => !IGNORE_DOMAINS.includes(domain) && !domain.includes('*'),
    );

    await Promise.all(
      targets.map((domain) =>
        checkDomain(domain).catch((err) => {
          throw new Error(`❌ [${domain}] FAILED:\n${err.message}`);
        }),
      ),
    );
  }, 30_000);
});
