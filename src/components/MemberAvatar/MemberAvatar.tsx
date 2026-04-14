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
const AVATAR_DECODE_MAX = 512;

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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function extFromContentType(contentType: string | null): string {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  return 'jpg';
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
async function ensurePortraitPixels(firstPass: ImageResizeResponse): Promise<string> {
  if (firstPass.width <= firstPass.height) {
    return fileUriFromResizeResponse(firstPass);
  }
  const inputPath = inputPathForResizer(firstPass);
  const rotated = await ImageResizer.createResizedImage(
    inputPath,
    AVATAR_DECODE_MAX,
    AVATAR_DECODE_MAX,
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
 * Download → temp file → resize (native decode applies EXIF orientation, so avatars aren’t sideways).
 */
async function fetchResizeAndGetDisplayUri(
  uri: string,
  accessToken: string | null,
  signal: AbortSignal
): Promise<string | null> {
  const headers: Record<string, string> = { Accept: 'image/*' };
  const s3 = isLikelyS3OrCdn(uri);
  if (!s3) {
    headers['Accept-Language'] = getCurrentLanguage();
  }
  if (accessToken && shouldAttachAuth(uri)) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(uri, { headers, signal });
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  if (buf.byteLength === 0) return null;

  const b64 = arrayBufferToBase64(buf);
  const ext = extFromContentType(res.headers.get('content-type'));
  const tmpIn = `${RNFS.CachesDirectoryPath}/ma_in_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  await RNFS.writeFile(tmpIn, b64, 'base64');

  try {
    const resized = await ImageResizer.createResizedImage(
      tmpIn,
      AVATAR_DECODE_MAX,
      AVATAR_DECODE_MAX,
      'JPEG',
      88,
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true }
    );
    await RNFS.unlink(tmpIn).catch(() => {});
    return ensurePortraitPixels(resized);
  } catch {
    try {
      await RNFS.unlink(tmpIn).catch(() => {});
    } catch {
      /* ignore */
    }
    return null;
  }
}

/** Local file already on device — still run through resizer so EXIF orientation is applied to pixels. */
async function localFileToOrientedDisplayUri(filePathOrUri: string): Promise<string | null> {
  const path = filePathOrUri.replace(/^file:\/\//, '');
  try {
    const resized = await ImageResizer.createResizedImage(
      path,
      AVATAR_DECODE_MAX,
      AVATAR_DECODE_MAX,
      'JPEG',
      88,
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true }
    );
    return ensurePortraitPixels(resized);
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
}: MemberAvatarProps) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
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

    let cancelled = false;
    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;
    const timeoutId = setTimeout(() => ac.abort(), FETCH_IMAGE_TIMEOUT_MS);

    setLoading(true);
    setPhotoVisible(false);
    setDisplayFileUri(null);

    (async () => {
      try {
        if (/^https?:\/\//i.test(normalizedUri)) {
          const fileUri = await fetchResizeAndGetDisplayUri(normalizedUri, accessToken, ac.signal);
          clearTimeout(timeoutId);
          if (cancelled) return;
          if (fileUri) {
            setDisplayFileUri(fileUri);
            setLoading(true);
          } else {
            retryOrGiveUp();
          }
          return;
        }

        clearTimeout(timeoutId);
        if (cancelled) return;
        const local = normalizedUri.startsWith('file://')
          ? normalizedUri
          : `file://${normalizedUri}`;
        const oriented = await localFileToOrientedDisplayUri(local);
        if (cancelled) return;
        if (oriented) {
          setDisplayFileUri(oriented);
          setLoading(true);
        } else {
          setDisplayFileUri(local);
          setLoading(true);
        }
      } catch {
        clearTimeout(timeoutId);
        if (cancelled) return;
        retryOrGiveUp();
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      ac.abort();
    };
  }, [normalizedUri, retryIndex, accessToken, givenUp, retryOrGiveUp]);

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
