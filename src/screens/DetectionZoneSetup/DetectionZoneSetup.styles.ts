import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    backgroundColor: '#000',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backArea: {
    padding: 4,
  },
  flex1: {
    flex: 1,
  },
  saveText: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#000',
  },
  /** overlay bao trùm lên WebView (absolute) */
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  zoneOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFA500',
    backgroundColor: 'rgba(255,165,0,0.2)',
  },
  cornerHandle: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cornerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFA500',
  },
  rightButtons: {
    position: 'absolute',
    right: 16,
    top: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
