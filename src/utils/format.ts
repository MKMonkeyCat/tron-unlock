import { isDict } from '.';

/** Truncates a number and converts it to a specific base string */
const toIntStr = (v: number, b: number) => Math.floor(v).toString(b);

/**
 * Mapping of format types to their respective string conversion logic
 * e/E: Scientific, x/X: Hex, b: Binary, o: Octal, f/F: Fixed-point, d: Decimal
 */
const formatters: Record<
  string,
  ((v: number, p: number) => string) | undefined
> = {
  e: (v, p) => v.toExponential(p),
  E: (v, p) => v.toExponential(p).toUpperCase(),
  x: (v) => toIntStr(v, 16),
  X: (v) => toIntStr(v, 16).toUpperCase(),
  b: (v) => toIntStr(v, 2),
  o: (v) => toIntStr(v, 8),
  f: (v, p) => v.toFixed(p),
  F: (v, p) => v.toFixed(p),
  d: (v) => toIntStr(v, 10),
};

/** Prefixes used when the 'alternate form' (#) flag is present */
const PREFIXES: Record<string, string> = {
  x: '0x',
  X: '0X',
  o: '0o',
  b: '0b',
};

const EMPTY = '';

/**
 * Main Regular Expression to parse the format specifier:
 * {ref:fill align sign # 0 width group .precision type}
 * Groups breakdown:
 * ref: Property path or index
 * fill/align: Padding character and alignment (< left, > right, ^ center, = after sign)
 * sign: Logic for plus/minus symbols (+ always, - only negative, space for alignment)
 * alt: Toggle for radix prefixes (#)
 * zero: Shortcut for zero-padding (equivalent to 0= alignment)
 * width: Minimum field width
 * group: Thousands separator (, or _)
 * precision: Max chars for strings or decimal places for numbers
 * type: Type conversion code (e.g., f, d, x, %)
 */
const FMT_RGX =
  /\{(?<ref>[\w.]+)?(?::(?:(?<fill>[^>^<\d#]|0)?(?<align>[<>^=]))?(?<sign>[+\- ])?(?<alt>#)?(?<zero>0)?(?<width>\d+)?(?<group>[,_])?(?<dot>\.)?(?<precision>\d+)?(?<type>[eEfFgGdxXobn%])?)?\}/g;

/** Recursively resolves a value from a nested object using a dot-notation path */
const getDeepValue = (obj: any, path: string) => {
  return path
    .split('.')
    .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

export const format = (template: string, ...args: any[]): string => {
  // If there's exactly one argument and it's a dictionary, use it for named references; otherwise, treat arguments as an array for automatic indexing
  const data = args.length === 1 && isDict(args[0]) ? args[0] : args;

  let autoIdx = 0;
  return template.replace(FMT_RGX, (...matchArgs) => {
    // Extract naming groups from the RegEx match result
    const groups = (matchArgs[matchArgs.length - 1] || {}) as Record<
      string,
      string | undefined
    >;

    const {
      ref,
      fill,
      align,
      sign,
      alt,
      zero,
      width,
      group,
      dot,
      precision,
      type,
    } = groups;

    // Value selection: prioritize named reference, fallback to automatic index
    const val = ref ? getDeepValue(data, ref) : data[autoIdx++];

    if (val === undefined || val === null) return EMPTY;

    let res = String(val);
    const n = Number(val);
    const isNum = typeof val !== 'boolean' && !isNaN(n);

    let prefix = EMPTY;

    // Handle type-specific numeric formatting
    if (type && isNum) {
      const p = precision ? +precision : 6;
      if (type === '%') {
        res = (n * 100).toFixed(p) + '%';
      } else if (formatters[type]) {
        res = formatters[type](n, p);

        // Apply prefix for hex/octal/binary if requested via '#'
        if (alt && PREFIXES[type]) prefix = PREFIXES[type];
      }
    } else if (dot && precision) {
      // If not a number, precision acts as a string truncator
      res = res.slice(0, +precision);
    }

    if (isNum) {
      // Insert thousands separators (comma or underscore)
      if (group) {
        const parts: string[] = res.split('.');
        if (parts[0]) {
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, group);
        }

        res = parts.join('.');
      }

      // Consolidate sign handling into the prefix variable
      if (sign && '+- '.includes(sign)) {
        if (n < 0) prefix = '-';
        else if (sign !== '-') prefix = sign;

        // Strip existing sign from the magnitude string to avoid duplicates
        res = res.replace(/^[+\-]/, EMPTY);
      }
    }

    // Combine prefix and the formatted magnitude
    res = prefix + res;

    // Handle field width and text alignment
    if (width) {
      const w = +width;
      const f = fill || (zero ? '0' : ' ');
      const a = zero ? '=' : align || '<';
      const resLen = res.length;

      if (resLen < w) {
        if (a === '>') res = res.padStart(w, f);
        else if (a === '^') {
          // Center alignment: calculate padding for both sides
          const diff = w - resLen;
          const left = diff >> 1;

          res = f.repeat(left) + res + f.repeat(diff - left);
        } else if (a === '=') {
          // Special padding: insert fill characters BETWEEN the prefix and the value
          const pfx = res.match(/^(?:0[xXob]|[+\- ])/)?.[0] ?? EMPTY;
          const pfxLen = pfx.length;

          res = pfx + res.slice(pfxLen).padStart(w - pfxLen, f);
        } else {
          res = res.padEnd(w, f);
        }
      }
    }

    return res;
  });
};
