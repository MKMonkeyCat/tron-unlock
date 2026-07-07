import { Builder, FeatureRegistry } from '../../src/core/feature/build';
import { createCourseFeatureModule } from '../../src/feature/course';
import { createExamFeatureModule } from '../../src/feature/exam';
import {
  initializeFeatures,
  registry as sharedRegistry,
} from '../../src/feature/index';

import { describe, expect, test } from 'vitest';

describe('each category loads its own _i18n.json and registers it via tab.withI18n(...)', () => {
  test('group name + feature name/description/fields become retrievable once registered', () => {
    // A fresh registry has its own i18n store (not a shared global
    // singleton), so this is isolated from the app's real `registry` used
    // in the test below.
    const registry = new FeatureRegistry();
    const builder = new Builder(registry);

    // createExamFeatureModule/createCourseFeatureModule call tab.withI18n(...)
    // themselves, so no i18n data needs to be passed in here.
    builder
      .tab('exam', (tab) => createExamFeatureModule(tab))
      .tab('course', (tab) => createCourseFeatureModule(tab));

    const examMisc = registry.i18n.getGroupI18nContext(
      'exam' as never,
      'misc' as never,
    );
    expect(examMisc.t('name' as never)).toBe('雜項');
    expect(examMisc.t(`features.exams.misc.name` as never)).toBe('隱藏浮水印');

    // getCategoryI18nContext exposes the same underlying store as
    // getGroupI18nContext, just scoped one level up (the whole category).
    expect(
      registry.i18n
        .getCategoryI18nContext('exam' as never)
        .t('groups.misc.name' as never),
    ).toBe('雜項');

    const courseActivity = registry.i18n.getGroupI18nContext(
      'course' as never,
      'learning-activity' as never,
    );
    expect(
      courseActivity.t(
        `features.courses.learning-activity.force-allow-download.name` as never,
      ),
    ).toBe('強制允許下載');
    expect(
      courseActivity.t(
        `features.courses.learning-activity.auto-view-video-activity.fields.playRate` as never,
      ),
    ).toBe('播放速率');
  });

  test('category tab name registered by each category index.ts is retrievable end-to-end', async () => {
    await initializeFeatures();

    expect(
      sharedRegistry.i18n
        .getCategoryI18nContext('exam' as never)
        .t('name' as never),
    ).toBe('考試');
    expect(
      sharedRegistry.i18n
        .getCategoryI18nContext('course' as never)
        .t('name' as never),
    ).toBe('課程');
    expect(
      sharedRegistry.i18n
        .getCategoryI18nContext('global' as never)
        .t('name' as never),
    ).toBe('全域');
  });
});
