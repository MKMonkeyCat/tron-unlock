import { LEARNING_PLATFORM_DOMAINS } from '../const';

import pLimit from 'p-limit';
import { describe, test } from 'vitest';

const KEY_PATTERNS = [
  { name: 'statisticsSettings', regex: /window\.statisticsSettings\s*=\s*{/ },
  { name: 'orgSettings', regex: /var\s+orgSettings\s*=\s*{/ },
  { name: 'featureToggles', regex: /var\s+featureToggles\s*=\s*{/ },
  { name: 'globalData', regex: /var\s+globalData\s*=\s*{/ },
];

const checkDomain = async (domain: string, timeout: number = 10_000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(`https://${domain}`, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
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
  } catch (error) {
    throw new Error(
      `[${domain}] ${error instanceof Error ? error.message : error}`,
    );
  } finally {
    clearTimeout(timeoutId);
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

    const limit = pLimit(20);
    await Promise.all(
      targets.map((domain) => limit(() => checkDomain(domain))),
    );
  }, 30_000);
});
