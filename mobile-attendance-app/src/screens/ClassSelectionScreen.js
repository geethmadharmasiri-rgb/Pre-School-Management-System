import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { COLORS, SHADOWS } from '../config';
import api from '../services/api';
import offlineStorage from '../services/offlineStorage';

export default function ClassSelectionScreen({ navigation, onLogout }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const user = api.getUser();

  useEffect(() => {
    fetchClasses();
    checkOfflineQueue();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.getTeacherClasses();
      setClasses(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkOfflineQueue = async () => {
    const count = await offlineStorage.getPendingCount();
    setPendingSync(count);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
    checkOfflineQueue();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const unsynced = await offlineStorage.getUnsyncedQueue();
      if (unsynced.length === 0) return;
      
      const res = await api.syncOfflineScans(unsynced);
      Alert.alert('Sync Complete', res.message);
      
      // Mark all as synced (simplification for this example)
      const indices = unsynced.map((_, i) => i);
      await offlineStorage.markSynced(indices);
      await offlineStorage.clearSynced(); // Clean up
      
      setPendingSync(0);
      fetchClasses();
    } catch (err) {
      Alert.alert('Sync Error', err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await api.logout();
          if (onLogout) onLogout();
        },
      },
    ]);
  };

  const renderClassCard = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={styles.classCard}
        onPress={() => navigation.navigate('MainTabs', { selectedClass: item })}
        activeOpacity={0.7}
      >
        <View style={styles.classIconWrap}>
          <Text style={styles.classIcon}>🏫</Text>
        </View>
        <View style={styles.classInfo}>
          <Text style={styles.className}>{item.name}</Text>
          <Text style={styles.classDetails}>
            {item.student_count} children • {item.year_name || 'Academic Year'}
          </Text>
        </View>
        <View style={styles.classArrow}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.name}>{user?.name || 'Teacher'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Sync Banner */}
      {pendingSync > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>📡 {pendingSync} scans pending sync</Text>
          <TouchableOpacity 
            style={[styles.syncBtn, syncing && { opacity: 0.5 }]} 
            onPress={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.syncBtnText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.label}>SELECT YOUR CLASS</Text>

      {classes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No classes found</Text>
          <Text style={styles.emptyText}>Ask your administrator to assign you a class.</Text>
        </View>
      ) : (
        <FlatList
          data={classes}
          renderItem={renderClassCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: COLORS.dangerLight },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 12 },
  syncBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    padding: 12,
    margin: 16,
    borderRadius: 12,
  },
  syncText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  syncBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  syncBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, paddingHorizontal: 24, marginTop: 24, letterSpacing: 1 },
  list: { paddingHorizontal: 24, paddingTop: 16 },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  classIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  classIcon: { fontSize: 20 },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  classDetails: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  classArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 14, fontWeight: '900', color: COLORS.primary },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
