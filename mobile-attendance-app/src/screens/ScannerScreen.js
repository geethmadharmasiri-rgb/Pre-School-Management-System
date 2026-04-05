import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS } from '../config';
import api from '../services/api';
import offlineStorage from '../services/offlineStorage';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.68;

// ─── Mode Selection Screen ──────────────────────────────────────────────────
function ModeSelector({ selectedClass, onSelect }) {
  return (
    <View style={styles.modeContainer}>
      {/* Header */}
      <View style={styles.modeHeader}>
        <Text style={styles.modeClassName}>{selectedClass?.name || 'Class'}</Text>
        <Text style={styles.modeTitle}>Select Scan Mode</Text>
        <Text style={styles.modeSub}>Choose what you are marking before scanning</Text>
      </View>

      {/* Drop-off Card */}
      <TouchableOpacity
        style={[styles.modeCard, styles.modeCardDropOff]}
        onPress={() => onSelect('DROP_OFF')}
        activeOpacity={0.85}
      >
        <View style={styles.modeCardIcon}>
          <Text style={styles.modeEmoji}>🌅</Text>
        </View>
        <View style={styles.modeCardText}>
          <Text style={styles.modeCardTitle}>Drop-off</Text>
          <Text style={styles.modeCardDesc}>Scan QR to mark child as arrived at school</Text>
        </View>
        <Text style={styles.modeArrow}>›</Text>
      </TouchableOpacity>

      {/* Pick-up Card */}
      <TouchableOpacity
        style={[styles.modeCard, styles.modeCardPickUp]}
        onPress={() => onSelect('PICK_UP')}
        activeOpacity={0.85}
      >
        <View style={[styles.modeCardIcon, { backgroundColor: '#ede9fe' }]}>
          <Text style={styles.modeEmoji}>🌆</Text>
        </View>
        <View style={styles.modeCardText}>
          <Text style={[styles.modeCardTitle, { color: '#5b21b6' }]}>Pick-up</Text>
          <Text style={styles.modeCardDesc}>Scan QR to mark child as picked up</Text>
        </View>
        <Text style={[styles.modeArrow, { color: '#7c3aed' }]}>›</Text>
      </TouchableOpacity>

      <Text style={styles.modeFootnote}>
        You can switch mode at any time during the session
      </Text>
    </View>
  );
}

