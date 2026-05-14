import { useEffect } from "react";
import { Stack } from "expo-router";
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
import { MobileStoreProvider } from "@/lib/mobile-store";

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

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <MobileStoreProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </MobileStoreProvider>
    </SafeAreaProvider>
  );
}
