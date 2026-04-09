import { StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';

export const getStyles = (width: number, height: number) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },

    videoWrapper: {
      width: '100%',
      height: height * 0.35,
      backgroundColor: '#000',
    },
    videoContainer: {
      flex: 1,
      position: 'relative',
      backgroundColor: '#000',
    },
    video: {
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
    },

    // Fullscreen Mode
    fullscreenContainer: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Landscape wrapper - rotates 90 degrees
    landscapeWrapper: {
      width: height, // swap width and height
      height: width,
      transform: [{ rotate: '90deg' }],
      backgroundColor: '#000',
    },
    fullscreenVideoContainer: {
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1a1a1a',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
      zIndex: 10,
    },
    loadingIndicatorOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    loadingText: {
      color: '#FFF',
      fontSize: 16,
      marginTop: 12,
    },
    errorOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    reconnectingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9,
    },

    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1a1a1a',
      padding: 20,
    },
    errorTitle: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      color: '#9CA3AF',
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#3B82F6',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    retryButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
    },

    topOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 12,
      paddingTop: 8,
      zIndex: 11,
      elevation: 11,
    },
    topLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.3)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 40,
      gap: 4,
      alignSelf: 'flex-start',
    },
    liveRedDot: {
      width: 13,
      height: 13,
      borderRadius: 100,
      backgroundColor: COLORS.FF0000,
    },
    liveText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: FONTS.weights.medium,
    },
    offlineIndicator: {
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    offlineDot: {
      backgroundColor: '#999',
    },
    bitrateIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      gap: 4,
    },
    bitrateText: {
      color: '#FFF',
      fontSize: 10,
    },
    hdBadge: {
      backgroundColor: 'rgba(255,255,255,0.3)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 40,
      width: 80,
      height: 37,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    hdText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '700',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    rightControls: {
      position: 'absolute',
      right: 12,
      bottom: 12,
    },

    fullscreenRightControls: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: [{ translateY: -100 }],
      gap: 12,
    },

    controlButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    exitFullscreenButton: {
      marginTop: 8,
      backgroundColor: 'rgba(239,68,68,0.8)',
    },

    watermark: {
      position: 'absolute',
      bottom: 12,
      left: 12,
    },
    watermarkText: {
      color: '#FFF',
      fontSize: 20,
      fontWeight: 'bold',
      opacity: 0.8,
    },

    infoSection: {
      flex: 1,
      backgroundColor: '#0F1419',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    infoIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#1A1F2E',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    infoText: {
      color: '#6B7280',
      fontSize: 14,
    },

    bottomControls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#000',
      paddingVertical: 20,
      paddingHorizontal: 40,
      paddingBottom: Platform.OS === 'ios' ? 30 : 20,
      borderTopWidth: 1,
      borderTopColor: '#1F2937',
    },
    mainButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 70,
    },
    mainButtonDisabled: {
      opacity: 0.4,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#374151',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    iconCircleActive: {
      backgroundColor: '#44ef52',
    },
    mainButtonText: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: '500',
    },

    // Quality Modal Styles - UPDATED with Animation
    qualityModalOverlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'flex-end',
      zIndex: 9999,
      elevation: 9999,
    },
    qualityModalBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalContent: {
      backgroundColor: '#FFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      maxHeight: height * 0.6,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      zIndex: 10000,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      backgroundColor: '#FFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#111827',
    },
    qualityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
      backgroundColor: '#FFF',
    },
    qualityItemActive: {
      backgroundColor: '#F0FDF4',
    },
    qualityInfo: {
      flex: 1,
    },
    qualityText: {
      fontSize: 16,
      color: '#111827',
      fontWeight: '500',
      marginBottom: 4,
    },
    qualityTextActive: {
      color: '#16A34A',
      fontWeight: '700',
    },
    qualityResolution: {
      fontSize: 13,
      color: '#6B7280',
    },
    hdStyle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    muteButton: {
      position: 'absolute',
      top: 7,
      right: 78,
      width: 34,
      height: 34,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    micIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
};
