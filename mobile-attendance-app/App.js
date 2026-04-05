import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { COLORS } from './src/config';
import api from './src/services/api';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ClassSelectionScreen from './src/screens/ClassSelectionScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import DailyAttendanceScreen from './src/screens/DailyAttendanceScreen';
import ScanHistoryScreen from './src/screens/ScanHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigation (after class selection)
function MainTabs({ navigation, route }) {
  const { selectedClass } = route.params;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: { height: 75, paddingBottom: 12, paddingTop: 10, borderTopColor: COLORS.border, elevation: 8 },
        headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '800', color: COLORS.text, fontSize: 18 },
        headerLeft: () => (
          <TouchableOpacity 
            style={{ marginLeft: 16 }} 
            onPress={() => navigation.navigate('ClassSelection')}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>← Switch Class</Text>
          </TouchableOpacity>
        )
      }}
    >
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        initialParams={{ selectedClass }}
        options={{
          headerTitle: `Scan: ${selectedClass.name}`,
          tabBarLabel: 'Scanner',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📸</Text>,
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={DailyAttendanceScreen}
        initialParams={{ selectedClass }}
        options={{
          headerTitle: `${selectedClass.name} - Status`,
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="History"
        component={ScanHistoryScreen}
        initialParams={{ selectedClass }}
        options={{
          headerTitle: 'Recent Scans',
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📜</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await api.init();
      setIsLoggedIn(api.isLoggedIn());
    } finally {
      setInitializing(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLoginSuccess={() => setIsLoggedIn(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="ClassSelection">
              {(props) => <ClassSelectionScreen {...props} onLogout={() => setIsLoggedIn(false)} />}
            </Stack.Screen>
            <Stack.Screen name="MainTabs" component={MainTabs} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});
