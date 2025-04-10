import React, { useEffect, useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Linking from "expo-linking";
import 'react-native-get-random-values';

import { CartProvider } from "./context/CartContext";  
// Prevent splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    NunitoSans: require("../assets/fonts/NunitoSans-VariableFont_YTLC,opsz,wdth,wght.ttf"),
    NunitoSansBold: require("../assets/fonts/NunitoSans_7pt-Bold.ttf"),
    MerriweatherBold: require("../assets/fonts/Merriweather-Bold.ttf"),
    InterMedium: require("../assets/fonts/Inter_18pt-Medium.ttf"),
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check if user is authenticated
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      setIsAuthenticated(!!token); // Convert token presence to boolean
      await SplashScreen.hideAsync(); // Hide splash screen after auth check
    };
    checkAuth();

    const handleDeepLink = (event: { url: string }) => {

      try {
        // Parse deep link URL
        const { path, queryParams } = Linking.parse(event.url);

        // Ensure email & token exist before navigating
        if (
          path === "ResetPasswordScreen" &&
          queryParams &&
          typeof queryParams.email === "string" &&
          typeof queryParams.token === "string"
        ) {
          router.push({
            pathname: "/ResetPasswordScreen",
            params: { email: queryParams.email, token: queryParams.token },
          });
        } else {
        }
      } catch (error) {
      }
    };
  
    const subscription = Linking.addEventListener("url", handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });
  }, [router]);


  // Prevent UI from rendering until fonts & auth check are complete
  if (!loaded || isAuthenticated === null) {
    return null;
  }

  return (
      <CartProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen 
             name={isAuthenticated ? "(tabs)" : "index"}
               
        />
           <Stack.Screen name="ResetPasswordScreen" />
      </Stack>
         <Toast />
         <Toast />
      <StatusBar style="auto" />
        </ThemeProvider>
      </CartProvider>
  );
}
