import {
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
  ScrollView,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const HomeScreen = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Logo Container */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/welcome-screen-logo.png")}
              style={styles.logo}
            />
          </View>

          <Text style={styles.appName}>GoCar</Text>
          <Text style={styles.tagline}>Your Journey, Our Priority</Text>
        </View>

        {/* Call to Action Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/auth/user/login")}
          >
            <Text style={styles.primaryButtonText}>Continue as User</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/auth/driver/login")}
          >
            <Text style={styles.secondaryButtonText}>Continue as Driver</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Join thousands of satisfied customers
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 80,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  appName: {
    fontSize: 48,
    fontWeight: "700",
    color: "#0084ff",
    marginBottom: 8,
    textAlign: "center",
  },
  tagline: {
    fontSize: 18,
    color: "#666666",
    textAlign: "center",
    fontWeight: "400",
  },
  ctaSection: {
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#0084ff",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
    width: "100%",
    shadowColor: "#0084ff",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#0084ff",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 32,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#0084ff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  footerText: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
  },
});
