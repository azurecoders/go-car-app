import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { registerDriver } from "../../(services)/api/api";
import { useDispatch, useSelector } from "react-redux";
import { registerDriverAction } from "../../(redux)/authSlice";
import socket from "../../../socket";

const SignupScreen = () => {
  const mutation = useMutation({
    mutationKey: ["driver-register"],
    mutationFn: registerDriver,
  });

  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    vehicleType: "",
    licensePlate: "",
    docsURL: "",
    gender: "male",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user) {
      router.push("/(tabs)/profile");
    }
  }, [user]);

  const handleSignup = async () => {
    // Validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.vehicleType ||
      !formData.licensePlate
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (formData.phone.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    if (!isValidEmail(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    mutation
      .mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        vehicleInfo: {
          vehicleType: formData.vehicleType,
          licensePlate: formData.licensePlate,
          docsURL: formData.docsURL,
        },
        gender: formData.gender,
      })
      .then((data) => {
        setIsLoading(false);
        dispatch(registerDriverAction(data.user));
        if (data.success === false) {
          Alert.alert("Error", data.message, [{ text: "OK" }]);
          return;
        }
        socket.connect();
        socket.emit("driver-join", { driverId: data.user.id });
        Alert.alert("Success", data.message, [
          { text: "OK", onPress: () => router.push("/(tabs)/profile") },
        ]);
      })
      .catch((e) => console.log(e));
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const vehicleTypes = [
    { label: "Car", value: "car" },
    { label: "Bike", value: "bike" },
  ];

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
            <Text style={styles.welcomeText}>Join Our Team</Text>
            <Text style={styles.subtitle}>
              Register as a driver and start earning with us
            </Text>
          </View>

          {/* Signup Form */}
          <View style={styles.formContainer}>
            {/* Name Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                placeholderTextColor="#999999"
                value={formData.name}
                onChangeText={(text) => updateFormData("name", text)}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor="#999999"
                value={formData.email}
                onChangeText={(text) =>
                  updateFormData("email", text.toLowerCase())
                }
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.phoneWrapper}>
                <Text style={styles.countryCode}>+92</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="(555) 123-4567"
                  placeholderTextColor="#999999"
                  value={formData.phone}
                  onChangeText={(text) => updateFormData("phone", text)}
                  keyboardType="phone-pad"
                  maxLength={14}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#999999"
                  value={formData.password}
                  onChangeText={(text) => updateFormData("password", text)}
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

            {/* Gender Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === "male" && styles.genderButtonSelected,
                  ]}
                  onPress={() => updateFormData("gender", "male")}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      formData.gender === "male" &&
                        styles.genderButtonTextSelected,
                    ]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === "female" && styles.genderButtonSelected,
                  ]}
                  onPress={() => updateFormData("gender", "female")}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      formData.gender === "female" &&
                        styles.genderButtonTextSelected,
                    ]}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Vehicle Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Vehicle Type</Text>
              <View style={styles.vehicleTypeContainer}>
                {vehicleTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.vehicleTypeButton,
                      formData.vehicleType === type.value &&
                        styles.vehicleTypeButtonSelected,
                    ]}
                    onPress={() => updateFormData("vehicleType", type.value)}
                  >
                    <Text
                      style={[
                        styles.vehicleTypeButtonText,
                        formData.vehicleType === type.value &&
                          styles.vehicleTypeButtonTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* License Plate */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>License Plate</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ABC-1234"
                placeholderTextColor="#999999"
                value={formData.licensePlate}
                onChangeText={(text) =>
                  updateFormData("licensePlate", text.toUpperCase())
                }
                autoCapitalize="characters"
              />
            </View>

            {/* Documents URL */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Documents URL (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://drive.google.com/..."
                placeholderTextColor="#999999"
                value={formData.docsURL}
                onChangeText={(text) => updateFormData("docsURL", text)}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                styles.signupButton,
                isLoading && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? "Creating Account..." : "Create Driver Account"}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/driver/login")}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignupScreen;

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
  phoneWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  countryCode: {
    color: "#333333",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  phoneInput: {
    flex: 1,
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
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderButton: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 16,
    marginHorizontal: 4,
  },
  genderButtonSelected: {
    backgroundColor: "#0084ff",
    borderColor: "#0084ff",
  },
  genderButtonText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  genderButtonTextSelected: {
    color: "#FFFFFF",
  },
  vehicleTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  vehicleTypeButton: {
    width: "48%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 16,
    marginBottom: 12,
  },
  vehicleTypeButtonSelected: {
    backgroundColor: "#0084ff",
    borderColor: "#0084ff",
  },
  vehicleTypeButtonText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  vehicleTypeButtonTextSelected: {
    color: "#FFFFFF",
  },
  signupButton: {
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
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#666666",
    fontSize: 16,
  },
  loginLink: {
    color: "#0084ff",
    fontSize: 16,
    fontWeight: "600",
  },
});
