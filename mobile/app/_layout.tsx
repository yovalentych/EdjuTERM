import { useEffect, type ReactNode } from "react";
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { 
  useFonts, 
  Unbounded_700Bold, 
  Unbounded_900Black 
} from "@expo-google-fonts/unbounded";
import { 
  Geologica_400Regular, 
  Geologica_600SemiBold,
  Geologica_800ExtraBold 
} from "@expo-google-fonts/geologica";
import { MobileStoreProvider, useMobileStore } from "@/lib/mobile-store";
import { registerForPushNotificationsAsync } from "@/lib/notifications";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Unbounded-Bold": Unbounded_700Bold,
    "Unbounded-Black": Unbounded_900Black,
    "Geologica-Regular": Geologica_400Regular,
    "Geologica-SemiBold": Geologica_600SemiBold,
    "Geologica-ExtraBold": Geologica_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <MobileStoreProvider>
        <AuthNavigationGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ gestureEnabled: false }} />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="item/[id]" options={{ gestureEnabled: true }} />
          </Stack>
        </AuthNavigationGate>
      </MobileStoreProvider>
    </SafeAreaProvider>
  );
}

function AuthNavigationGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { user, hydrated } = useMobileStore();

  useEffect(() => {
    if (!hydrated || !navigationState?.key) return;

    const rootSegment = segments[0];
    const isPublicRoute = !rootSegment
      || rootSegment === "index"
      || rootSegment === "login"
      || rootSegment === "register"
      || rootSegment === "forgot-password";

    if (user && isPublicRoute) {
      router.replace("/space");
      return;
    }

    if (!user && !isPublicRoute) {
      router.replace("/login");
    }
  }, [hydrated, navigationState?.key, router, segments, user]);

  return children;
}
