import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  ImageURISource,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import type { Response as ImageResizeResponse } from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';
import { useAppSelector } from '@redux/store';
import { API_BASE_URL } from '@api/apiEndpoints';
import { getCurrentLanguage } from '@/i18n';

const MAX_RETRIES = 12;
const STUCK_BEFORE_LOAD_START_MS = 22000;
const FETCH_IMAGE_TIMEOUT_MS = 25000;
/** Full-size avatar processing (detail screens, larger tiles). */
const AVATAR_DECODE_MAX = 512;
/**
 * Smaller decode for dense lists (~36px avatars). Cuts native resize work vs full AVATAR_DECODE_MAX.
 */
export const MEMBER_AVATAR_LIST_DECODE_MAX = 192;

/** Cap parallel download+decode so many list rows don’t compete with touch / navigation on JS + native bridge. */
const AVATAR_LOAD_MAX_CONCURRENT = 3;

class AvatarLoadSemaphore {
  private active = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly max: number) {}

  acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.waiters.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  release(): void {
    this.active--;
    const next = this.waiters.shift();
    if (next) {
      next();
    }
  }
}

const avatarLoadSemaphore = new AvatarLoadSemaphore(AVATAR_LOAD_MAX_CONCURRENT);

/** In-memory map: processed file URI on disk per logical image (uri + decode tier). Avoids re-download when props re-run (e.g. token refresh, parent re-render). */
const resolvedAvatarFileByKey = new Map<string, string>();
const AVATAR_RESOLVED_CACHE_MAX = 150;

function avatarCacheKey(uri: string, decodeMax: number): string {
  return `${uri}\0${decodeMax}`;
}

function rememberResolvedAvatar(cacheKey: string, fileUri: string) {
  if (
    resolvedAvatarFileByKey.size >= AVATAR_RESOLVED_CACHE_MAX &&
    !resolvedAvatarFileByKey.has(cacheKey)
  ) {
    const first = resolvedAvatarFileByKey.keys().next().value as string | undefined;
    if (first !== undefined) {
      resolvedAvatarFileByKey.delete(first);
    }
  }
  resolvedAvatarFileByKey.set(cacheKey, fileUri);
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  imageLayer: { position: 'absolute', left: 0, top: 0, zIndex: 1 },
  imageHidden: { opacity: 0 },
  loadingOnTop: { zIndex: 2 },
});

let apiOrigin: string;
try {
  apiOrigin = new URL(API_BASE_URL).origin;
} catch {
  apiOrigin = '';
}

function normalizeImageUri(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const u = raw.trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('//')) return `https:${u}`;
  if (!apiOrigin) return u;
  if (u.startsWith('/')) return `${apiOrigin}${u}`;
  return `${API_BASE_URL.replace(/\/$/, '')}/${u.replace(/^\//, '')}`;
}

function shouldAttachAuth(uri: string): boolean {
  if (!apiOrigin) return false;
  try {
    return new URL(uri).origin === apiOrigin;
  } catch {
    return false;
  }
}

function isLikelyS3OrCdn(uri: string): boolean {
  try {
    const h = new URL(uri).hostname;
    return (
      /\.amazonaws\.com$/i.test(h) ||
      /\.s3[.-][a-z0-9-]+\.amazonaws\.com$/i.test(h) ||
      h.includes('s3.amazonaws.com')
    );
  } catch {
    return false;
  }
}

function fileUriFromResizeResponse(r: ImageResizeResponse): string {
  const u = r.uri;
  return u.startsWith('file://') ? u : `file://${u}`;
}

