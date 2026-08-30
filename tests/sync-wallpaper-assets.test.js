import { describe, expect, it } from 'vitest'
import {
  isRetryableNetworkError,
  mapBingWallpaperAsset,
  mapStandardWallpaperAsset,
  withNetworkRetry,
} from '../scripts/sync-wallpaper-assets.js'

describe('mapStandardWallpaperAsset', () => {
  it('creates a stable asset key and active asset record for standard wallpapers', () => {
    const record = mapStandardWallpaperAsset('desktop', {
      category: '动漫',
      cdnTag: 'v1.2.24',
      createdAt: '2026-03-22T14:29:36.514Z',
      description: '一位黑发少年挥舞着缠绕火焰的长剑。',
      displayTitle: '炎热中的剑术对决',
      filename: '剑客-动漫角色.png',
      format: 'PNG',
      id: 'desktop-511',
      keywords: ['动漫', '鬼灭之刃'],
      path: '/wallpaper/desktop/动漫/鬼灭之刃/%E5%89%91%E5%AE%A2.png',
      previewPath: '/preview/desktop/动漫/鬼灭之刃/%E5%89%91%E5%AE%A2.webp',
      resolution: { height: 2160, width: 3840 },
      size: 14286235,
      subcategory: '鬼灭之刃',
      tags: ['动漫', '鬼灭之刃'],
      thumbnailPath: '/thumbnail/desktop/动漫/鬼灭之刃/%E5%89%91%E5%AE%A2.webp',
    })

    expect(record.asset_key).toBe('desktop:剑客-动漫角色.png')
    expect(record.status).toBe('active')
    expect(record.removed_at).toBeNull()
    expect(record.raw_url).toContain('nuanXinProPic@v1.2.24')
    expect(record.metadata.urls.thumbnail).toContain('/thumbnail/desktop/')
  })
})

describe('mapBingWallpaperAsset', () => {
  it('normalizes Bing filenames and produces absolute preview URLs', () => {
    const record = mapBingWallpaperAsset({
      copyright: '淡水泉中的幼年海牛',
      date: '2026-03-25',
      title: '海牛的秘密生活',
      urlbase: '/th?id=OHR.ManateeSpring_ZH-CN5252847120',
    })

    expect(record.asset_key).toBe('bing:bing-2026-03-25.jpg')
    expect(record.filename).toBe('bing-2026-03-25.jpg')
    expect(record.category).toBe('2026-03')
    expect(record.preview_path).toBe('https://cn.bing.com/th?id=OHR.ManateeSpring_ZH-CN5252847120_1920x1080.jpg')
    expect(record.raw_url).toBe('https://cn.bing.com/th?id=OHR.ManateeSpring_ZH-CN5252847120_UHD.jpg')
  })
})

describe('withNetworkRetry', () => {
  it('retries transient network failures and eventually succeeds', async () => {
    let attempts = 0
    const result = await withNetworkRetry('test-op', async () => {
      attempts += 1
      if (attempts < 3) {
        throw new Error('TypeError: fetch failed')
      }
      return 'ok'
    }, 3)

    expect(result).toBe('ok')
    expect(attempts).toBe(3)
  })

  it('does not retry non-network errors', async () => {
    let attempts = 0
    await expect(withNetworkRetry('test-op', async () => {
      attempts += 1
      throw new Error('invalid input payload')
    }, 3)).rejects.toThrow('invalid input payload')

    expect(attempts).toBe(1)
  })
})

describe('isRetryableNetworkError', () => {
  it('recognizes fetch failures as retryable', () => {
    expect(isRetryableNetworkError(new Error('TypeError: fetch failed'))).toBe(true)
  })
})
