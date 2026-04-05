import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../config';
import api from '../services/api';

export default function ScanHistoryScreen({ route }) {
  const { selectedClass } = route.params;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [selectedClass])
  );

  const fetchHistory = async () => {
    try {
      const data = await api.getScanHistory(selectedClass?.id, 100);
      setHistory(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderHistoryItem = ({ item }) => {
    const isDropOff = item.scanType === 'DROP_OFF';
    const isAbsent = item.scanType === 'ABSENT';

    // MySQL may return a Date object or a 'YYYY-MM-DD' string — handle both
    const rawDate = item.scanDate;
    let dateObj;
    if (rawDate instanceof Date) {
      dateObj = rawDate;
    } else if (typeof rawDate === 'string') {
      // Parse as local date (avoid UTC offset shifting the date by 1 day)
      const [y, m, d] = rawDate.split('-').map(Number);
      dateObj = new Date(y, m - 1, d);
    } else {
      dateObj = new Date();
    }

    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const dotColor = isAbsent ? COLORS.danger : isDropOff ? COLORS.dropOff : COLORS.pickUp;
    const badgeBg = isAbsent ? COLORS.dangerLight : isDropOff ? COLORS.dropOffLight : COLORS.pickUpLight;
    const badgeColor = isAbsent ? COLORS.danger : isDropOff ? COLORS.dropOff : COLORS.pickUp;
    const badgeLabel = isAbsent ? '❌ Absent' : isDropOff ? '🌅 Drop-off' : '🌆 Pick-up';

    return (
      <View style={styles.historyCard}>
        <View style={[styles.typeDot, { backgroundColor: dotColor }]} />
        <View style={styles.historyContent}>
          <View style={styles.historyTop}>
            <Text style={styles.childName}>{item.childName}</Text>
            <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.typeText, { color: badgeColor }]}>{badgeLabel}</Text>
            </View>
          </View>
          <View style={styles.historyBottom}>
            <Text style={styles.historyMeta}>
              {item.className} • {dateStr}
              {item.scanTime ? ` • ${formatTime(item.scanTime)}` : ''}
              {item.method && item.method !== 'QR' ? ` • ${item.method}` : ''}
            </Text>
            {item.status !== 'SUCCESS' && (
              <Text style={[styles.statusTag, { color: COLORS.danger }]}>
                {item.status}
              </Text>
            )}
          </View>
          {item.remarks && (
            <Text style={styles.remarksText}>{item.remarks}</Text>
          )}
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

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Recent Scans</Text>
            <Text style={styles.headerCount}>{history.length} records</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyTitle}>No Scan History</Text>
            <Text style={styles.emptyText}>
              Scans will appear here once you start scanning QR codes.
            </Text>
          </View>
        }
      />
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...SHADOWS.small,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  childName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  statusTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  remarksText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 48,
    lineHeight: 22,
  },
});
