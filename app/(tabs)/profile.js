import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { logoutAction } from "../(redux)/authSlice";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const handleLogout = () => {
    const redirectPath =
      user?.role === "user" ? "/auth/user/login" : "/auth/driver/login";

    dispatch(logoutAction());
    router.push(redirectPath);
  };

  const handleStudentRegistration = () => {
    // Navigate to student registration page
    router.push("/auth/user/student-registration");
  };

  const ProfileCard = ({ children, title }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  const ProfileField = ({ label, value, isHighlighted = false }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text
        style={[styles.fieldValue, isHighlighted && styles.highlightedValue]}
      >
        {value}
      </Text>
    </View>
  );

  const renderDriverProfile = () => (
    <>
      <ProfileCard title="Personal Information">
        <ProfileField label="Driver ID" value={user.id} />
        <ProfileField label="Full Name" value={user.name} />
        <ProfileField label="Email Address" value={user.email} />
        <ProfileField label="Phone Number" value={user.phone} />
        <ProfileField label="Gender" value={user.gender?.toUpperCase()} />
      </ProfileCard>

      {user.vehicleInfo && (
        <ProfileCard title="Vehicle Details">
          <ProfileField
            label="Vehicle Type"
            value={user.vehicleInfo.vehicleType?.toUpperCase()}
          />
          <ProfileField
            label="License Plate"
            value={user.vehicleInfo.licensePlate}
          />
        </ProfileCard>
      )}
    </>
  );

  const renderUserProfile = () => (
    <>
      <ProfileCard title="Personal Information">
        <ProfileField label="Full Name" value={user.name} />
        <ProfileField label="Email Address" value={user.email} />
        <ProfileField label="Phone Number" value={user.phone} />
        <ProfileField
          label="Student Status"
          value={user.isStudent ? "Verified Student" : "Regular User"}
          isHighlighted={user.isStudent}
        />
      </ProfileCard>

      {!user.isStudent && (
        <View style={styles.promotionalCard}>
          <View style={styles.promotionalContent}>
            <Text style={styles.promotionalTitle}>🎓 Student Benefits</Text>
            <Text style={styles.promotionalText}>
              Get exclusive discounts on rides and rentals with student
              verification
            </Text>
          </View>
          <TouchableOpacity
            style={styles.studentButton}
            onPress={handleStudentRegistration}
          >
            <Text style={styles.studentButtonText}>Verify Student Status</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.title}>
          {user?.role === "driver" ? "Driver Dashboard" : "User Profile"}
        </Text>
        <Text style={styles.subtitle}>
          Welcome back, {user?.name?.split(" ")[0] || "User"}
        </Text>
      </View>

      {user ? (
        <View style={styles.profileContainer}>
          {user.role === "driver" ? renderDriverProfile() : renderUserProfile()}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user logged in</Text>
        </View>
      )}
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
  avatarContainer: {
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
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
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
  },
  profileContainer: {
    width: "100%",
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
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "400",
  },
  highlightedValue: {
    color: "#0084ff",
    fontWeight: "600",
  },
  promotionalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#0084ff",
  },
  promotionalContent: {
    marginBottom: 20,
  },
  promotionalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0084ff",
    marginBottom: 8,
  },
  promotionalText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  studentButton: {
    backgroundColor: "#0084ff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#0084ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  studentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  errorContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
});
