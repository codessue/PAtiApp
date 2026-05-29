import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { registerPushToken } from '../utils/notifications';
import { colors } from '../constants/colors';
import { LoginScreen } from './auth/login';
import { RegisterScreen } from './auth/register';
import { HomeScreen } from './tabs/index';
import { CatsScreen } from './tabs/cats';
import { HealthScreen } from './tabs/health';
import { ProfileScreen } from './tabs/profile';
import { CatDetailScreen } from '../screens/cats/CatDetailScreen';
import { AddCatScreen } from '../screens/cats/AddCatScreen';
import { EditCatScreen } from '../screens/cats/EditCatScreen';
import { VaccineListScreen } from '../screens/vaccines/VaccineListScreen';
import { AddVaccineScreen } from '../screens/vaccines/AddVaccineScreen';
import { WeightChartScreen } from '../screens/weight/WeightChartScreen';
import { AddWeightScreen } from '../screens/weight/AddWeightScreen';
import { MedicationListScreen } from '../screens/medications/MedicationListScreen';
import { AddMedicationScreen } from '../screens/medications/AddMedicationScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CatDetail: { catId: string };
  AddCat: undefined;
  EditCat: { catId: string };
  VaccineList: { catId: string; catName: string };
  AddVaccine: { catId: string };
  WeightChart: { catId: string; catName: string };
  AddWeight: { catId: string };
  MedicationList: { catId: string; catName: string };
  AddMedication: { catId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Home: undefined;
  Cats: undefined;
  Health: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠', Cats: '🐱', Health: '❤️', Profile: '👤',
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Ana Sayfa', Cats: 'Kediler', Health: 'Sağlık', Profile: 'Profil',
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: 8,
        paddingTop: 4,
        height: 64,
      },
      tabBarLabel: TAB_LABELS[route.name] ?? route.name,
      tabBarIcon: ({ focused }) => (
        <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
          {TAB_ICONS[route.name]}
        </Text>
      ),
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Cats" component={CatsScreen} />
    <Tab.Screen name="Health" component={HealthScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login">
      {(props) => (
        <LoginScreen
          onNavigateToRegister={() => props.navigation.navigate('Register')}
        />
      )}
    </AuthStack.Screen>
    <AuthStack.Screen name="Register">
      {(props) => (
        <RegisterScreen
          onNavigateToLogin={() => props.navigation.goBack()}
        />
      )}
    </AuthStack.Screen>
  </AuthStack.Navigator>
);

export const Navigation = () => {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => {
    if (isAuthenticated) registerPushToken();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 48 }}>🐾</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 18 },
          headerShadowVisible: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="CatDetail" component={CatDetailScreen} options={{ title: 'Kedi Detayı' }} />
            <Stack.Screen name="AddCat" component={AddCatScreen} options={{ title: 'Kedi Ekle' }} />
            <Stack.Screen name="EditCat" component={EditCatScreen} options={{ title: 'Kedi Düzenle' }} />
            <Stack.Screen name="VaccineList" component={VaccineListScreen} options={({ route }) => ({ title: `${(route.params as { catName: string }).catName} · Aşılar` })} />
            <Stack.Screen name="AddVaccine" component={AddVaccineScreen} options={{ title: 'Aşı Ekle' }} />
            <Stack.Screen name="WeightChart" component={WeightChartScreen} options={({ route }) => ({ title: `${(route.params as { catName: string }).catName} · Kilo` })} />
            <Stack.Screen name="AddWeight" component={AddWeightScreen} options={{ title: 'Kilo Ekle' }} />
            <Stack.Screen name="MedicationList" component={MedicationListScreen} options={({ route }) => ({ title: `${(route.params as { catName: string }).catName} · İlaçlar` })} />
            <Stack.Screen name="AddMedication" component={AddMedicationScreen} options={{ title: 'İlaç Ekle' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
