import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSelector } from "react-redux";
import socket from "../../socket";

const { width, height } = Dimensions.get("window");

const VEHICLE_TYPES = [
  {
    id: "bike",
    name: "Bike",
    icon: "🏍️",
    price: "PKR 50-80",
    eta: "5-10 min",
    description: "Quick & affordable",
  },
  {
    id: "car",
    name: "Car",
    icon: "🚗",
    price: "PKR 120-200",
    eta: "8-15 min",
    description: "Comfortable ride",
  },
];

export default function RequestRideScreen({ navigation }) {
  const user = useSelector((state) => state.auth.user);
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("bike");
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [rideStatus, setRideStatus] = useState("idle"); // idle, requesting, searching
  console.log(rideStatus);

  const mapRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user?.id) {
      socketRef.current = socket;

      // Listen for ride events
      socketRef.current.on("ride-accepted", (data) => {
        setRideStatus("accepted");
        Alert.alert(
          "Ride Accepted!",
          `Driver ${data.driver.name} is coming to pick you up.`,
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("TrackRide", { ride: data }),
            },
          ]
        );
      });

      // socketRef.current.on("ride-declined", (data) => {
      //   setRideStatus("searching");
      //   // Continue searching for another driver
      // });

      socketRef.current.on("no-drivers-available", () => {
        console.log("No drivers available socket");
        setRideStatus("idle");
        Alert.alert(
          "No Drivers Available",
          "Sorry, no drivers are available in your area right now. Please try again later."
        );
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  // Get user's current location
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsRequestingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location services to use this feature."
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setLocation(userLocation);

      // Animate map to user's location
      if (mapRef.current) {
        mapRef.current.animateToRegion(userLocation, 1000);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Error",
        "Could not get your current location. Please try again."
      );
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const handleRequestRide = async () => {
    if (!destination.trim()) {
      Alert.alert("Destination Required", "Please enter your destination.");
      return;
    }

    if (!location) {
      Alert.alert("Location Required", "Please enable location services.");
      return;
    }

    setIsLoading(true);
    setRideStatus("requesting");

    try {
      const response = await fetch(
        "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rides/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            pickup: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            dropoff: {
              latitude: "24.858357795942815",
              longitude: "67.07619775494979",
            },
            vehicleType: selectedVehicle,
          }),
        }
      );

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        // setRideStatus("searching");
        Alert.alert(
          "Ride Requested!",
          "Looking for nearby drivers. You'll be notified when a driver accepts your ride."
        );
      } else {
        throw new Error(data.message || "Failed to request ride");
      }
    } catch (error) {
      console.error("Error requesting ride:", error);
      Alert.alert("Error", "Failed to request ride. Please try again.");
      setRideStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedVehicleInfo = () => {
    return VEHICLE_TYPES.find((vehicle) => vehicle.id === selectedVehicle);
  };

  const getRideStatusText = () => {
    switch (rideStatus) {
      case "requesting":
        return "Requesting ride...";
      case "searching":
        return "Searching for drivers...";
      case "accepted":
        return "Ride accepted!";
      default:
        return "Request Ride";
    }
  };

  if (isRequestingLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084ff" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={location}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
      >
        {location && (
          <Marker
            coordinate={location}
            title="Your Location"
            description="Pickup location"
            pinColor="#0084ff"
          />
        )}
      </MapView>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Destination Input */}
        <View style={styles.inputContainer}>
          <View style={styles.locationDot} />
          <TextInput
            style={styles.input}
            placeholder="Where to?"
            placeholderTextColor="#94a3b8"
            value={destination}
            onChangeText={setDestination}
            editable={rideStatus === "idle"}
          />
        </View>

        {/* Vehicle Selection */}
        <TouchableOpacity
          style={styles.vehicleSelector}
          onPress={() => setShowVehicleModal(true)}
          disabled={rideStatus !== "idle"}
        >
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleIcon}>
              {getSelectedVehicleInfo().icon}
            </Text>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleName}>
                {getSelectedVehicleInfo().name}
              </Text>
              <Text style={styles.vehiclePrice}>
                {getSelectedVehicleInfo().price}
              </Text>
            </View>
          </View>
          <Text style={styles.vehicleEta}>{getSelectedVehicleInfo().eta}</Text>
        </TouchableOpacity>

        {/* Request Button */}
        <TouchableOpacity
          style={[
            styles.requestButton,
            (isLoading || rideStatus !== "idle") &&
              styles.requestButtonDisabled,
          ]}
          onPress={handleRequestRide}
          disabled={isLoading || rideStatus !== "idle"}
        >
          {isLoading || rideStatus === "requesting" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.requestButtonText}>{getRideStatusText()}</Text>
          )}
        </TouchableOpacity>

        {/* Status Message */}
        {rideStatus === "searching" && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color="#0084ff" />
            <Text style={styles.statusText}>
              Finding the best driver for you...
            </Text>
          </View>
        )}
      </View>

      {/* Vehicle Selection Modal */}
      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Vehicle</Text>

            {VEHICLE_TYPES.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleOption,
                  selectedVehicle === vehicle.id &&
                    styles.vehicleOptionSelected,
                ]}
                onPress={() => {
                  setSelectedVehicle(vehicle.id);
                  setShowVehicleModal(false);
                }}
              >
                <Text style={styles.vehicleOptionIcon}>{vehicle.icon}</Text>
                <View style={styles.vehicleOptionInfo}>
                  <Text style={styles.vehicleOptionName}>{vehicle.name}</Text>
                  <Text style={styles.vehicleOptionDescription}>
                    {vehicle.description}
                  </Text>
                </View>
                <View style={styles.vehicleOptionPricing}>
                  <Text style={styles.vehicleOptionPrice}>{vehicle.price}</Text>
                  <Text style={styles.vehicleOptionEta}>{vehicle.eta}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowVehicleModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0084ff",
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1e293b",
  },
  vehicleSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  vehiclePrice: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  vehicleEta: {
    fontSize: 14,
    color: "#0084ff",
    fontWeight: "500",
  },
  requestButton: {
    backgroundColor: "#0084ff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#0084ff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  requestButtonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
    elevation: 0,
  },
  requestButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#64748b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.7,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 24,
  },
  vehicleOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  vehicleOptionSelected: {
    borderColor: "#0084ff",
    backgroundColor: "#f0f9ff",
  },
  vehicleOptionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  vehicleOptionInfo: {
    flex: 1,
  },
  vehicleOptionName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  vehicleOptionDescription: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  vehicleOptionPricing: {
    alignItems: "flex-end",
  },
  vehicleOptionPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  vehicleOptionEta: {
    fontSize: 14,
    color: "#0084ff",
    marginTop: 2,
  },
  modalCloseButton: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
});
