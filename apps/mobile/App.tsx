import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from '@expo-google-fonts/open-sans';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { VerifyAccountScreen } from './src/screens/VerifyAccountScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ClientScreen } from './src/screens/ClientScreen';
import { VisitScreen } from './src/screens/VisitScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { VoiceScreen } from './src/screens/VoiceScreen';
import { ReferralGuardrailScreen } from './src/screens/ReferralGuardrailScreen';
import { ReferralsListScreen } from './src/screens/ReferralsListScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TallyScreen } from './src/screens/TallyScreen';
import { SupervisorScreen } from './src/screens/SupervisorScreen';
import { ImmunizationScreen } from './src/screens/ImmunizationScreen';
import { SyncScreen } from './src/screens/SyncScreen';

export type RootStackParamList = {
  Splash: undefined;
  // Auth
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyAccount: { mode: 'registration' | 'password-reset'; phone: string };
  ResetPassword: { phone: string; code: string };
  // App
  Home: undefined;
  Register: undefined;
  Client: { clientId: string };
  Visit: { clientId: string };
  Plan: { clientId: string };
  Voice: { clientId: string };
  ReferralGuardrail: { clientId: string };
  ReferralsList: undefined;
  Notifications: undefined;
  Settings: undefined;
  Tally: undefined;
  Supervisor: undefined;
  Immunization: { clientId: string };
  Sync: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
  });

  // Hold the native splash screen until fonts are ready.
  // On a real device this is imperceptible (<200 ms).
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          {/* Auth flow */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyAccount" component={VerifyAccountScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          {/* App */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Client" component={ClientScreen} />
          <Stack.Screen name="Visit" component={VisitScreen} />
          <Stack.Screen name="Plan" component={PlanScreen} />
          <Stack.Screen name="Voice" component={VoiceScreen} />
          <Stack.Screen name="ReferralGuardrail" component={ReferralGuardrailScreen} />
          <Stack.Screen name="ReferralsList" component={ReferralsListScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Tally" component={TallyScreen} />
          <Stack.Screen name="Supervisor" component={SupervisorScreen} />
          <Stack.Screen name="Immunization" component={ImmunizationScreen} />
          <Stack.Screen name="Sync" component={SyncScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
