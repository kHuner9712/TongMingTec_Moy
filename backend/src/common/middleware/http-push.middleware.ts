import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class HttpPushMiddleware implements NestMiddleware {
  private pushAssets: string[] = [];
  private manifestLoaded = false;

  private loadManifest() {
    if (this.manifestLoaded) return;
    this.manifestLoaded = true;

    const distPath = path.resolve(process.cwd(), '../frontend/dist');
    const manifestPath = path.join(distPath, '.vite/manifest.json');

    try {
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const criticalChunks = ['vendor', 'antd-core', 'antd-icons', 'query', 'utils'];

        for (const [key, entry] of Object.entries<any>(manifest)) {
          if (entry.isEntry || criticalChunks.some((c) => key.includes(c))) {
            if (entry.file) {
              this.pushAssets.push(`/assets/${entry.file}`);
            }
            if (entry.css) {
              entry.css.forEach((css: string) => this.pushAssets.push(`/assets/${css}`));
            }
          }
        }
      }
    } catch {
      this.pushAssets = [];
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.loadManifest();

    if (
      (req.httpVersion === '2.0' || req.httpVersion === '2') &&
      typeof (res as any).push === 'function' &&
      req.url === '/'
    ) {
      for (const asset of this.pushAssets) {
        try {
          (res as any).push(asset, {
            'content-type': asset.endsWith('.css')
              ? 'text/css'
              : asset.endsWith('.js')
                ? 'application/javascript'
                : 'application/octet-stream',
          }, (err: Error | null, stream: NodeJS.WritableStream) => {
            if (!err) {
              const filePath = path.resolve(process.cwd(), `../frontend/dist${asset}`);
              if (fs.existsSync(filePath)) {
                fs.createReadStream(filePath).pipe(stream);
              } else {
                stream.end();
              }
            }
          });
        } catch {
          // push 失败不影响正常响应
        }
      }
    }

    next();
  }
}
