import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useSelector } from "react-redux";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const user = useSelector((state) => state.auth.user);

  // Log user role for debugging
  console.log("User role:", user?.role);

  // Show loading state if user is not loaded
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ProtectedRoute>
      <Tabs
        key={user.role} // Force re-render on role change
        screenOptions={{
          tabBarStyle: {
            display: user ? "flex" : "none", // Hide tab bar if user is not loaded
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: "Ride",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="map-marker" size={28} color={color} />
            ),
            href: user.role === "user" ? "/index" : null,
          }}
        />

        {/* Driver Role: Show Driver Tab */}

        <Tabs.Screen
          name="driver"
          options={{
            headerShown: false,
            title: "Driver",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="car" size={28} color={color} />
            ),
            tabBarStyle: user.role === "driver" ? {} : { display: "none" },
            href: !(user.role === "driver") ? null : "/driver",
          }}
        />

        {/* Rent Tab */}
        <Tabs.Screen
          name="rent"
          options={{
            headerShown: false,
            title: "Rent",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="motorcycle" size={28} color={color} />
            ),
            href: user.role === "user" ? "/rent" : null,
          }}
        />

        {/* Ads Tab */}
        <Tabs.Screen
          name="ads"
          options={{
            headerShown: false,
            title: "Ads",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="bullhorn" size={28} color={color} />
            ),
            href: user.role === "user" ? "/ads" : null,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="user" size={28} color={color} />
            ),
            href:
              user.role === "user" || user.role === "driver"
                ? "/profile"
                : null,
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
