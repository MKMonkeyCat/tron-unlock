export interface Version {
  raw: string;
  numbers: number[];
  tags: string[];
}

export class VersionUtils {
  static parse(version: string): Version {
    const [numberPart, ...tagParts] = version.trim().split('-');

    return {
      raw: version,
      numbers: numberPart
        .split('.')
        .filter(Boolean)
        .map((x) => Number(x)),
      tags: tagParts.filter(Boolean),
    };
  }

  static stringify(version: Version): string {
    const num = version.numbers.join('.');

    if (version.tags.length === 0) {
      return num;
    }

    return `${num}-${version.tags.join('-')}`;
  }

  static compare(a: string | Version, b: string | Version): number {
    const va = typeof a === 'string' ? this.parse(a) : a;
    const vb = typeof b === 'string' ? this.parse(b) : b;

    const len = Math.max(va.numbers.length, vb.numbers.length);

    for (let i = 0; i < len; i++) {
      const na = va.numbers[i] ?? 0;
      const nb = vb.numbers[i] ?? 0;

      if (na !== nb) {
        return na - nb;
      }
    }

    // Release > prerelease
    if (va.tags.length === 0 && vb.tags.length > 0) return 1;
    if (va.tags.length > 0 && vb.tags.length === 0) return -1;

    const ta = va.tags.join('-');
    const tb = vb.tags.join('-');

    return ta.localeCompare(tb);
  }

  static eq(a: string | Version, b: string | Version): boolean {
    return this.compare(a, b) === 0;
  }

  static ne(a: string | Version, b: string | Version): boolean {
    return this.compare(a, b) !== 0;
  }

  static gt(a: string | Version, b: string | Version): boolean {
    return this.compare(a, b) > 0;
  }

  static gte(a: string | Version, b: string | Version): boolean {
    return this.compare(a, b) >= 0;
  }

  static lt(a: string | Version, b: string | Version): boolean {
    return this.compare(a, b) < 0;
  }

  static lte(a: string | Version, b: string | Version): boolean {
    return this.compare(a, b) <= 0;
  }

  static isPrerelease(version: string | Version): boolean {
    const v = typeof version === 'string' ? this.parse(version) : version;
    return v.tags.length > 0;
  }

  static major(version: string | Version): number {
    const v = typeof version === 'string' ? this.parse(version) : version;
    return v.numbers[0] ?? 0;
  }

  static minor(version: string | Version): number {
    const v = typeof version === 'string' ? this.parse(version) : version;
    return v.numbers[1] ?? 0;
  }

  static patch(version: string | Version): number {
    const v = typeof version === 'string' ? this.parse(version) : version;
    return v.numbers[2] ?? 0;
  }

  static clean(version: string | Version): string {
    const v = typeof version === 'string' ? this.parse(version) : version;
    return v.numbers.join('.');
  }

  static normalize(version: string | Version, length = 3): string {
    const v = typeof version === 'string' ? this.parse(version) : version;

    const nums = [...v.numbers];

    while (nums.length < length) {
      nums.push(0);
    }

    return nums.join('.');
  }

  static between(
    version: string | Version,
    min: string | Version,
    max: string | Version,
    inclusive = true,
  ): boolean {
    if (inclusive) {
      return this.compare(version, min) >= 0 && this.compare(version, max) <= 0;
    }

    return this.compare(version, min) > 0 && this.compare(version, max) < 0;
  }
}
