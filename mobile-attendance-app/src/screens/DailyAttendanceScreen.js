import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../config';
import api from '../services/api';

export default function DailyAttendanceScreen({ route }) {
  const { selectedClass } = route.params;
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, DROPPED_OFF, COMPLETED, NOT_MARKED
  const [searchQuery, setSearchQuery] = useState('');
  const [manualModal, setManualModal] = useState({ visible: false, child: null, status: null });
  const [manualReason, setManualReason] = useState('');

  const REASONS = [
    'QR forgotten',
    'QR unreadable',
    'Parent forgot phone',
    'Emergency pickup',
    'Special permission',
    'Other'
  ];

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAttendance();
    }, [selectedClass])
  );

  const fetchAttendance = async () => {
    try {
      const data = await api.getDailyAttendance(selectedClass.id);
      setAttendanceData(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
  };

  const openManualModal = (child, status) => {
    setManualModal({ visible: true, child, status });
    setManualReason('');
  };

  const handleManualMark = async () => {
    if (!manualReason) {
      Alert.alert('Reason Required', 'Please select or enter a reason for manual marking.');
      return;
    }

    try {
      setLoading(true);
      const { child, status } = manualModal;
      // 'PickUp' is mapped separately on the backend to update check_out_time
      // 'Present' = drop-off (check_in_time), 'Absent' = mark absent
      await api.manualMarkAttendance(child.childId, selectedClass.id, status, manualReason);
      setManualModal({ visible: false, child: null, status: null });
      setManualReason('');
      await fetchAttendance();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'DROPPED_OFF':
        return { label: 'Present', color: COLORS.success, bg: COLORS.successLight, icon: '🌅' };
      case 'COMPLETED':
        return { label: 'Picked Up', color: COLORS.primary, bg: '#eef2ff', icon: '✅' };
      case 'ABSENT':
        return { label: 'Absent', color: COLORS.danger, bg: COLORS.dangerLight, icon: '❌' };
      default:
        return { label: 'Not Marked', color: COLORS.textLight, bg: COLORS.surfaceAlt, icon: '⏳' };
    }
  };

  const filteredAttendance = attendanceData?.attendance?.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'NOT_MARKED') return item.attendanceStatus === 'NOT_MARKED';
    return item.attendanceStatus === filter;
  }) || [];

  const filters = [
    { key: 'ALL', label: 'All' },
    { key: 'NOT_MARKED', label: 'Pending' },
    { key: 'DROPPED_OFF', label: 'Present' },
    { key: 'COMPLETED', label: 'Done' },
  ];

  const renderChild = ({ item }) => {
    const status = getStatusConfig(item.attendanceStatus);

    return (
      <View style={styles.childCard}>
        <View style={{ flex: 1 }}>
          <View style={styles.childLeft}>
            <Text style={styles.childAvatar}>{item.gender === 'Female' ? '👧' : '👦'}</Text>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{item.name}</Text>
              <Text style={styles.childSub}>CH-{item.childId}</Text>
              <View style={styles.timeInfo}>
                {item.dropOffTime && <Text style={styles.timeText}>🌅 {formatTime(item.dropOffTime)}</Text>}
                {item.pickUpTime && <Text style={styles.timeText}>🌆 {formatTime(item.pickUpTime)}</Text>}
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={styles.statusIcon}>{status.icon}</Text>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            {item.attendanceStatus === 'NOT_MARKED' && (
               <>
                <TouchableOpacity 
                   style={[styles.smallActionBtn, { backgroundColor: COLORS.success }]}
                   onPress={() => openManualModal(item, 'Present')}
                >
                  <Text style={styles.actionBtnText}>Mark Present</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.smallActionBtn, { backgroundColor: COLORS.danger }]}
                  onPress={() => openManualModal(item, 'Absent')}
                >
                  <Text style={styles.actionBtnText}>Mark Absent</Text>
                </TouchableOpacity>
               </>
            )}

            {item.attendanceStatus === 'DROPPED_OFF' && (
              <>
                <TouchableOpacity 
                  style={[styles.smallActionBtn, { backgroundColor: COLORS.primary }]}
                  onPress={() => openManualModal(item, 'PickUp')}
                >
                  <Text style={styles.actionBtnText}>🌆 Mark Pick-up</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.smallActionBtn, { backgroundColor: COLORS.danger }]}
                  onPress={() => openManualModal(item, 'Absent')}
                >
                  <Text style={styles.actionBtnText}>Mark Absent</Text>
                </TouchableOpacity>
              </>
            )}

            {item.attendanceStatus === 'COMPLETED' && (
              <TouchableOpacity 
                style={[styles.smallActionBtn, { backgroundColor: COLORS.textLight }]}
                onPress={() => openManualModal(item, 'Present')}
              >
                <Text style={styles.actionBtnText}>Undo Pick-up (Undo)</Text>
              </TouchableOpacity>
            )}
            
            {item.attendanceStatus === 'ABSENT' && (
              <TouchableOpacity 
                style={[styles.smallActionBtn, { backgroundColor: COLORS.success }]}
                onPress={() => openManualModal(item, 'Present')}
              >
                <Text style={styles.actionBtnText}>Undo Absence</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const summary = attendanceData?.summary || {};

  return (
    <View style={styles.container}>


      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.text }]}>
          <Text style={styles.summaryNumber}>{summary.total || 0}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.success }]}>
          <Text style={[styles.summaryNumber, { color: COLORS.success }]}>{summary.present || 0}</Text>
          <Text style={styles.summaryLabel}>In</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.primary }]}>
          <Text style={[styles.summaryNumber, { color: COLORS.primary }]}>{summary.completed || 0}</Text>
          <Text style={styles.summaryLabel}>Out</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.danger }]}>
          <Text style={[styles.summaryNumber, { color: COLORS.danger }]}>{summary.absent || 0}</Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredAttendance}
        keyExtractor={(item) => item.childId.toString()}
        renderItem={renderChild}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No children found</Text>
          </View>
        }
      />

      {/* Manual Reason Modal */}
      <Modal visible={manualModal.visible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {manualModal.status === 'PickUp' ? '🌆 Manual Pick-up' :
               manualModal.status === 'Absent' ? '❌ Mark Absent' :
               manualModal.status === 'Present' ? '🌅 Manual Drop-off' : 'Manual Action'}
            </Text>
            <Text style={styles.modalSub}>Reason for manually marking {manualModal.child?.name}</Text>
            
            <ScrollView style={styles.reasonsList} contentContainerStyle={{ gap: 8 }}>
              {REASONS.map(reason => (
                <TouchableOpacity 
                   key={reason} 
                   style={[styles.reasonItem, manualReason === reason && styles.reasonItemActive]}
                   onPress={() => setManualReason(reason)}
                >
                  <Text style={[styles.reasonText, manualReason === reason && styles.reasonTextActive]}>{reason}</Text>
                </TouchableOpacity>
              ))}
              
              <TextInput
                style={styles.customReasonInput}
                placeholder="Or type custom reason..."
                value={manualReason && !REASONS.includes(manualReason) ? manualReason : ''}
                onChangeText={setManualReason}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setManualModal({ ...manualModal, visible: false })}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleManualMark}>
                <Text style={styles.modalSubmitText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0]);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${ampm}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    ...SHADOWS.small,
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.textWhite,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  childCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  childLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childAvatar: {
    fontSize: 32,
    marginRight: 14,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  timeInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  smallActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  childSub: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  reasonsList: {
    marginBottom: 20,
  },
  reasonItem: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reasonItemActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  reasonTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  customReasonInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  modalSubmit: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  modalSubmitText: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
});
