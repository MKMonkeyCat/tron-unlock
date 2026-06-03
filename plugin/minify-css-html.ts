import { minify as htmlMinify } from 'html-minifier';
import * as lightningcss from 'lightningcss';
import type { Plugin } from 'vite';

const safeMinifyCss = (content: string): string => {
  try {
    return lightningcss
      .transform({
        filename: 'input.css',
        code: Buffer.from(content),
        minify: true,
        targets: lightningcss.browserslistToTargets([
          '> 0.5%',
          'last 2 versions',
          'not dead',
        ]),
      })
      .code.toString();
  } catch (err) {
    console.warn('CSS Minification failed, returning original content.', err);
    return content;
  }
};

export const minifyCssHtmlPlugin = (): Plugin => ({
  name: 'vite-plugin-minify-html-css-template',
  enforce: 'pre',
  transform(code: string, id: string) {
    if (!/\.(ts|tsx|js|jsx)$/.test(id)) return null;

    const newCode = code.replace(
      /`(?:\$?(html|css))?((?:\\`|[^`])*)`/g,
      (match, type, content) => {
        try {
          if (type === 'html') {
            const minified = htmlMinify(content, {
              collapseWhitespace: true,
              removeComments: true,
              caseSensitive: true,
            });
            return `\`${minified.replace(/`/g, '\\`')}\``;
          }

          if (type === 'css') {
            const vars: string[] = [];
            const placeholderContent = content.replace(
              /\${([\s\S]+?)}/g,
              (_: string, expr: string) => {
                const idx = vars.length;
                vars.push(expr);
                return `__VITE_VAR_${idx}__`;
              },
            );

            let minified = safeMinifyCss(placeholderContent);

            vars.forEach((expr, i) => {
              const reg = new RegExp(`__VITE_VAR_${i}__`, 'g');
              minified = minified.replace(reg, `\${${expr}}`);
            });

            return `\`${minified.replace(/`/g, '\\`')}\``;
          }
        } catch (err) {
          console.warn(`Failed to minify ${type} template in ${id}:`, err);
          return match;
        }
        return match;
      },
    );

    return newCode;
  },
});

export const minifyImportedRawCssPlugin = (): Plugin => ({
  name: 'vite-plugin-minify-imported-raw-css',
  enforce: 'pre',
  transform(code, id) {
    if (!id.endsWith('.css?raw')) return null;

    const match = code.match(/export default\s+([\s\S]+);?/);
    if (!match) return null;

    try {
      const rawCss = JSON.parse(match[1]);
      const minified = safeMinifyCss(rawCss);

      return {
        code: `export default ${JSON.stringify(minified)};`,
        map: null,
      };
    } catch {
      return null;
    }
  },
});
