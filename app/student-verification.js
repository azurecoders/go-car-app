import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";

export default function StudentVerification() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const [pdfLink, setPdfLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!pdfLink.trim()) {
      Alert.alert("Error", "Please provide a PDF link");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiResponse = await fetch(
        "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id, docsUrl: pdfLink }),
        }
      );

      const response = await apiResponse.json();

      if (response.success) {
        setIsSubmitting(false);
        Alert.alert("Success", "Verification submitted successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        router.back();
      }
      Alert.alert("Error", response.message, [
        { text: "OK", onPress: () => {} },
      ]);
    } catch (error) {
      console.log(error);
      setIsSubmitting(false);
      Alert.alert("Error", "Failed to submit verification. Please try again.");
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🎓</Text>
        </View>
        <Text style={styles.title}>Student Verification</Text>
        <Text style={styles.subtitle}>
          Verify your student status to unlock exclusive benefits
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upload Student ID Card</Text>

        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>📋 Instructions</Text>
          <Text style={styles.instructionText}>
            Please upload a PDF containing both the front and back sides of your
            student ID card. Make sure both sides are clearly visible and all
            information is readable.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>PDF Document Link</Text>
          <TextInput
            style={styles.input}
            value={pdfLink}
            onChangeText={setPdfLink}
            placeholder="Enter PDF link (e.g., https://drive.google.com/...)"
            placeholderTextColor="#94a3b8"
            multiline={false}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.inputHelper}>
            Upload your PDF to Google Drive, Dropbox, or similar service and
            paste the shareable link here
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleGoBack}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>🌟 Student Benefits</Text>
        <Text style={styles.benefitsText}>
          • Exclusive discounts on rides{"\n"}• Special rates on vehicle rentals
          {"\n"}• Priority customer support{"\n"}• Access to student-only
          promotions
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0084ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
    shadowColor: "#0084ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0084ff",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  instructionContainer: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#0084ff",
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
    backgroundColor: "#fff",
    minHeight: 50,
  },
  inputHelper: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 6,
    lineHeight: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: "#0084ff",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#0084ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
  benefitsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#22c55e",
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#22c55e",
    marginBottom: 12,
  },
  benefitsText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 22,
  },
});
