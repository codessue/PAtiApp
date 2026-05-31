import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HeartPulse, Home as HomeIcon, LucideIcon, PawPrint, User } from 'lucide-react-native';
import { useAuthStore } from '../stores/authStore';
import { registerPushToken } from '../utils/notifications';
import { colors } from '../constants/colors';
import { fonts } from '../constants/typography';
import { Splash } from '../components/ui/Splash';
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

// BottomNav styling per UI_REDESIGN_1.md §3.
// Maps tab routes → lucide icon + Turkish label.
const TAB_META: Record<keyof TabParamList, { icon: LucideIcon; label: string }> = {
  Home:    { icon: HomeIcon,    label: 'Ana Sayfa' },
  Cats:    { icon: PawPrint,    label: 'Kediler' },
  Health:  { icon: HeartPulse,  label: 'Sağlık' },
  Profile: { icon: User,        label: 'Profil' },
};

const TabBarIcon = ({ name, focused }: { name: keyof TabParamList; focused: boolean }) => {
  const Icon = TAB_META[name].icon;
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Icon
        size={22}
        color={focused ? colors.primary : colors.mutedForeground}
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.mutedForeground,
      tabBarStyle: tabStyles.bar,
      tabBarItemStyle: tabStyles.item,
      tabBarLabelStyle: tabStyles.label,
      tabBarLabel: TAB_META[route.name as keyof TabParamList].label,
      tabBarIcon: ({ focused }) => (
        <TabBarIcon name={route.name as keyof TabParamList} focused={focused} />
      ),
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Cats" component={CatsScreen} />
    <Tab.Screen name="Health" component={HealthScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 88, // includes safe-area space on most devices
    paddingTop: 8,
    paddingBottom: 24,
    // flatten any default platform shadow so the border alone separates the bar
    elevation: 0,
    shadowOpacity: 0,
  },
  item: { paddingVertical: 4 },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    marginTop: 2,
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(196,98,45,0.2)',
  },
});

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
    return <Splash />;
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
