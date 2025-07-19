import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import socket from "../../socket";

export default function DriverRideRequests() {
  const driver = useSelector((state) => state.auth.user);
  const [rideRequests, setRideRequests] = useState([]);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [proposedFare, setProposedFare] = useState("");

  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (driver?.id) {
      socketRef.current = socket;

      // Listen for ride-request events
      socketRef.current.on("ride-request", (data) => {
        console.log("New ride request:", data);

        const newRide = {
          id: data.rideId,
          driverId: data.driverId,
          pickupLocation: data.pickupLocation,
          dropoffLocation: data.dropoffLocation,
          userName: data.userName,
          userPhone: data.userPhone,
          femaleDriverOnly: data.femaleDriverOnly,
          driverGender: data.driverGender,
          fare: data.fare,
        };

        setRideRequests((prevRides) => [newRide, ...prevRides]);

        Alert.alert(
          "New Ride Request",
          `You have a new ride request from ${newRide.userName}`,
          [{ text: "OK" }]
        );
      });

      return () => {
        socketRef.current?.off("ride-request");
        socketRef.current?.disconnect();
      };
    }
  }, [driver]);

  const handleSetPrice = (ride) => {
    setSelectedRide(ride);
    setProposedFare("");
    setShowPricingModal(true);
  };

  const submitPriceProposal = async () => {
    if (!proposedFare || isNaN(proposedFare) || parseFloat(proposedFare) <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid fare amount");
      return;
    }

    try {
      const response = await fetch(
        "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rides/ride-price-proposal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rideId: selectedRide.id,
            driverId: driver.id,
            fare: parseFloat(proposedFare),
          }),
        }
      );

      if (response.ok) {
        // Remove the ride from requests after submitting price
        setRideRequests((prevRides) =>
          prevRides.filter((ride) => ride.id !== selectedRide.id)
        );

        setShowPricingModal(false);
        setSelectedRide(null);
        setProposedFare("");

        Alert.alert("Success", "Your price proposal has been submitted!");
      } else {
        Alert.alert(
          "Error",
          "Failed to submit price proposal. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting price:", error);
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  const handleRejectRide = (rideId) => {
    Alert.alert("Reject Ride", "Are you sure you want to reject this ride?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => {
          setRideRequests((prevRides) =>
            prevRides.filter((ride) => ride.id !== rideId)
          );
        },
      },
    ]);
  };

  const RideRequestCard = ({ ride }) => (
    <View style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <Text style={styles.rideId}>#{ride.id}</Text>
      </View>
      <View style={styles.estimatedFareHeader}>
        <Text style={styles.rideId}>
          <Text style={{ fontWeight: "bold" }}>Estimated Fare:</Text>{" "}
          {ride.fare} PKR
        </Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          <Text style={{ fontWeight: "bold" }}>Name:</Text> {ride.userName}
        </Text>
        <Text style={styles.userPhone}>
          <Text style={{ fontWeight: "bold" }}>Phone:</Text> {ride.userPhone}
        </Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText}>
              {ride.pickupLocation.address}
            </Text>
          </View>
        </View>

        <View style={styles.locationLine} />

        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Dropoff</Text>
            <Text style={styles.locationText}>
              {ride.dropoffLocation.address}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRide(ride.id)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.setPriceButton,
            ride.femaleDriverOnly &&
              ride.driverGender !== "female" &&
              styles.setPriceButtonDisabled,
          ]}
          disabled={ride.femaleDriverOnly && ride.driverGender !== "female"}
          onPress={() => handleSetPrice(ride)}
        >
          <Text style={styles.setPriceButtonText}>Set Price</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const PricingModal = () => (
    <Modal
      visible={showPricingModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPricingModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Set Your Fare</Text>
          <Text style={styles.modalSubtitle}>Ride #{selectedRide?.id}</Text>

          <View style={styles.fareInputContainer}>
            <Text style={styles.fareInputLabel}>Proposed Fare ($)</Text>
            <TextInput
              style={styles.fareInput}
              value={proposedFare}
              onChangeText={setProposedFare}
              placeholder="Enter fare amount"
              keyboardType="numeric"
              autoFocus
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowPricingModal(false);
                setSelectedRide(null);
                setProposedFare("");
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={submitPriceProposal}
            >
              <Text style={styles.modalSubmitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride Requests</Text>
        <Text style={styles.subtitle}>Driver: {driver?.name}</Text>
      </View>

      <ScrollView
        style={styles.ridesContainer}
        showsVerticalScrollIndicator={false}
      >
        {rideRequests.length > 0 ? (
          rideRequests.map((ride) => (
            <RideRequestCard key={ride.id} ride={ride} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No ride requests found</Text>
          </View>
        )}
      </ScrollView>

      <PricingModal />
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
    marginBottom: 16,
  },
  estimatedFareHeader: {
    borderWidth: 1, // you probably want border *width*
    borderColor: "#10b981",
    backgroundColor: "#d1fae5", // light green background that pairs with #10b981
    color: "black", // text color
    padding: 10, // optional: gives some spacing inside
    borderRadius: 8, // optional: rounded corners look nice
    marginBottom: 10,
  },
  rideId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
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
  setPriceButton: {
    flex: 1,
    backgroundColor: "#0084ff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  setPriceButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  setPriceButtonDisabled: {
    opacity: 0.5,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  fareInputContainer: {
    marginBottom: 24,
  },
  fareInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  fareInput: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "#f8fafc",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: "#0084ff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSubmitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
