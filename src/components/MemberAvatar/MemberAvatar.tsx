import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/** Number of distinct load attempts (first load + retries). */
const MAX_RETRIES = 8;
/** If the image never fires onLoad (common on some Android devices), force a retry. */
const STUCK_LOAD_MS = 12000;

function uriWithRetryBuster(uri: string, retryIndex: number): string {
  if (retryIndex === 0) return uri;
  const sep = uri.includes('?') ? '&' : '?';
  return `${uri}${sep}_rn_av=${retryIndex}&_ts=${Date.now()}`;
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
  imageStyle,
  placeholderStyle,
  loadingOverlayStyle,
  hiddenWhileLoadingStyle,
  iconColor,
  iconSize = 18,
  spinnerColor,
}: MemberAvatarProps) {
  const [retryIndex, setRetryIndex] = useState(0);
  const [loading, setLoading] = useState(!!uri);
  const [givenUp, setGivenUp] = useState(false);

  const resolvedUri = useMemo(
    () => (uri ? uriWithRetryBuster(uri, retryIndex) : ''),
    [uri, retryIndex]
  );

  useEffect(() => {
    setRetryIndex(0);
    setGivenUp(false);
    setLoading(!!uri);
  }, [uri]);

  const retryOrGiveUp = useCallback(() => {
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
    if (!uri || givenUp || !loading) return undefined;
    const id = setTimeout(() => {
      retryOrGiveUp();
    }, STUCK_LOAD_MS);
    return () => clearTimeout(id);
  }, [uri, retryIndex, givenUp, loading, retryOrGiveUp]);

  if (!uri || givenUp) {
    return (
      <View style={[containerStyle, placeholderStyle]}>
        <Icon name="account" size={iconSize} color={iconColor} />
      </View>
    );
  }

  return (
    <View style={[containerStyle, placeholderStyle]}>
      <Image
        key={resolvedUri}
        source={{ uri: resolvedUri }}
        style={[imageStyle, loading && hiddenWhileLoadingStyle]}
        resizeMode="cover"
        onLoad={() => setLoading(false)}
        onError={() => retryOrGiveUp()}
      />
      {loading && (
        <View style={loadingOverlayStyle}>
          <ActivityIndicator size="small" color={spinnerColor} />
        </View>
      )}
    </View>
  );
}
