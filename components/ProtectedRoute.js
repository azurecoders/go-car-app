import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/auth/user/login");
    }
  }, [user]);

  if (isLoading) {
    return (
      <ActivityIndicator size={"large"} color={"#0000ff"}></ActivityIndicator>
    );
  }
  if (!user) return null;

  return children;
};

export default ProtectedRoute;
