import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import socket from "../../socket";

export default function DriverRides() {
  const driver = useSelector((state) => state.auth.user);
  const [rides, setRides] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // pending, active, completed

  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (driver?.id) {
      socketRef.current = socket;

      // Listen for ride events
      socketRef.current.on("new-ride", (data) => {
        console.log("New ride:", data);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [driver]);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockRides = [
      {
        id: "R001",
        userName: "Sarah Johnson",
        userPhone: "+1 (555) 123-4567",
        pickupLocation: "123 Main Street, Downtown",
        dropoffLocation: "456 Oak Avenue, Uptown",
        fare: 25.5,
        distance: "8.2 km",
        estimatedTime: "15 mins",
        status: "pending",
        requestTime: "2:30 PM",
        rideType: "standard",
      },
      {
        id: "R002",
        userName: "Mike Chen",
        userPhone: "+1 (555) 987-6543",
        pickupLocation: "789 University Drive, Campus",
        dropoffLocation: "321 Shopping Mall, West Side",
        fare: 18.75,
        distance: "6.1 km",
        estimatedTime: "12 mins",
        status: "active",
        requestTime: "2:15 PM",
        rideType: "student",
      },
      {
        id: "R003",
        userName: "Emma Wilson",
        userPhone: "+1 (555) 456-7890",
        pickupLocation: "555 Park Street, Central",
        dropoffLocation: "888 Business District, East",
        fare: 32.25,
        distance: "11.5 km",
        estimatedTime: "20 mins",
        status: "completed",
        requestTime: "1:45 PM",
        completedTime: "2:25 PM",
        rideType: "standard",
      },
      {
        id: "R004",
        userName: "Alex Rodriguez",
        userPhone: "+1 (555) 321-9876",
        pickupLocation: "777 Hotel Plaza, Tourist Area",
        dropoffLocation: "999 Airport Terminal, South",
        fare: 45.0,
        distance: "18.3 km",
        estimatedTime: "25 mins",
        status: "pending",
        requestTime: "2:45 PM",
        rideType: "premium",
      },
    ];
    setRides(mockRides);
  }, []);

  const handleAcceptRide = (rideId) => {
    Alert.alert("Accept Ride", "Are you sure you want to accept this ride?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => {
          setRides((prevRides) =>
            prevRides.map((ride) =>
              ride.id === rideId ? { ...ride, status: "active" } : ride
            )
          );
          setActiveTab("active");
        },
      },
    ]);
  };

  const handleRejectRide = (rideId) => {
    Alert.alert("Reject Ride", "Are you sure you want to reject this ride?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => {
          setRides((prevRides) =>
            prevRides.filter((ride) => ride.id !== rideId)
          );
        },
      },
    ]);
  };

  const handleCompleteRide = (rideId) => {
    Alert.alert("Complete Ride", "Mark this ride as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: () => {
          setRides((prevRides) =>
            prevRides.map((ride) =>
              ride.id === rideId
                ? {
                    ...ride,
                    status: "completed",
                    completedTime: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  }
                : ride
            )
          );
          setActiveTab("completed");
        },
      },
    ]);
  };

  const filteredRides = rides.filter((ride) => ride.status === activeTab);

  const getRideTypeColor = (rideType) => {
    switch (rideType) {
      case "student":
        return "#10b981";
      case "premium":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getRideTypeLabel = (rideType) => {
    switch (rideType) {
      case "student":
        return "Student";
      case "premium":
        return "Premium";
      default:
        return "Standard";
    }
  };

  const TabButton = ({ title, isActive, onPress, count }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTab]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {title}
      </Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const RideCard = ({ ride }) => (
    <View style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.rideIdContainer}>
          <Text style={styles.rideId}>#{ride.id}</Text>
          <View
            style={[
              styles.rideTypeTag,
              { backgroundColor: getRideTypeColor(ride.rideType) },
            ]}
          >
            <Text style={styles.rideTypeText}>
              {getRideTypeLabel(ride.rideType)}
            </Text>
          </View>
        </View>
        <Text style={styles.fareAmount}>${ride.fare.toFixed(2)}</Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{ride.userName}</Text>
        <Text style={styles.userPhone}>{ride.userPhone}</Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText}>{ride.pickupLocation}</Text>
          </View>
        </View>

        <View style={styles.locationLine} />

        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Dropoff</Text>
            <Text style={styles.locationText}>{ride.dropoffLocation}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{ride.distance}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Est. Time</Text>
          <Text style={styles.detailValue}>{ride.estimatedTime}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Requested</Text>
          <Text style={styles.detailValue}>{ride.requestTime}</Text>
        </View>
      </View>

      {ride.completedTime && (
        <View style={styles.completedInfo}>
          <Text style={styles.completedText}>
            Completed at {ride.completedTime}
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        {ride.status === "pending" && (
          <>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectRide(ride.id)}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptRide(ride.id)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </>
        )}

        {ride.status === "active" && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteRide(ride.id)}
          >
            <Text style={styles.completeButtonText}>Complete Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
        <Text style={styles.subtitle}>Driver: {driver?.name}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TabButton
          title="Pending"
          isActive={activeTab === "pending"}
          onPress={() => setActiveTab("pending")}
          count={rides.filter((r) => r.status === "pending").length}
        />
        <TabButton
          title="Active"
          isActive={activeTab === "active"}
          onPress={() => setActiveTab("active")}
          count={rides.filter((r) => r.status === "active").length}
        />
        <TabButton
          title="Completed"
          isActive={activeTab === "completed"}
          onPress={() => setActiveTab("completed")}
          count={rides.filter((r) => r.status === "completed").length}
        />
      </View>

      <ScrollView
        style={styles.ridesContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredRides.length > 0 ? (
          filteredRides.map((ride) => <RideCard key={ride.id} ride={ride} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No {activeTab} rides found
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#0084ff",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#e0f2fe",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    position: "relative",
  },
  activeTab: {
    backgroundColor: "#0084ff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabText: {
    color: "#fff",
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  ridesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  rideCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rideIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rideId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginRight: 8,
  },
  rideTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rideTypeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10b981",
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: "#64748b",
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    marginRight: 12,
    marginTop: 4,
  },
  destinationDot: {
    backgroundColor: "#ef4444",
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: "#e2e8f0",
    marginLeft: 5,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: "#1e293b",
    lineHeight: 20,
  },
  rideDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  completedInfo: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  completedText: {
    fontSize: 14,
    color: "#0369a1",
    fontWeight: "500",
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#0084ff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  completeButton: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
});
