import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { useSelector } from "react-redux";
import socket from "../socket";

export default function UserFareProposals() {
  const user = useSelector((state) => state.auth.user);
  const [proposals, setProposals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user?.id) {
      socketRef.current = socket;

      // Listen for fare proposals from drivers
      socketRef.current.on("fare-proposal", (data) => {
        console.log("New fare proposal:", data);

        const newProposal = {
          id: data.proposalId,
          rideId: data.rideId,
          driverId: data.driverId,
          driverName: data.driverName || "Driver",
          driverPhone: data.driverPhone || "N/A",
          driverRating: data.driverRating || 4.5,
          proposedFare: data.proposedFare,
          pickupLocation: data.pickupLocation,
          dropoffLocation: data.dropoffLocation,
          distance: data.distance || "Calculating...",
          estimatedTime: data.estimatedTime || "Calculating...",
          rideType: data.rideType || "standard",
          proposalTime: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          expiresAt: data.expiresAt, // Proposal expiry time
        };

        setProposals((prevProposals) => [newProposal, ...prevProposals]);

        // Show notification
        Alert.alert(
          "New Fare Proposal",
          `${newProposal.driverName} proposed $${newProposal.proposedFare.toFixed(2)} for your ride`,
          [{ text: "View", onPress: () => {} }]
        );
      });

      // Listen for proposal updates (accepted/rejected by other users, expired, etc.)
      socketRef.current.on("proposal-update", (data) => {
        setProposals((prevProposals) =>
          prevProposals.filter((proposal) => proposal.id !== data.proposalId)
        );
      });

      return () => {
        socketRef.current?.off("fare-proposal");
        socketRef.current?.off("proposal-update");
      };
    }
  }, [user]);

  // Mock data for testing - remove in production
  useEffect(() => {
    const mockProposals = [
      {
        id: "P001",
        rideId: "R001",
        driverId: "D001",
        driverName: "John Smith",
        driverPhone: "+1 (555) 123-4567",
        driverRating: 4.8,
        proposedFare: 24.5,
        pickupLocation: { latitude: 40.7128, longitude: -74.006 },
        dropoffLocation: { latitude: 40.7589, longitude: -73.9851 },
        distance: "8.2 km",
        estimatedTime: "15 mins",
        rideType: "standard",
        proposalTime: "2:30 PM",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      },
      {
        id: "P002",
        rideId: "R002",
        driverId: "D002",
        driverName: "Sarah Johnson",
        driverPhone: "+1 (555) 987-6543",
        driverRating: 4.9,
        proposedFare: 22.75,
        pickupLocation: { latitude: 40.7128, longitude: -74.006 },
        dropoffLocation: { latitude: 40.7589, longitude: -73.9851 },
        distance: "8.2 km",
        estimatedTime: "15 mins",
        rideType: "premium",
        proposalTime: "2:28 PM",
        expiresAt: new Date(Date.now() + 8 * 60 * 1000), // 8 minutes from now
      },
    ];
    setProposals(mockProposals);
  }, []);

  const formatLocation = (location) => {
    if (typeof location === "string") return location;
    if (location?.latitude && location?.longitude) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
    return "Location not available";
  };

  const handleAcceptProposal = async (proposal) => {
    Alert.alert(
      "Accept Fare Proposal",
      `Accept $${proposal.proposedFare.toFixed(2)} fare from ${proposal.driverName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              const response = await fetch("/api/accept-fare-proposal", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  proposalId: proposal.id,
                  rideId: proposal.rideId,
                  userId: user.id,
                  driverId: proposal.driverId,
                }),
              });

              if (response.ok) {
                // Remove the accepted proposal and all other proposals for this ride
                setProposals((prevProposals) =>
                  prevProposals.filter((p) => p.rideId !== proposal.rideId)
                );

                Alert.alert(
                  "Ride Confirmed!",
                  `Your ride with ${proposal.driverName} has been confirmed. They will contact you shortly.`,
                  [{ text: "OK" }]
                );
              } else {
                Alert.alert(
                  "Error",
                  "Failed to accept proposal. Please try again."
                );
              }
            } catch (error) {
              console.error("Error accepting proposal:", error);
              Alert.alert("Error", "Network error. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleRejectProposal = async (proposal) => {
    Alert.alert(
      "Reject Fare Proposal",
      `Reject the $${proposal.proposedFare.toFixed(2)} fare from ${proposal.driverName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch("/api/reject-fare-proposal", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  proposalId: proposal.id,
                  userId: user.id,
                  driverId: proposal.driverId,
                }),
              });

              if (response.ok) {
                // Remove the rejected proposal
                setProposals((prevProposals) =>
                  prevProposals.filter((p) => p.id !== proposal.id)
                );
              } else {
                Alert.alert(
                  "Error",
                  "Failed to reject proposal. Please try again."
                );
              }
            } catch (error) {
              console.error("Error rejecting proposal:", error);
              Alert.alert("Error", "Network error. Please try again.");
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Fetch latest proposals from API
    try {
      const response = await fetch(`/api/user-fare-proposals/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals || []);
      }
    } catch (error) {
      console.error("Error refreshing proposals:", error);
    }
    setRefreshing(false);
  };

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

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push("★");
    }
    if (hasHalfStar) {
      stars.push("☆");
    }
    return stars.join("");
  };

  const ProposalCard = ({ proposal }) => (
    <View style={styles.proposalCard}>
      <View style={styles.proposalHeader}>
        <View style={styles.fareContainer}>
          <Text style={styles.fareAmount}>
            ${proposal.proposedFare.toFixed(2)}
          </Text>
          <View
            style={[
              styles.rideTypeTag,
              { backgroundColor: getRideTypeColor(proposal.rideType) },
            ]}
          >
            <Text style={styles.rideTypeText}>
              {getRideTypeLabel(proposal.rideType)}
            </Text>
          </View>
        </View>
        <Text style={styles.proposalTime}>{proposal.proposalTime}</Text>
      </View>

      <View style={styles.driverInfo}>
        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>{proposal.driverName}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.stars}>
              {renderStars(proposal.driverRating)}
            </Text>
            <Text style={styles.ratingText}>{proposal.driverRating}</Text>
          </View>
        </View>
        <Text style={styles.driverPhone}>{proposal.driverPhone}</Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText}>
              {formatLocation(proposal.pickupLocation)}
            </Text>
          </View>
        </View>

        <View style={styles.locationLine} />

        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Dropoff</Text>
            <Text style={styles.locationText}>
              {formatLocation(proposal.dropoffLocation)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{proposal.distance}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Est. Time</Text>
          <Text style={styles.detailValue}>{proposal.estimatedTime}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Ride ID</Text>
          <Text style={styles.detailValue}>#{proposal.rideId}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectProposal(proposal)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fare Proposals</Text>
        <Text style={styles.subtitle}>
          {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}{" "}
          available
        </Text>
      </View>

      <ScrollView
        style={styles.proposalsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {proposals.length > 0 ? (
          proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Fare Proposals</Text>
            <Text style={styles.emptyStateText}>
              Drivers will send you fare proposals for your ride requests. Pull
              down to refresh.
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
  proposalsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  fareContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#10b981",
    marginRight: 12,
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
  proposalTime: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  driverInfo: {
    marginBottom: 16,
  },
  driverDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stars: {
    fontSize: 16,
    color: "#fbbf24",
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  driverPhone: {
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
    marginBottom: 20,
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
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "600",
  },
  acceptButton: {
    flex: 2,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
});
