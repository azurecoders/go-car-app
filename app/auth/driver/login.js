import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { loginDriver } from "../../(services)/api/api";
import { useDispatch, useSelector } from "react-redux";
import { loginDriverAction } from "../../(redux)/authSlice";
import socket from "../../../socket";

const DriverLoginScreen = () => {
  const mutation = useMutation({
    mutationKey: ["driver-login"],
    mutationFn: loginDriver,
  });

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user) {
      router.push("/(tabs)");
    }
  }, [user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    mutation
      .mutateAsync({
        email,
        password,
      })
      .then((data) => {
        setIsLoading(false);
        dispatch(loginDriverAction(data.user));
        if (data.success === false) {
          Alert.alert("Error", data.message, [{ text: "OK" }]);
          return;
        }
        socket.connect();
        socket.emit("driver-join", { driverId: data.user.id });
        Alert.alert("Success", data.message, [
          { text: "OK", onPress: () => router.push("/(tabs)") },
        ]);
      })
      .catch((e) => console.log(e));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.appName}>GoCar Driver</Text>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to start earning with us
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor="#999999"
                value={email}
                defaultValue="xyz@gmail.com"
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#999999"
                  value={password}
                  defaultValue="12345678"
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Text style={styles.eyeButtonText}>
                    {isPasswordVisible ? "👁️" : "👁️‍🗨️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/driver/register")}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default DriverLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  appName: {
    fontSize: 42,
    fontWeight: "700",
    color: "#0084ff",
    marginBottom: 16,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333333",
    marginBottom: 8,
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#333333",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  passwordInput: {
    flex: 1,
    color: "#333333",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  eyeButtonText: {
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: "#0084ff",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#0084ff",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: "#666666",
    fontSize: 16,
  },
  signupLink: {
    color: "#0084ff",
    fontSize: 16,
    fontWeight: "600",
  },
});
