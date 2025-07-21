import * as Location from "expo-location";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSelector } from "react-redux";
import socket from "../socket";

const { width, height } = Dimensions.get("window");

export default function TrackRideScreen() {
  const user = useSelector((state) => state.auth.user);
  const params = useLocalSearchParams();

  const [driverLocation, setDriverLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rideStatus, setRideStatus] = useState("Driver is on the way");
  const [rideStartTime, setRideStartTime] = useState(null);

  const socketRef = useRef(null);
  const watchRef = useRef(null);
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const router = useRouter();

  const rideData = {
    rideRoom: params.rideRoom,
    rideId: params.rideId,
    pickupLocation: {
      lat: Number(params.pickupLat),
      lng: Number(params.pickupLng),
    },
    dropoffLocation: {
      lat: Number(params.dropoffLat),
      lng: Number(params.dropoffLng),
    },
    userName: params.userName,
    userPhone: params.userPhone,
    driverName: params.driverName || "Driver",
    driverPhone: params.driverPhone || "N/A",
    licensePlate: params.licensePlate || "Unknown",
    vehicleInfo: params.vehicleInfo || params.licensePlate || "Unknown Vehicle",
    fare: params.fare || "0",
    estimatedArrival: params.estimatedArrival || "Calculating...",
  };

  useEffect(() => {
    if (!user?.id || !rideData.rideId) {
      console.log("Missing user.id or rideId, cannot initialize socket");
      setIsLoading(false);
      return;
    }

    socketRef.current = socket;

    // Join the ride room
    socketRef.current.emit("join-ride-room-server", {
      rideId: rideData.rideRoom,
      userId: user.id,
      userType: user.role === "driver" ? "driver" : "passenger",
    });

    // Driver-specific logic: Share location
    if (user.role === "driver") {
      const startTracking = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permission Denied",
              "Location access is required to share your position."
            );
            setIsLoading(false);
            return;
          }

          watchRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 1,
              timeInterval: 2000,
            },
            (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              socketRef.current.emit("share-driver-location", {
                rideRoom: rideData.rideRoom,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              setDriverLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                latitudeDelta: 0.0092,
                longitudeDelta: 0.0421,
              });
              setIsLoading(false);
            },
            (error) => {
              console.error("Location tracking error:", error);
              setIsLoading(false);
            }
          );
        } catch (error) {
          console.error("Error starting location tracking:", error);
          setIsLoading(false);
        }
      };
      startTracking();
    } else {
      // For passengers, set initial loading to false after joining room
      setIsLoading(false);
    }

    // Listen for driver location updates
    socketRef.current.on("driver-location-update", (data) => {
      const newLocation = {
        latitude: data.latitude,
        longitude: data.longitude,
        latitudeDelta: 0.0092,
        longitudeDelta: 0.0421,
      };
      setDriverLocation(newLocation);
      setIsLoading(false);

      if (data.status) {
        setRideStatus(data.status);
      }
    });

    socketRef.current.on("ride-status-update", (data) => {
      setRideStatus(data.status || "Ride in progress");
    });

    socketRef.current.on("ride-cancelled", (data) => {
      console.log(data);
      setRideStatus("Ride Cancelled");
      Alert.alert(
        "Ride Cancelled",
        `The ride was cancelled by the ${data.reason === "driver_cancelled" ? "driver" : "passenger"}.`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ]
      );
    });

    socketRef.current.on("ride-started", (data) => {
      setRideStatus("Ride in Progress");
      setRideStartTime(new Date(data.startTime));
    });

    socketRef.current.on("ride-stopped", (data) => {
      setRideStatus("Ride Completed");
      const durationMin = data.duration; // Use server-provided duration
      Alert.alert("Ride Completed", `The ride has ended.`, [
        {
          text: "OK",
          onPress: () => router.replace("/"),
        },
      ]);
    });

    socketRef.current.on("connect_error", (error) => {
      console.log("Socket connection error:", error.message);
    });

    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
      }
      if (socketRef.current) {
        socketRef.current.off("driver-location-update");
        socketRef.current.off("ride-status-update");
        socketRef.current.off("ride-cancelled");
        socketRef.current.off("ride-started");
        socketRef.current.off("ride-stopped");
        socketRef.current.off("connect_error");
        socketRef.current.emit("leave-ride-room", {
          rideId: rideData.rideRoom,
          userId: user.id,
        });
      }
    };
  }, [user?.id, rideData.rideId, rideData.rideRoom]);

  const handleCancelRide = () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel this ride? You may be charged a cancellation fee.",
      [
        { text: "Keep Ride", style: "cancel" },
        {
          text: "Cancel Ride",
          style: "destructive",
          onPress: async () => {
            try {
              socketRef.current.emit("cancel-ride", {
                rideId: rideData.rideRoom,
                userId: user.id,
                reason:
                  user.role === "driver"
                    ? "driver_cancelled"
                    : "passenger_cancelled",
              });
            } catch (error) {
              console.error("Error cancelling ride:", error);
              Alert.alert("Error", "Failed to cancel ride. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleStartRide = () => {
    Alert.alert("Start Ride", "Are you sure you want to start the ride?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start Ride",
        style: "default",
        onPress: async () => {
          try {
            const startTime = new Date().toISOString();
            socketRef.current.emit("start-ride", {
              rideId: rideData.rideRoom,
              userId: user.id,
              startTime,
            });
            setRideStartTime(new Date(startTime));
            setRideStatus("Ride in Progress");
          } catch (error) {
            console.error("Error starting ride:", error);
            Alert.alert("Error", "Failed to start ride. Please try again.");
          }
        },
      },
    ]);
  };

  const handleStopRide = () => {
    Alert.alert("Stop Ride", "Are you sure you want to end the ride?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Ride",
        style: "default",
        onPress: async () => {
          try {
            const endTime = new Date().toISOString();
            socketRef.current.emit("stop-ride", {
              rideId: rideData.rideRoom,
              userId: user.id,
              endTime,
            });
          } catch (error) {
            console.error("Error stopping ride:", error);
            Alert.alert("Error", "Failed to stop ride. Please try again.");
          }
        },
      },
    ]);
  };

  const handleCallDriver = async () => {
    if (!rideData.driverPhone || rideData.driverPhone === "N/A") {
      Alert.alert("Error", "Driver phone number is not available.");
      return;
    }
    try {
      const phoneUrl = `tel:${rideData.driverPhone}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert("Error", "Unable to make a call on this device.");
      }
    } catch (error) {
      console.error("Error opening dialer:", error);
      Alert.alert("Error", "Failed to open dialer. Please try again.");
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      "Leave Tracking",
      "Your ride is still active. Are you sure you want to go back?",
      [
        { text: "Stay", style: "-cancel" },
        { text: "Go Back", onPress: () => navigation.goBack() },
      ]
    );
  };

  const LoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084ff" />
        <Text style={styles.loadingText}>Connecting to your driver...</Text>
        <Text style={styles.loadingSubtext}>Getting live location updates</Text>
      </View>
    </View>
  );

  const RideInfoPanel = () => (
    <View style={styles.bottomPanel}>
      <View style={styles.panelContent}>
        <View style={styles.rideHeader}>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{rideData.driverName}</Text>
            <Text style={styles.vehicleInfo}>{rideData.vehicleInfo}</Text>
          </View>
          <View style={styles.fareInfo}>
            <Text style={styles.fareAmount}>PKR. {rideData.fare}</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{rideStatus}</Text>
        </View>

        <View style={styles.actionButtons}>
          {user.role === "driver" &&
            rideStatus !== "Ride in Progress" &&
            rideStatus !== "Ride Completed" && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartRide}
              >
                <Text style={styles.startButtonText}>Start Ride</Text>
              </TouchableOpacity>
            )}
          {user.role === "driver" && rideStatus === "Ride in Progress" && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopRide}
            >
              <Text style={styles.stopButtonText}>End Ride</Text>
            </TouchableOpacity>
          )}
          {user.role !== "driver" && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCallDriver}
            >
              <Text style={styles.contactButtonText}>Contact Driver</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRide}
          >
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!rideData.rideId || !user?.id) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0084ff" />
        <Text>Loading ride details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0084ff" />

      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backButtonText}>✕</Text>
      </TouchableOpacity>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: rideData.pickupLocation.lat || 24.8607,
          longitude: rideData.pickupLocation.lng || 67.0011,
          latitudeDelta: 0.0092,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={user.role === "driver"}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={true}
      >
        <Marker
          coordinate={{
            latitude: rideData.pickupLocation.lat || 24.8607,
            longitude: rideData.pickupLocation.lng || 67.0011,
          }}
          title="Pickup Location"
          description="Your pickup point"
          pinColor="#22c55e"
        />

        <Marker
          coordinate={{
            latitude: rideData.dropoffLocation.lat || 24.8607,
            longitude: rideData.dropoffLocation.lng || 67.0011,
          }}
          title="Dropoff Location"
          description="Your destination"
          pinColor="#ef4444"
        />

        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title={`${rideData.driverName} - ${rideData.vehicleInfo}`}
            description="Driver's current location"
            pinColor="#0084ff"
          />
        )}
      </MapView>

      {isLoading && <LoadingOverlay />}

      <RideInfoPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  map: {
    flex: 1,
    width: width,
    height: height,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(248, 250, 252, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  loadingContainer: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  panelContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  fareInfo: {
    alignItems: "flex-end",
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0084ff",
    marginBottom: 2,
  },
  etaText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  startButton: {
    flex: 1,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#6ee7b7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: "#15803d",
    fontSize: 16,
    fontWeight: "600",
  },
  stopButton: {
    flex: 1,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  stopButtonText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "600",
  },
  contactButton: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#0084ff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "600",
  },
});
