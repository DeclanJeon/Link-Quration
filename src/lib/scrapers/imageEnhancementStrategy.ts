import { EnhancedImageResult, ImageCandidate } from '@/types/scraping';
import { Page } from 'playwright';
import sharp from 'sharp';

export class ImageEnhancementStrategy {
  private readonly MIN_WIDTH = 1200;
  private readonly MIN_HEIGHT = 630;

  private readonly IMAGE_QUALITY = {
    thumbnail: { width: 400, height: 300, quality: 85 },
    standard: { width: 800, height: 600, quality: 90 },
    high: { width: 1920, height: 1080, quality: 95 },
    ultra: { width: 2560, height: 1440, quality: 95 },
  };

  async extractHighQualityImage(
    page: Page,
    url: string,
    qualityLevel: string = 'high',
  ): Promise<EnhancedImageResult | null> {
    try {
      const candidates = await this.collectImageCandidates(page, url);
      const bestImage = this.selectBestImage(candidates);

      if (!bestImage) {
        return await this.captureHighQualityScreenshot(page);
      }

      return await this.enhanceImage(bestImage, qualityLevel);
    } catch (error) {
      console.error('이미지 추출 실패:', error);
      return null;
    }
  }

  private async collectImageCandidates(page: Page, pageUrl: string): Promise<ImageCandidate[]> {
    const candidates = await page.evaluate((baseUrl) => {
      const images: ImageCandidate[] = [];
      const seen = new Set<string>();

      const makeAbsoluteUrl = (url: string): string => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (url.startsWith('//')) return 'https:' + url;
        if (url.startsWith('/')) return new URL(url, baseUrl).href;
        return new URL(url, baseUrl).href;
      };

      const extractDimensions = (url: string): { width: number; height: number } => {
        const sizeMatch = url.match(/(\d{3,4})x(\d{3,4})/);
        if (sizeMatch) {
          return {
            width: parseInt(sizeMatch[1]),
            height: parseInt(sizeMatch[2]),
          };
        }
        return { width: 0, height: 0 };
      };

      // Open Graph 이미지
      const ogImages = [
        'meta[property="og:image"]',
        'meta[property="og:image:secure_url"]',
        'meta[property="og:image:url"]',
      ];

      ogImages.forEach((selector) => {
        const meta = document.querySelector(selector);
        if (meta) {
          const url = makeAbsoluteUrl(meta.getAttribute('content') || '');
          if (url && !seen.has(url)) {
            seen.add(url);

            const widthMeta = document.querySelector('meta[property="og:image:width"]');
            const heightMeta = document.querySelector('meta[property="og:image:height"]');

            images.push({
              url,
              width:
                parseInt(widthMeta?.getAttribute('content') || '0') || extractDimensions(url).width,
              height:
                parseInt(heightMeta?.getAttribute('content') || '0') ||
                extractDimensions(url).height,
              format: url.split('.').pop()?.toLowerCase() || 'jpg',
              score: 100,
              type: 'meta',
            });
          }
        }
      });

      // Twitter Card 이미지
      const twitterImages = ['meta[name="twitter:image"]', 'meta[name="twitter:image:src"]'];

      twitterImages.forEach((selector) => {
        const meta = document.querySelector(selector);
        if (meta) {
          const url = makeAbsoluteUrl(meta.getAttribute('content') || '');
          if (url && !seen.has(url)) {
            seen.add(url);
            images.push({
              url,
              width: extractDimensions(url).width,
              height: extractDimensions(url).height,
              format: url.split('.').pop()?.toLowerCase() || 'jpg',
              score: 90,
              type: 'meta',
            });
          }
        }
      });

      // Schema.org 이미지
      const schemas = document.querySelectorAll('script[type="application/ld+json"]');
      schemas.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          const findImages = (obj: any): void => {
            if (typeof obj !== 'object' || !obj) return;

            if (obj.image) {
              const imageUrl =
                typeof obj.image === 'string' ? obj.image : obj.image.url || obj.image['@id'];
              if (imageUrl) {
                const url = makeAbsoluteUrl(imageUrl);
                if (!seen.has(url)) {
                  seen.add(url);
                  images.push({
                    url,
                    width: obj.image.width || extractDimensions(url).width,
                    height: obj.image.height || extractDimensions(url).height,
                    format: url.split('.').pop()?.toLowerCase() || 'jpg',
                    score: 85,
                    type: 'meta',
                  });
                }
              }
            }

            Object.values(obj).forEach((value) => findImages(value));
          };

          findImages(data);
        } catch (e) {
          // JSON 파싱 실패 무시
        }
      });

      // <picture> 요소의 고해상도 이미지
      document.querySelectorAll('picture source').forEach((source) => {
        const srcset = source.getAttribute('srcset');
        if (srcset) {
          const sources = srcset.split(',').map((s) => {
            const parts = s.trim().split(' ');
            const url = makeAbsoluteUrl(parts[0]);
            const descriptor = parts[1] || '1x';
            const multiplier = descriptor.endsWith('x')
              ? parseFloat(descriptor.slice(0, -1))
              : descriptor.endsWith('w')
                ? parseInt(descriptor.slice(0, -1)) / 100
                : 1;

            return { url, multiplier };
          });

          const best = sources.sort((a, b) => b.multiplier - a.multiplier)[0];
          if (best && !seen.has(best.url)) {
            seen.add(best.url);
            images.push({
              url: best.url,
              width: extractDimensions(best.url).width,
              height: extractDimensions(best.url).height,
              format: best.url.split('.').pop()?.toLowerCase() || 'jpg',
              score: 80,
              type: 'srcset',
            });
          }
        }
      });

      // 콘텐츠 영역의 주요 이미지
      const contentSelectors = [
        'article img',
        'main img',
        '.content img',
        '.post img',
        'figure img',
      ];

      contentSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element: Element) => {
          const img = element as HTMLImageElement; // 타입 단언 추가
          const src =
            img.getAttribute('src') ||
            img.getAttribute('data-src') ||
            img.getAttribute('data-lazy-src');

          if (src) {
            const url = makeAbsoluteUrl(src);
            if (!seen.has(url)) {
              seen.add(url);

              const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');
              let finalUrl = url;
              let width = img.naturalWidth || 0;
              let height = img.naturalHeight || 0;

              if (srcset) {
                const sources = srcset.split(',').map((s) => {
                  const parts = s.trim().split(' ');
                  return {
                    url: makeAbsoluteUrl(parts[0]),
                    descriptor: parts[1] || '1x',
                  };
                });

                const largest = sources.sort((a, b) => {
                  const aSize = a.descriptor.endsWith('w')
                    ? parseInt(a.descriptor)
                    : parseFloat(a.descriptor) * 1000;
                  const bSize = b.descriptor.endsWith('w')
                    ? parseInt(b.descriptor)
                    : parseFloat(b.descriptor) * 1000;
                  return bSize - aSize;
                })[0];

                if (largest) {
                  finalUrl = largest.url;
                  const dims = extractDimensions(largest.url);
                  width = dims.width || width;
                  height = dims.height || height;
                }
              }

              images.push({
                url: finalUrl,
                width,
                height,
                format: finalUrl.split('.').pop()?.toLowerCase() || 'jpg',
                score: 60,
                type: 'content',
                alt: img.getAttribute('alt') || undefined,
              });
            }
          }
        });
      });

      return images;
    }, pageUrl);

    return candidates
      .map((img) => {
        let score = img.score;

        if (img.width >= 1200 && img.height >= 630) score += 20;
        else if (img.width >= 800 && img.height >= 600) score += 10;
        else if (img.width < 400 || img.height < 300) score -= 20;

        const aspectRatio = img.width / img.height;
        if (aspectRatio >= 1.5 && aspectRatio <= 2) score += 10;

        if (['webp', 'avif'].includes(img.format)) score += 5;
        if (img.format === 'svg') score -= 10;

        return { ...img, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  private selectBestImage(candidates: ImageCandidate[]): ImageCandidate | null {
    if (candidates.length === 0) return null;

    const validCandidates = candidates.filter(
      (img) => img.width >= 600 || img.height >= 400 || img.score >= 80,
    );

    return validCandidates[0] || candidates[0];
  }

  private async enhanceImage(
    image: ImageCandidate,
    qualityLevel: string,
  ): Promise<EnhancedImageResult> {
    try {
      const optimizedUrl = this.optimizeImageUrl(image.url);
      const response = await fetch(optimizedUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      const sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();

      const originalWidth = metadata.width || image.width;
      const originalHeight = metadata.height || image.height;

      const quality =
        this.IMAGE_QUALITY[qualityLevel as keyof typeof this.IMAGE_QUALITY] ||
        this.IMAGE_QUALITY.high;

      let targetWidth = quality.width;
      let targetHeight = quality.height;

      if (originalWidth < targetWidth) {
        const scale = targetWidth / originalWidth;
        targetWidth = originalWidth;
        targetHeight = Math.round(originalHeight * scale);
      }

      const optimized = await sharpInstance
        .resize(targetWidth, targetHeight, {
          fit: 'cover',
          position: 'centre',
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false,
        })
        .jpeg({
          quality: quality.quality,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();

      const enhancedUrl = `data:image/jpeg;base64,${optimized.toString('base64')}`;

      return {
        originalUrl: image.url,
        enhancedUrl,
        width: targetWidth,
        height: targetHeight,
        format: 'jpeg',
        quality: quality.quality,
        fileSize: optimized.length,
      };
    } catch (error) {
      console.error('이미지 향상 실패:', error);

      return {
        originalUrl: image.url,
        width: image.width,
        height: image.height,
        format: image.format,
        quality: 0,
        fileSize: 0,
      };
    }
  }

  private optimizeImageUrl(url: string): string {
    const cdnPatterns = {
      cloudinary: (url: string) => {
        return url.replace('/upload/', '/upload/q_auto,f_auto,w_1200,h_630,c_fill/');
      },
      imgix: (url: string) => {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}auto=format,compress&w=1200&h=630&fit=crop&q=90`;
      },
      wordpress: (url: string) => {
        return url.replace(/-\d+x\d+\./, '.');
      },
    };

    for (const [cdn, optimizer] of Object.entries(cdnPatterns)) {
      if (url.includes(cdn)) {
        return optimizer(url);
      }
    }

    return url;
  }

  private async captureHighQualityScreenshot(page: Page): Promise<EnhancedImageResult> {
    try {
      await page.setViewportSize({
        width: 1920,
        height: 1080,
      });

      await page.waitForLoadState('networkidle');
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise((resolve) => {
                  img.onload = img.onerror = resolve;
                }),
            ),
        );
      });

      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 95,
        clip: {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
        },
      });

      const optimized = await sharp(screenshot)
        .resize(1200, 630, {
          fit: 'cover',
          position: 'north',
        })
        .jpeg({
          quality: 90,
          progressive: true,
        })
        .toBuffer();

      const enhancedUrl = `data:image/jpeg;base64,${optimized.toString('base64')}`;

      return {
        originalUrl: page.url(),
        enhancedUrl,
        width: 1200,
        height: 630,
        format: 'jpeg',
        quality: 90,
        fileSize: optimized.length,
      };
    } catch (error) {
      throw new Error(`스크린샷 캡처 실패: ${error}`);
    }
  }

  async generateMultipleFormats(
    buffer: Buffer,
  ): Promise<{ jpeg: string; webp?: string; avif?: string }> {
    const [jpeg, webp, avif] = await Promise.all([
      sharp(buffer).jpeg({ quality: 90, progressive: true }).toBuffer(),
      sharp(buffer).webp({ quality: 85 }).toBuffer(),
      sharp(buffer)
        .avif({ quality: 80 })
        .toBuffer()
        .catch(() => null),
    ]);

    return {
      jpeg: `data:image/jpeg;base64,${jpeg.toString('base64')}`,
      webp: `data:image/webp;base64,${webp.toString('base64')}`,
      avif: avif ? `data:image/avif;base64,${avif.toString('base64')}` : undefined,
    };
  }
}
