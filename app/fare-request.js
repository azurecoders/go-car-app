import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import socket from "../socket";

export default function UserFareProposals() {
  const user = useSelector((state) => state.auth.user);
  const [fareProposals, setFareProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const socketRef = useRef(null);
  const router = useRouter();

  // Initialize socket connection and fetch initial data
  useEffect(() => {
    if (user?.id) {
      socketRef.current = socket;

      // Simulate initial loading
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      // Listen for fare-proposal events from drivers
      socketRef.current.on("fare-proposal", (data) => {
        console.log("New fare proposal:", data);

        const newProposal = {
          id: data.proposalId || "123",
          rideId: data.rideId,
          driverId: data.driverId,
          driverName: data.driverName,
          driverPhone: data.driverPhone,
          driverRating: data.driverRating || 4.5,
          vehicleInfo: data.vehicleInfo,
          proposedFare: data.proposedFare,
          estimatedArrival: data.estimatedArrival || "5-8 min",
          timestamp: new Date().toISOString(),
        };

        console.log("New proposal:", newProposal);

        setFareProposals((prevProposals) => [newProposal, ...prevProposals]);

        Alert.alert(
          "New Fare Proposal",
          `${newProposal.driverName} has proposed PKR. ${newProposal.proposedFare} for your ride`,
          [
            { text: "View", onPress: () => {} },
            { text: "OK", onPress: () => {} },
          ]
        );
      });
    }
  }, [user]);

  const handleAcceptProposal = (proposal) => {
    setSelectedProposal(proposal);
    setShowConfirmModal(true);
  };

  const confirmAcceptProposal = async () => {
    try {
      const response = await fetch(
        "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rides/accept-fare-proposal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            proposalId: selectedProposal.id,
            rideId: selectedProposal.rideId,
            userId: user.id,
            driverId: selectedProposal.driverId,
            fare: selectedProposal.proposedFare,
          }),
        }
      );

      const data = await response.json();
      console.log("Data on fare-request page", data);

      if (response.ok) {
        setShowConfirmModal(false);
        setSelectedProposal(null);

        Alert.alert(
          "Ride Confirmed!",
          `Your ride with ${selectedProposal.driverName} has been confirmed.`,
          [{ text: "OK", onPress: () => {} }]
        );

        router.push({
          pathname: `/track-ride-screen`,
          params: {
            rideRoom: data.rideRoom,
            rideId: data.rideId,
            pickupLat: data.pickupLocation.lat,
            pickupLng: data.pickupLocation.lng,
            dropoffLat: data.dropoffLocation.lat,
            dropoffLng: data.dropoffLocation.lng,
            userName: data.userName,
            userPhone: data.userPhone,
            driverName: data.driverName,
            driverPhone: data.driverPhone,
            licensePlate: data.licensePlate,
            fare: String(data.fare),
          },
        });

        // Clear all proposals as ride is now confirmed
        setFareProposals([]);
      } else {
        Alert.alert("Error", "Failed to confirm ride. Please try again.");
      }
    } catch (error) {
      console.error("Error accepting proposal:", error);
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  const handleRejectProposal = (proposalId) => {
    Alert.alert(
      "Reject Proposal",
      "Are you sure you want to reject this fare proposal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            setFareProposals((prevProposals) =>
              prevProposals.filter((proposal) => proposal.id !== proposalId)
            );
          },
        },
      ]
    );
  };

  const FareProposalCard = ({ proposal }) => (
    <View style={styles.proposalCard}>
      <View style={styles.proposalHeader}>
        <View style={styles.driverInfo}>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{proposal.driverName}</Text>
          </View>
          <View style={styles.fareContainer}>
            <Text style={styles.fareAmount}>PKR. {proposal.proposedFare}</Text>
          </View>
        </View>
      </View>

      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleText}>
          {proposal.vehicleInfo || "Vehicle details not provided"}
        </Text>
        <Text style={styles.driverPhone}>{proposal.driverPhone}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectProposal(proposal.id)}
        >
          <Text style={styles.rejectButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptProposal(proposal)}
        >
          <Text style={styles.acceptButtonText}>Accept Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ConfirmModal = () => (
    <Modal
      visible={showConfirmModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowConfirmModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Confirm Ride</Text>
          <Text style={styles.modalSubtitle}>
            Accept fare proposal from {selectedProposal?.driverName}?
          </Text>

          <View style={styles.confirmationDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Driver:</Text>
              <Text style={styles.detailValue}>
                {selectedProposal?.driverName}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fare:</Text>
              <Text style={styles.detailValue}>
                PKR. {selectedProposal?.proposedFare}
              </Text>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowConfirmModal(false);
                setSelectedProposal(null);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={confirmAcceptProposal}
            >
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0084ff" />
      <Text style={styles.loadingText}>Fetching fare proposals...</Text>
      <Text style={styles.loadingSubtext}>
        Drivers are reviewing your ride request
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fare Proposals</Text>
        <Text style={styles.subtitle}>Hi {user?.name}</Text>
      </View>

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <LoadingState />
        ) : fareProposals.length > 0 ? (
          <View style={styles.proposalsContainer}>
            <Text style={styles.proposalsTitle}>
              {fareProposals.length} Proposal
              {fareProposals.length > 1 ? "s" : ""} Received
            </Text>
            {fareProposals.map((proposal) => (
              <FareProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No fare proposals yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Drivers will send their fare proposals shortly
            </Text>
          </View>
        )}
      </ScrollView>

      <ConfirmModal />
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  rideDetailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rideDetailsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
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
  rideStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  rideStat: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
  },
  proposalsContainer: {
    marginBottom: 20,
  },
  proposalsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  proposalCard: {
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
  proposalHeader: {
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: "600",
  },
  eta: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 4,
  },
  fareContainer: {
    alignItems: "flex-end",
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0084ff",
  },
  vehicleInfo: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  vehicleText: {
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: "#64748b",
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
    flex: 2,
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
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
  confirmationDetails: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
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
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#0084ff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
