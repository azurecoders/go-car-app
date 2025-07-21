import { Stack } from "expo-router";
import "../../styles/globals.css";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { loadUser } from "./authSlice";
import { loadRide } from "./rideSlice";

const AppWrapper = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadUser());
    dispatch(loadRide());
  }, []);
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth/user/login" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth/user/register"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="auth/driver/login" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth/driver/register"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="fare-request" options={{ headerShown: false }} />
      <Stack.Screen
        name="student-verification"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="track-ride-screen" options={{ headerShown: false }} />
    </Stack>
  );
};

export default AppWrapper;
