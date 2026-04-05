import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const AUTH_TOKEN_KEY = 'attendance_auth_token';
const USER_DATA_KEY = 'attendance_user_data';

// In-memory fallback if AsyncStorage native module is missing
const memoryStorage = new Map();

class ApiService {
  constructor() {
    this.token = null;
    this.user = null;
  }

  async init() {
    try {
      const token = await this._safeGetItem(AUTH_TOKEN_KEY);
      const userData = await this._safeGetItem(USER_DATA_KEY);
      if (token) this.token = token;
      if (userData) this.user = JSON.parse(userData);
    } catch (e) {
      console.warn('Failed to load auth data from storage:', e.message);
    }
  }

  // Helper for safe storage access
  async _safeGetItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return memoryStorage.get(key) || null;
    }
  }

  async _safeSetItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      memoryStorage.set(key, value);
    }
  }

  async _safeRemoveItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      memoryStorage.delete(key);
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(method, endpoint, body = null) {
    const url = `${API_URL}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders(),
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  // ========== AUTH ==========
  async login(email, password) {
    const data = await this.request('POST', '/auth/login', { email, password });
    this.token = data.token;
    this.user = data.user;
    
    await this._safeSetItem(AUTH_TOKEN_KEY, data.token);
    await this._safeSetItem(USER_DATA_KEY, JSON.stringify(data.user));
    
    return data;
  }

  async logout() {
    this.token = null;
    this.user = null;
    await this._safeRemoveItem(AUTH_TOKEN_KEY);
    await this._safeRemoveItem(USER_DATA_KEY);
  }

  isLoggedIn() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  // ========== CLASSES ==========
  async getTeacherClasses(yearId) {
    const query = yearId ? `?yearId=${yearId}` : '';
    return this.request('GET', `/teacher/classes${query}`);
  }

  // ========== CHILDREN ==========
  async getClassChildren(classId) {
    return this.request('GET', `/class/${classId}/children`);
  }

  // ========== ATTENDANCE ==========
  async scanAttendance(qrData, classId, scanType, notes = null) {
    if (!scanType) throw new Error('scanType is required (DROP_OFF or PICK_UP)');
    return this.request('POST', '/attendance/scan', {
      qrData,
      classId,
      scanType,   // 'DROP_OFF' or 'PICK_UP' — explicitly chosen by teacher
      notes,
    });
  }

  async getDailyAttendance(classId, date = null) {
    const query = date ? `?date=${date}` : '';
    return this.request('GET', `/attendance/daily/${classId}${query}`);
  }

  async getScanHistory(classId = null, limit = 50) {
    let query = `?limit=${limit}`;
    if (classId) query += `&classId=${classId}`;
    return this.request('GET', `/attendance/history${query}`);
  }

  async manualMarkAttendance(childId, classId, status, remarks = null) {
    return this.request('POST', '/attendance/manual-mark', {
      childId,
      classId,
      status,
      remarks,
    });
  }

  async syncOfflineScans(scans) {
    return this.request('POST', '/attendance/sync', { scans });
  }
}

export default new ApiService();