// ─── Camera Scanner ─────────────────────────────────────────────────────────
export default function ScannerScreen({ route }) {
  const { selectedClass } = route.params;
  const [permission, requestPermission] = useCameraPermissions();

  // null = mode selector shown, 'DROP_OFF' or 'PICK_UP' = camera active
  const [scanMode, setScanMode] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      const result = await api.scanAttendance(data, selectedClass.id, scanMode);
      setResultModal({
        type: 'success',
        title: scanMode === 'DROP_OFF' ? '🌅 Drop-off Recorded!' : '🌆 Pick-up Recorded!',
        childName: result.child?.name || 'Unknown Child',
        message: result.message,
        time: result.time || new Date().toTimeString().split(' ')[0].slice(0, 5),
        scanMode,
      });
    } catch (err) {
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        await offlineStorage.addToQueue({
          qrData: data,
          classId: selectedClass.id,
          scanType: scanMode,
          scanDate: new Date().toISOString().split('T')[0],
          scanTime: new Date().toTimeString().split(' ')[0],
        });
        setResultModal({
          type: 'warning',
          title: '📡 Saved Offline',
          childName: data,
          message: 'No internet. This scan will sync automatically when reconnected.',
          scanMode,
        });
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setResultModal({
          type: 'error',
          title: '❌ Scan Failed',
          message: err.message || 'Could not process this QR code.',
          scanMode,
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setResultModal(null);
  };

  const changeMode = () => {
    setScanned(false);
    setResultModal(null);
    setScanMode(null);
  };

  // ── Permission screens ────────────────────────────────────────────────────
  if (!permission) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionEmoji}>📷</Text>
        <Text style={styles.perTitle}>Camera Access Required</Text>
        <Text style={styles.perSub}>Grant access to scan QR codes for attendance</Text>
        <TouchableOpacity style={styles.perBtn} onPress={requestPermission}>
          <Text style={styles.perBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Mode Selection ────────────────────────────────────────────────────────
  if (!scanMode) {
    return <ModeSelector selectedClass={selectedClass} onSelect={setScanMode} />;
  }

  // ── Scanner ───────────────────────────────────────────────────────────────
  const isDropOff = scanMode === 'DROP_OFF';
  const modeColor = isDropOff ? '#10b981' : '#7c3aed';
  const modeBg = isDropOff ? 'rgba(16,185,129,0.25)' : 'rgba(124,58,237,0.25)';
  const modeLabel = isDropOff ? '🌅 DROP-OFF MODE' : '🌆 PICK-UP MODE';

  return (
    <View style={styles.container}>
      {/* Live Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Dark overlay with transparent scan zone */}
      <View style={styles.overlayContainer} pointerEvents="box-none">

        {/* Top bar — mode indicator */}
        <View style={styles.topBar}>
          <View style={[styles.modePill, { backgroundColor: modeBg, borderColor: modeColor }]}>
            <Text style={[styles.modePillText, { color: modeColor }]}>{modeLabel}</Text>
          </View>
          <Text style={styles.classLabel}>{selectedClass?.name}</Text>
        </View>

        {/* Scan frame area */}
        <View style={styles.scanArea}>
          {/* Semi-dark sides */}
          <View style={styles.shadowTop} />
          <View style={styles.middleRow}>
            <View style={styles.shadowSide} />
            {/* The transparent clear zone — QR frame */}
            <View style={[styles.qrFrame, { borderColor: modeColor }]}>
              <View style={[styles.corner, styles.cornerTL, { borderColor: modeColor }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: modeColor }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: modeColor }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: modeColor }]} />
              {processing && (
                <View style={styles.processingBadge}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.processingText}>Reading...</Text>
                </View>
              )}
            </View>
            <View style={styles.shadowSide} />
          </View>
          <View style={styles.shadowBottom} />
        </View>

        {/* Hint text */}
        <Text style={styles.scanHint}>
          {processing ? 'Processing QR code...' : 'Align QR code within the frame'}
        </Text>

        {/* Bottom — switch mode button */}
        <View style={styles.bottomBar} pointerEvents="auto">
          <TouchableOpacity style={styles.switchModeBtn} onPress={changeMode}>
            <Text style={styles.switchModeIcon}>⇄</Text>
            <Text style={styles.switchModeText}>
              Switch to {isDropOff ? 'Pick-up' : 'Drop-off'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Result Bottom Sheet Modal */}
      <Modal transparent visible={!!resultModal} animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalHandle} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{resultModal?.title}</Text>
            {resultModal?.childName && (
              <Text style={styles.modalChildName}>{resultModal.childName}</Text>
            )}
            {resultModal?.time && (
              <View style={[styles.modalTimePill, { backgroundColor: isDropOff ? '#dcfce7' : '#ede9fe' }]}>
                <Text style={[styles.modalTime, { color: modeColor }]}>{resultModal.time}</Text>
              </View>
            )}
            <Text style={styles.modalMsg}>{resultModal?.message}</Text>

            <View style={styles.modalActions}>
              {/* Next Scan in same mode */}
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: modeColor }]}
                onPress={resetScanner}
              >
                <Text style={styles.modalBtnText}>Next Scan</Text>
              </TouchableOpacity>
              {/* Change mode */}
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={changeMode}
              >
                <Text style={[styles.modalBtnText, { color: '#475569' }]}>Change Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // ── Permission screen
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 40 },
  permissionEmoji: { fontSize: 56, marginBottom: 20 },
  perTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  perSub: { fontSize: 14, color: '#64748b', marginBottom: 28, textAlign: 'center' },
  perBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 14 },
  perBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // ── Mode selector screen
  modeContainer: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 24, paddingTop: 60 },
  modeHeader: { marginBottom: 36 },
  modeClassName: { fontSize: 13, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  modeTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  modeSub: { fontSize: 14, color: '#94a3b8' },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 20, padding: 20, marginBottom: 16,
    ...SHADOWS.medium, borderWidth: 1, borderColor: '#f1f5f9',
  },
  modeCardDropOff: { borderLeftWidth: 4, borderLeftColor: '#10b981' },
  modeCardPickUp: { borderLeftWidth: 4, borderLeftColor: '#7c3aed' },
  modeCardIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  modeEmoji: { fontSize: 26 },
  modeCardText: { flex: 1 },
  modeCardTitle: { fontSize: 18, fontWeight: '800', color: '#166534', marginBottom: 4 },
  modeCardDesc: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  modeArrow: { fontSize: 28, color: '#10b981', fontWeight: '900' },
  modeFootnote: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 24 },

  // ── Scanner overlay
  overlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { alignItems: 'center', paddingTop: 60, paddingBottom: 20, backgroundColor: 'rgba(0,0,0,0.55)' },
  modePill: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, marginBottom: 8,
  },
  modePillText: { fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  classLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },

  // Scan frame construction (overlay with clear hole in the middle)
  scanArea: { flex: 1 },
  shadowTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  middleRow: { flexDirection: 'row', height: SCAN_AREA_SIZE },
  shadowSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  shadowBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  qrFrame: {
    width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE,
    borderWidth: 1.5, borderColor: '#10b981',
    justifyContent: 'center', alignItems: 'center',
  },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: '#10b981' },
  cornerTL: { top: -2, left: -2, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 12 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 12 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 12 },
  processingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  processingText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  scanHint: {
    textAlign: 'center', color: 'rgba(255,255,255,0.6)',
    fontSize: 13, paddingVertical: 16, backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: 'rgba(0,0,0,0.7)', paddingBottom: 42, paddingTop: 20, alignItems: 'center',
  },
  switchModeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 28,
    paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  switchModeIcon: { color: '#fff', fontSize: 18, fontWeight: '900' },
  switchModeText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Result modal
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 32, paddingBottom: 48, alignItems: 'center',
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  modalChildName: { fontSize: 19, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  modalTimePill: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 50, marginBottom: 16 },
  modalTime: { fontSize: 28, fontWeight: '900' },
  modalMsg: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  modalActions: { width: '100%', gap: 10 },
  modalBtn: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', ...SHADOWS.small },
  modalBtnSecondary: { backgroundColor: '#f1f5f9' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
