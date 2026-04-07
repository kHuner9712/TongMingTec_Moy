import type { Plugin, HtmlTagDescriptor } from 'vite';

export function vitePreloadPlugin(): Plugin {
  return {
    name: 'vite-preload-plugin',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const tags: HtmlTagDescriptor[] = [];
        const bundle = ctx.bundle;
        if (!bundle) return html;

        const criticalChunks = ['vendor', 'antd-core', 'antd-icons', 'query', 'utils'];
        const cssFiles: string[] = [];
        const jsFiles: string[] = [];

        for (const [, chunk] of Object.entries(bundle)) {
          if (chunk.type === 'asset' && chunk.fileName.endsWith('.css')) {
            cssFiles.push(chunk.fileName);
          }
          if (chunk.type === 'chunk') {
            const isCritical = criticalChunks.some(
              (name) => chunk.fileName.includes(name) || chunk.name?.includes(name)
            );
            const isEntry = chunk.isEntry;
            if (isCritical || isEntry) {
              jsFiles.push(chunk.fileName);
            }
          }
        }

        for (const css of cssFiles) {
          tags.push({
            tag: 'link',
            attrs: { rel: 'preload', href: `/${css}`, as: 'style' },
            injectTo: 'head-prepend',
          });
        }

        for (const js of jsFiles) {
          tags.push({
            tag: 'link',
            attrs: { rel: 'preload', href: `/${js}`, as: 'script', crossorigin: '' },
            injectTo: 'head-prepend',
          });
        }

        tags.push({
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://cdn.moy.example.com', crossorigin: '' },
          injectTo: 'head-prepend',
        });

        tags.push({
          tag: 'link',
          attrs: { rel: 'dns-prefetch', href: 'https://cdn.moy.example.com' },
          injectTo: 'head-prepend',
        });

        return { html, tags };
      },
    },
  };
}
