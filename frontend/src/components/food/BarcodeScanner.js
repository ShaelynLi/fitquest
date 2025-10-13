import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * BarcodeScanner Component
 *
 * Provides barcode scanning functionality using device camera
 * Supports UPC-A, EAN-13, EAN-8 barcodes for food products
 */
export default function BarcodeScanner({ onBarcodeScanned, onClose, isVisible }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    if (isVisible) {
      getCameraPermissions();
      setScanned(false); // Reset scanned state when scanner becomes visible
    }
  }, [isVisible]);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return; // Prevent multiple scans

    setScanned(true);
    console.log('Barcode scanned:', { type, data });

    // Add a small delay to prevent duplicate events
    setTimeout(() => {
      // Validate barcode format (should be 8-13 digits)
      const cleanBarcode = data.replace(/\D/g, ''); // Remove non-digits
      if (cleanBarcode.length >= 8 && cleanBarcode.length <= 13) {
        onBarcodeScanned(cleanBarcode);
      } else {
        Alert.alert(
          'Invalid Barcode',
          'Please scan a valid product barcode (UPC or EAN format)',
          [
            {
              text: 'Try Again',
              onPress: () => setScanned(false),
            },
          ]
        );
      }
    }, 100);
  };

  const resetScanner = () => {
    setScanned(false);
  };

  if (!isVisible) {
    return null;
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={colors.textSecondary} />
          <Text style={styles.messageText}>Camera permission denied</Text>
          <Text style={styles.subText}>
            Please enable camera access in your device settings to scan barcodes
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Barcode</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["upc_a", "upc_e", "ean13", "ean8"],
          }}
        />

        {/* Scanning Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanningArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionText}>
            Position the barcode within the frame
          </Text>
          <Text style={styles.subInstructionText}>
            Supports UPC and EAN barcodes
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {scanned ? (
            <TouchableOpacity style={styles.retryButton} onPress={resetScanner}>
              <Ionicons name="refresh" size={20} color={colors.white} />
              <Text style={styles.retryButtonText}>Scan Again</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    paddingTop: StatusBar.currentHeight || 0, // Handle Android status bar
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md, // Reduced since we handle status bar in container
    paddingBottom: spacing.md,
    backgroundColor: colors.black,
    zIndex: 10, // Ensure header stays on top
  },
  closeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  headerSpacer: {
    width: 44,
  },

  // Camera
  cameraContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningArea: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7 * 0.6, // Rectangular for barcode
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.white,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },

  // Instructions
  instructionsContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  instructionText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subInstructionText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },

  // Actions
  actionsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  retryButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.white,
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },

  // Permission/Error States
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  messageText: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.heading,
    fontWeight: typography.weights.medium,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.xl,
  },
  closeButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.black,
  },
});