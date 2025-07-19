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
  Switch,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSelector } from "react-redux";
import socket from "../../socket";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const VEHICLE_TYPES = [
  {
    id: "bike",
    name: "Bike",
    icon: "🏍️",
    description: "Quick & affordable",
    pricePerKm: 50,
  },
  {
    id: "car",
    name: "Car",
    icon: "🚗",
    description: "Comfortable ride",
    pricePerKm: 160,
  },
];

// Function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Function to format address from geocoding response
const formatAddress = (addressObj) => {
  const parts = [];
  if (addressObj.name) parts.push(addressObj.name);
  if (addressObj.street) parts.push(addressObj.street);
  if (addressObj.city) parts.push(addressObj.city);
  if (addressObj.district) parts.push(addressObj.district);
  if (addressObj.region) parts.push(addressObj.region);

  return parts.filter((part) => part).join(", ");
};

export default function RequestRideScreen({ navigation }) {
  const user = useSelector((state) => state.auth.user);
  const [location, setLocation] = useState(null);
  const [pickupLocationName, setPickupLocationName] = useState(""); // Added pickup location name
  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState("bike");
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [rideStatus, setRideStatus] = useState("idle"); // idle, requesting, searching
  const [isSelectingDestination, setIsSelectingDestination] = useState(false);
  const [femaleDriverOnly, setFemaleDriverOnly] = useState(false);
  const [distance, setDistance] = useState(0);
  const [fare, setFare] = useState(0);

  const router = useRouter();

  const mapRef = useRef(null);
  const socketRef = useRef(null);

  // Calculate fare when distance or vehicle type changes
  useEffect(() => {
    if (distance > 0) {
      const selectedVehicleInfo = VEHICLE_TYPES.find(
        (v) => v.id === selectedVehicle
      );
      const calculatedFare = Math.ceil(
        distance * selectedVehicleInfo.pricePerKm
      );
      setFare(calculatedFare);
    } else {
      setFare(0);
    }
  }, [distance, selectedVehicle]);

  // Calculate distance when both pickup and dropoff locations are available
  useEffect(() => {
    if (location && destinationCoords) {
      const calculatedDistance = calculateDistance(
        location.latitude,
        location.longitude,
        destinationCoords.latitude,
        destinationCoords.longitude
      );
      setDistance(calculatedDistance);
    } else {
      setDistance(0);
    }
  }, [location, destinationCoords]);

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

      // Get pickup location name using reverse geocoding
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });

        if (addressResponse.length > 0) {
          const formattedAddress = formatAddress(addressResponse[0]);
          setPickupLocationName(
            formattedAddress ||
              `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
          );
        } else {
          setPickupLocationName(
            `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
          );
        }
      } catch (error) {
        console.error("Error getting pickup address:", error);
        setPickupLocationName(
          `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
        );
      }

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

  const handleMapPress = async (event) => {
    // Only allow when ride is idle
    if (rideStatus !== "idle") return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    setDestinationCoords({ latitude, longitude });

    // Show loading state while geocoding
    setDestination("Getting address...");

    try {
      // Reverse geocoding to get address
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const formattedAddress = formatAddress(addressResponse[0]);
        setDestination(
          formattedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        );
      } else {
        setDestination(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.error("Error getting address:", error);
      setDestination(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }

    // Auto-disable selection mode and provide haptic feedback
    setIsSelectingDestination(false);

    // Optional: Add haptic feedback (if you have expo-haptics installed)
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSelectDestination = () => {
    setIsSelectingDestination(true);
    // Alert.alert(
    //   "Select Destination",
    //   "Tap on the map to select your destination",
    //   [{ text: "Cancel", onPress: () => setIsSelectingDestination(false) }]
    // );
  };

  const handleRequestRide = async () => {
    if (!destination.trim() || !destinationCoords) {
      Alert.alert(
        "Destination Required",
        "Please select your destination from the map."
      );
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
              address: pickupLocationName, // Added pickup address
            },
            dropoff: {
              latitude: destinationCoords.latitude,
              longitude: destinationCoords.longitude,
              address: destination, // Added dropoff address
            },
            vehicleType: selectedVehicle,
            femaleDriverOnly: femaleDriverOnly,
            distance: distance,
            fare: fare,
          }),
        }
      );

      const data = await response.json();
      console.log(data);

      setRideStatus("idle");

      if (data.success) {
        Alert.alert(
          "Ride Requested!",
          `Looking for nearby ${femaleDriverOnly ? "female " : ""}drivers. You'll be notified when a driver accepts your ride.`
        );

        router.push("/fare-request");
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
        onPress={handleMapPress}
      >
        {location && (
          <Marker
            coordinate={location}
            title="Your Location"
            description={pickupLocationName || "Pickup location"}
            pinColor="#0084ff"
          />
        )}
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            title="Destination"
            description={destination || "Drop-off location"}
            pinColor="#ff4444"
          />
        )}
      </MapView>

      {/* Map Selection Overlay */}
      {isSelectingDestination && (
        <View style={styles.mapOverlay}>
          <View style={styles.mapOverlayContent}>
            <Text style={styles.mapOverlayText}>
              Tap on the map to select destination
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsSelectingDestination(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Pickup Location Display (Optional) */}
        {pickupLocationName && (
          <View style={styles.locationContainer}>
            <View style={styles.pickupDot} />
            <Text style={styles.locationText} numberOfLines={1}>
              From: {pickupLocationName}
            </Text>
          </View>
        )}

        {/* Destination Input */}
        <View style={styles.inputContainer}>
          <View style={styles.locationDot} />
          <TextInput
            style={styles.input}
            placeholder="Where to?"
            placeholderTextColor="#94a3b8"
            value={destination}
            onChangeText={setDestination}
            editable={false}
          />
          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectDestination}
            disabled={rideStatus !== "idle"}
          >
            <Text style={styles.selectButtonText}>📍</Text>
          </TouchableOpacity>
        </View>

        {/* Distance and Fare Display */}
        {distance > 0 && (
          <View style={styles.fareContainer}>
            <View style={styles.fareInfo}>
              <Text style={styles.fareLabel}>Distance</Text>
              <Text style={styles.fareValue}>{distance.toFixed(2)} km</Text>
            </View>
            <View style={styles.fareInfo}>
              <Text style={styles.fareLabel}>Estimated Fare</Text>
              <Text style={styles.fareValue}>Rs {fare}</Text>
            </View>
          </View>
        )}

        {/* Female Driver Toggle */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>👩‍💼 Female Driver Only</Text>
            <Text style={styles.toggleDescription}>
              Request rides from female drivers only
            </Text>
          </View>
          <Switch
            value={femaleDriverOnly}
            onValueChange={setFemaleDriverOnly}
            disabled={rideStatus !== "idle"}
            trackColor={{ false: "#e2e8f0", true: "#0084ff" }}
            thumbColor={femaleDriverOnly ? "#fff" : "#f1f5f9"}
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
              <Text style={styles.vehicleRate}>
                Rs {getSelectedVehicleInfo().pricePerKm}/km
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Request Button */}
        <TouchableOpacity
          style={[styles.requestButton]}
          onPress={handleRequestRide}
        >
          <Text style={styles.requestButtonText}>{getRideStatusText()}</Text>
        </TouchableOpacity>
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

            {VEHICLE_TYPES.map((vehicle) => {
              const vehicleFare =
                distance > 0 ? Math.ceil(distance * vehicle.pricePerKm) : 0;
              return (
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
                    <Text style={styles.vehicleOptionPrice}>
                      Rs {vehicle.pricePerKm}/km
                    </Text>
                    {distance > 0 && (
                      <Text style={styles.vehicleOptionFare}>
                        Total: Rs {vehicleFare}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

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
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  mapOverlayContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    margin: 20,
    alignItems: "center",
  },
  mapOverlayText: {
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 16,
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: "#64748b",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
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
  selectButton: {
    padding: 8,
  },
  selectButtonText: {
    fontSize: 20,
  },
  fareContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#0084ff",
  },
  fareInfo: {
    alignItems: "center",
  },
  fareLabel: {
    fontSize: 14,
    color: "#0369a1",
    marginBottom: 4,
  },
  fareValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0c4a6e",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  toggleDescription: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
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
  vehicleRate: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
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
  vehicleOptionFare: {
    fontSize: 14,
    color: "#0084ff",
    marginTop: 2,
    fontWeight: "500",
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