function inputPathForResizer(r: ImageResizeResponse): string {
  if (r.path) return r.path;
  return r.uri.replace(/^file:\/\//, '');
}

/**
 * Avatars should be portrait (chiều dọc). After EXIF is baked in, if pixels are still landscape, rotate 90°.
 */
async function ensurePortraitPixels(
  firstPass: ImageResizeResponse,
  decodeMax: number
): Promise<string> {
  if (firstPass.width <= firstPass.height) {
    return fileUriFromResizeResponse(firstPass);
  }
  const inputPath = inputPathForResizer(firstPass);
  const rotated = await ImageResizer.createResizedImage(
    inputPath,
    decodeMax,
    decodeMax,
    'JPEG',
    88,
    90,
    undefined,
    false,
    { mode: 'contain', onlyScaleDown: true }
  );
  await RNFS.unlink(inputPath).catch(() => {});
  return fileUriFromResizeResponse(rotated);
}

/**
 * Download → temp file (native, no base64 on JS thread) → resize (native decode applies EXIF orientation).
 */
async function fetchResizeAndGetDisplayUri(
  uri: string,
  accessToken: string | null,
  signal: AbortSignal,
  decodeMax: number
): Promise<string | null> {
  const headers: Record<string, string> = { Accept: 'image/*' };
  const s3 = isLikelyS3OrCdn(uri);
  if (!s3) {
    headers['Accept-Language'] = getCurrentLanguage();
  }
  if (accessToken && shouldAttachAuth(uri)) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const tmpIn = `${RNFS.CachesDirectoryPath}/ma_in_${Date.now()}_${Math.random().toString(36).slice(2)}.bin`;

  try {
    const { promise } = RNFS.downloadFile({
      fromUrl: uri,
      toFile: tmpIn,
      headers,
      readTimeout: FETCH_IMAGE_TIMEOUT_MS,
      connectionTimeout: 15000,
    });
    const result = await promise;
    if (signal.aborted) {
      await RNFS.unlink(tmpIn).catch(() => {});
      return null;
    }
    if (result.statusCode < 200 || result.statusCode >= 300 || !result.bytesWritten) {
      await RNFS.unlink(tmpIn).catch(() => {});
      return null;
    }

    try {
      const resized = await ImageResizer.createResizedImage(
        tmpIn,
        decodeMax,
        decodeMax,
        'JPEG',
        88,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true }
      );
      await RNFS.unlink(tmpIn).catch(() => {});
      return ensurePortraitPixels(resized, decodeMax);
    } catch {
      await RNFS.unlink(tmpIn).catch(() => {});
      return null;
    }
  } catch {
    await RNFS.unlink(tmpIn).catch(() => {});
    return null;
  }
}

/** Local file already on device — still run through resizer so EXIF orientation is applied to pixels. */
async function localFileToOrientedDisplayUri(
  filePathOrUri: string,
  decodeMax: number
): Promise<string | null> {
  const path = filePathOrUri.replace(/^file:\/\//, '');
  try {
    const resized = await ImageResizer.createResizedImage(
      path,
      decodeMax,
      decodeMax,
      'JPEG',
      88,
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true }
    );
    return ensurePortraitPixels(resized, decodeMax);
  } catch {
    return null;
  }
}

export type MemberAvatarProps = {
  uri?: string;
  containerStyle: StyleProp<ViewStyle>;
  imageStyle: StyleProp<ImageStyle>;
  placeholderStyle: StyleProp<ViewStyle>;
  loadingOverlayStyle: StyleProp<ViewStyle>;
  hiddenWhileLoadingStyle?: StyleProp<ImageStyle>;
  iconColor: string;
  iconSize?: number;
  spinnerColor: string;
  /** Max dimension for native resize (width & height). Lower = faster for small list thumbnails. Default 512. */
  decodeMax?: number;
};

