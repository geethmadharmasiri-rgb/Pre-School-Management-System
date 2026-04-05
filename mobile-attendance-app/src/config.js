const API_BASE_URL = 'http://10.141.166.23:5000'; // Change this to your computer's local IP


// To find your IP:
// Windows: ipconfig → look for IPv4 Address under Wi-Fi
// Mac: ifconfig → look for inet under en0
// Both phone and computer must be on same Wi-Fi network

export const API_URL = `${API_BASE_URL}/api/mobile`;

export const COLORS = {
  primary: '#6366f1',       // Indigo
  primaryDark: '#4f46e5',
  primaryLight: '#a5b4fc',
  secondary: '#10b981',     // Emerald
  secondaryDark: '#059669',
  accent: '#f59e0b',        // Amber
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  success: '#22c55e',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  background: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  
  text: '#0f172a',
  textSecondary: '#64748b',
  textLight: '#94a3b8',
  textWhite: '#ffffff',
  
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  
  dropOff: '#3b82f6',
  dropOffLight: '#dbeafe',
  pickUp: '#a855f7',
  pickUpLight: '#f3e8ff',
  
  gradient: {
    primary: ['#6366f1', '#8b5cf6'],
    success: ['#10b981', '#34d399'],
    danger: ['#ef4444', '#f87171'],
  }
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
