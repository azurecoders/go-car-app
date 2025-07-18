import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useSelector } from "react-redux";

export default function RootLayout() {
  const user = useSelector((state) => state.auth.user);
  return (
    <ProtectedRoute>
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: "Home",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="home" size={28} color={color} />
            ),
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
          }}
        />
        <Tabs.Screen
          name="user"
          options={{
            headerShown: false,
            title: "User",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="user" size={28} color={color} />
            ),
            tabBarButton: user?.role === "user" ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="driver"
          options={{
            headerShown: false,
            title: "Driver",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="car" size={28} color={color} />
            ),
            tabBarButton: user?.role === "driver" ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="rent"
          options={{
            headerShown: false,
            title: "Rent",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="motorcycle" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ads"
          options={{
            headerShown: false,
            title: "Ads",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="adn" size={28} color={color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