export function MemberAvatar({
  uri,
  containerStyle,
  placeholderStyle,
  loadingOverlayStyle,
  hiddenWhileLoadingStyle,
  imageStyle,
  iconColor,
  iconSize = 18,
  spinnerColor,
  decodeMax = AVATAR_DECODE_MAX,
}: MemberAvatarProps) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;
  const [retryIndex, setRetryIndex] = useState(0);
  const [loading, setLoading] = useState(!!uri);
  const [photoVisible, setPhotoVisible] = useState(false);
  const [givenUp, setGivenUp] = useState(false);
  const [hasLoadStarted, setHasLoadStarted] = useState(false);
  const [displayFileUri, setDisplayFileUri] = useState<string | null>(null);
  const loadSessionRef = useRef(0);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const normalizedUri = useMemo(() => normalizeImageUri(uri), [uri]);

  const imageSource = useMemo((): ImageURISource | undefined => {
    if (!displayFileUri) return undefined;
    return { uri: displayFileUri };
  }, [displayFileUri]);

  useEffect(() => {
    loadSessionRef.current += 1;
  }, [normalizedUri, retryIndex]);

  useEffect(() => {
    setRetryIndex(0);
    setGivenUp(false);
    setLoading(!!normalizedUri);
    setPhotoVisible(false);
    setHasLoadStarted(false);
    setDisplayFileUri(null);
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = null;
  }, [normalizedUri]);

  useEffect(() => {
    setHasLoadStarted(false);
    setPhotoVisible(false);
  }, [retryIndex]);

  const retryOrGiveUp = useCallback(() => {
    setPhotoVisible(false);
    setDisplayFileUri(null);
    setRetryIndex((i) => {
      if (i >= MAX_RETRIES - 1) {
        setGivenUp(true);
        return i;
      }
      return i + 1;
    });
    setLoading(true);
  }, []);

  useEffect(() => {
    if (!normalizedUri || givenUp) return undefined;

    const cacheKey = avatarCacheKey(normalizedUri, decodeMax);
    let cancelled = false;

    let fetchTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let deferredLoad: { cancel?: () => void } | undefined;

    void (async () => {
      const cached = resolvedAvatarFileByKey.get(cacheKey);
      if (cached && retryIndex === 0) {
        const path = cached.replace(/^file:\/\//, '');
        try {
          if (await RNFS.exists(path)) {
            if (cancelled) return;
            setDisplayFileUri(cached);
            setLoading(true);
            setPhotoVisible(false);
            return;
          }
        } catch {
          /* fall through to network */
        }
        resolvedAvatarFileByKey.delete(cacheKey);
      }

      if (cancelled) return;

      fetchAbortRef.current?.abort();
      const ac = new AbortController();
      fetchAbortRef.current = ac;

      const immediateId = setImmediate(() => {
        if (cancelled) return;

        fetchTimeoutId = setTimeout(() => ac.abort(), FETCH_IMAGE_TIMEOUT_MS);

        setLoading(true);
        setPhotoVisible(false);
        setDisplayFileUri(null);

        void (async () => {
          let slotHeld = false;
          const clearFetchTimeout = () => {
            if (fetchTimeoutId !== undefined) {
              clearTimeout(fetchTimeoutId);
              fetchTimeoutId = undefined;
            }
          };

          try {
            await avatarLoadSemaphore.acquire();
            slotHeld = true;
            if (cancelled || ac.signal.aborted) return;

            try {
              if (/^https?:\/\//i.test(normalizedUri)) {
                const fileUri = await fetchResizeAndGetDisplayUri(
                  normalizedUri,
                  accessTokenRef.current,
                  ac.signal,
                  decodeMax
                );
                clearFetchTimeout();
                if (cancelled) return;
                if (fileUri) {
                  rememberResolvedAvatar(cacheKey, fileUri);
                  setDisplayFileUri(fileUri);
                  setLoading(true);
                } else {
                  retryOrGiveUp();
                }
                return;
              }

              clearFetchTimeout();
              if (cancelled) return;

              const local = normalizedUri.startsWith('file://')
                ? normalizedUri
                : `file://${normalizedUri}`;
              const oriented = await localFileToOrientedDisplayUri(local, decodeMax);
              if (cancelled) return;
              if (oriented) {
                rememberResolvedAvatar(cacheKey, oriented);
                setDisplayFileUri(oriented);
                setLoading(true);
              } else {
                rememberResolvedAvatar(cacheKey, local);
                setDisplayFileUri(local);
                setLoading(true);
              }
            } catch {
              clearFetchTimeout();
              if (cancelled) return;
              retryOrGiveUp();
            }
          } finally {
            if (slotHeld) {
              avatarLoadSemaphore.release();
            }
          }
        })();
      });
      deferredLoad = { cancel: () => clearImmediate(immediateId) };
    })();

    return () => {
      cancelled = true;
      if (fetchTimeoutId !== undefined) {
        clearTimeout(fetchTimeoutId);
      }
      fetchAbortRef.current?.abort();
      deferredLoad?.cancel?.();
    };
  }, [normalizedUri, retryIndex, givenUp, retryOrGiveUp, decodeMax]);

  useEffect(() => {
    if (!normalizedUri || givenUp || !loading || hasLoadStarted || !displayFileUri)
      return undefined;
    const id = setTimeout(() => {
      retryOrGiveUp();
    }, STUCK_BEFORE_LOAD_START_MS);
    return () => clearTimeout(id);
  }, [normalizedUri, retryIndex, givenUp, loading, hasLoadStarted, displayFileUri, retryOrGiveUp]);

  if (!normalizedUri || givenUp) {
    return (
      <View style={[containerStyle, placeholderStyle]}>
        <Icon name="account" size={iconSize} color={iconColor} />
      </View>
    );
  }

  return (
    <View style={[containerStyle, placeholderStyle, styles.root]}>
      {imageSource ? (
        <Image
          key={displayFileUri ?? 'img'}
          source={imageSource}
          style={[
            imageStyle,
            styles.imageLayer,
            !photoVisible && (hiddenWhileLoadingStyle ?? styles.imageHidden),
          ]}
          resizeMode="cover"
          fadeDuration={0}
          onLoadStart={() => setHasLoadStarted(true)}
          onLoad={() => {
            setLoading(false);
            setPhotoVisible(true);
          }}
          onError={() => {
            setPhotoVisible(false);
            retryOrGiveUp();
          }}
          onLoadEnd={() => {
            if (Platform.OS !== 'android') return;
            const session = loadSessionRef.current;
            queueMicrotask(() => {
              if (session !== loadSessionRef.current) return;
              setLoading(false);
              setPhotoVisible(true);
            });
          }}
        />
      ) : null}
      {loading && (
        <View style={[loadingOverlayStyle, styles.loadingOnTop]}>
          <ActivityIndicator size="small" color={spinnerColor} />
        </View>
      )}
    </View>
  );
}
