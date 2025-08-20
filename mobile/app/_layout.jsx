import {
  Stack,
  useRouter,
  useSegments,
  useRootNavigationState,
  SplashScreen,
} from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";
import { useFonts } from "expo-font";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { checkAuth, user, token, isLoading } = useAuthStore();

  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Wait until navigation is ready and auth check finished
    if (!navigationState?.key || isLoading) return;

    const inAuthScreen = segments[0] === "(auth)";
    const isSignedIn = user && token;

    if (!isSignedIn && !inAuthScreen) router.replace("/(auth)");
    else if (isSignedIn && inAuthScreen) router.replace("/(tabs)");
  }, [navigationState?.key, isLoading, user, token, segments]);

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

// import {
//   Stack,
//   useRouter,
//   useSegments,
//   useRootNavigationState,
//   SplashScreen,
// } from "expo-router";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import SafeScreen from "../components/SafeScreen";
// import { StatusBar } from "expo-status-bar";
// import { useAuthStore } from "../store/authStore";
// import { useEffect } from "react";
// import { useFonts } from "expo-font";

// // 👇 Prevent splash screen from auto hiding
// //    (we'll hide it manually only after fonts are loaded)
// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   const router = useRouter();
//   const segments = useSegments();
//   const navigationState = useRootNavigationState();
//   const { checkAuth, user, token, isLoading } = useAuthStore();

//   // 👇 Load custom font(s) using expo-font
//   const [fontsLoaded] = useFonts({
//     "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
//   });

//   // 👇 Hide splash screen once fonts are loaded
//   useEffect(() => {
//     if (fontsLoaded) SplashScreen.hideAsync();
//   }, [fontsLoaded]);

//   // 👇 On app mount, check if user is authenticated
//   useEffect(() => {
//     checkAuth();
//   }, []);

//   // 👇 Control navigation based on auth state
//   useEffect(() => {
//     // Wait until navigation is ready and auth check finished
//     if (!navigationState?.key || isLoading) return;

//     const inAuthScreen = segments[0] === "(auth)";
//     const isSignedIn = user && token;

//     // If NOT signed in → send to (auth) stack
//     if (!isSignedIn && !inAuthScreen) router.replace("/(auth)");
//     // If signed in but inside (auth) → redirect to (tabs)
//     else if (isSignedIn && inAuthScreen) router.replace("/(tabs)");
//   }, [navigationState?.key, isLoading, user, token, segments]);

//   if (!fontsLoaded) {
//     return null; // or you can return a custom <Loading /> component
//   }
//   return (
//     <SafeAreaProvider>
//       <SafeScreen>
//         {/* 👇 Global stack navigator */}
//         <Stack screenOptions={{ headerShown: false }}>
//           <Stack.Screen name="(tabs)" />
//           <Stack.Screen name="(auth)" />
//         </Stack>
//       </SafeScreen>

//       {/* 👇 Status bar style */}
//       <StatusBar style="dark" />
//     </SafeAreaProvider>
//   );
// }
