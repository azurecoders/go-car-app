import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { useSelector } from "react-redux";
import { useRouter, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");

export default function RentalDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useSelector((state) => state.auth.user);

  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Booking form state
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    purpose: "",
    additionalNotes: "",
    driverLicense: "",
    emergencyContact: "",
    emergencyPhone: "",
  });

  // Mock rental request status
  const [requestStatus, setRequestStatus] = useState({
    hasRequest: false,
    status: "pending", // pending, approved, rejected
    reason: "",
    requestDate: "",
    responseDate: "",
  });

  // Mock detailed rental data
  const mockRentalDetail = {
    id: 1,
    title: "Honda Civic 2023",
    type: "car",
    price: 2500,
    priceType: "day",
    location: "Karachi, DHA Phase 5",
    owner: {
      name: "Ahmad Khan",
      rating: 4.8,
      reviews: 24,
      joinDate: "2022",
      verified: true,
      phone: "+92 300 1234567",
    },
    images: [
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1549399292-8bb7d8e8e0c1?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1533473359331-0454633b9e1a?w=400&h=300&fit=crop",
    ],
    features: [
      "AC",
      "GPS Navigation",
      "Bluetooth",
      "Power Windows",
      "Central Locking",
    ],
    specifications: {
      transmission: "Automatic",
      fuel: "Petrol",
      seats: 5,
      year: 2023,
      mileage: "15 km/l",
      engine: "1.5L",
      color: "White",
    },
    description:
      "Well-maintained Honda Civic with excellent fuel efficiency. Perfect for city driving and long trips. The car is regularly serviced and cleaned before each rental.",
    rules: [
      "No smoking inside the vehicle",
      "Return with same fuel level",
      "Maximum speed limit 120 km/h",
      "No pets allowed",
      "Report any damages immediately",
    ],
    pricing: {
      daily: 2500,
      weekly: 15000,
      monthly: 60000,
      securityDeposit: 10000,
    },
    availability: {
      available: true,
      unavailableDates: ["2025-07-20", "2025-07-25"],
    },
    documents: ["Valid driving license", "CNIC copy", "Security deposit"],
    pickupLocation: "DHA Phase 5, Karachi",
    minRentalPeriod: "1 day",
    maxRentalPeriod: "30 days",
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRental(mockRentalDetail);
      setLoading(false);

      // Check if user has existing request
      const existingRequest = checkExistingRequest();
      if (existingRequest) {
        setRequestStatus(existingRequest);
      }
    }, 1000);
  }, []);

  const checkExistingRequest = () => {
    // Mock existing request - replace with actual API call
    return {
      hasRequest: true,
      status: "pending",
      reason: "",
      requestDate: "2025-07-18",
      responseDate: "",
    };
  };

  const handleBookingSubmit = () => {
    if (
      !bookingData.startDate ||
      !bookingData.endDate ||
      !bookingData.driverLicense
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    Alert.alert(
      "Confirm Booking Request",
      "Are you sure you want to submit this rental request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: () => {
            // Simulate API call
            setRequestStatus({
              hasRequest: true,
              status: "pending",
              reason: "",
              requestDate: new Date().toISOString().split("T")[0],
              responseDate: "",
            });
            setShowBookingForm(false);
            Alert.alert("Success", "Your rental request has been submitted!");
          },
        },
      ]
    );
  };

  const StatusBadge = ({ status, reason }) => {
    const getStatusColor = () => {
      switch (status) {
        case "pending":
          return "#f59e0b";
        case "approved":
          return "#10b981";
        case "rejected":
          return "#ef4444";
        default:
          return "#6b7280";
      }
    };

    return (
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        {reason && <Text style={styles.statusReason}>{reason}</Text>}
      </View>
    );
  };

  const ImageCarousel = ({ images }) => (
    <View style={styles.imageContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentImageIndex(index);
        }}
      >
        {images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={styles.carouselImage}
          />
        ))}
      </ScrollView>
      <View style={styles.imageIndicator}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentImageIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );

  const BookingForm = () => (
    <Modal
      visible={showBookingForm}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Rental Request</Text>
          <TouchableOpacity onPress={() => setShowBookingForm(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Rental Period</Text>

          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.inputLabel}>Start Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                value={bookingData.startDate}
                onChangeText={(text) =>
                  setBookingData({ ...bookingData, startDate: text })
                }
              />
            </View>
            <View style={styles.dateInput}>
              <Text style={styles.inputLabel}>End Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                value={bookingData.endDate}
                onChangeText={(text) =>
                  setBookingData({ ...bookingData, endDate: text })
                }
              />
            </View>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.inputLabel}>Start Time</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={bookingData.startTime}
                onChangeText={(text) =>
                  setBookingData({ ...bookingData, startTime: text })
                }
              />
            </View>
            <View style={styles.dateInput}>
              <Text style={styles.inputLabel}>End Time</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={bookingData.endTime}
                onChangeText={(text) =>
                  setBookingData({ ...bookingData, endTime: text })
                }
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Text style={styles.inputLabel}>Driver License Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your license number"
            value={bookingData.driverLicense}
            onChangeText={(text) =>
              setBookingData({ ...bookingData, driverLicense: text })
            }
          />

          <Text style={styles.inputLabel}>Emergency Contact Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={bookingData.emergencyContact}
            onChangeText={(text) =>
              setBookingData({ ...bookingData, emergencyContact: text })
            }
          />

          <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+92 300 1234567"
            value={bookingData.emergencyPhone}
            onChangeText={(text) =>
              setBookingData({ ...bookingData, emergencyPhone: text })
            }
          />

          <Text style={styles.inputLabel}>Purpose of Rental</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Business trip, Personal use"
            value={bookingData.purpose}
            onChangeText={(text) =>
              setBookingData({ ...bookingData, purpose: text })
            }
          />

          <Text style={styles.inputLabel}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special requirements or notes..."
            multiline
            numberOfLines={4}
            value={bookingData.additionalNotes}
            onChangeText={(text) =>
              setBookingData({ ...bookingData, additionalNotes: text })
            }
          />

          <View style={styles.formFooter}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalAmount}>Rs 5,000</Text>
              <Text style={styles.totalNote}>+ Rs 10,000 security deposit</Text>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleBookingSubmit}
            >
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageCarousel images={rental.images} />

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{rental.title}</Text>
            <Text style={styles.location}>📍 {rental.location}</Text>
            <Text style={styles.price}>
              Rs {rental.price.toLocaleString()}
              <Text style={styles.priceType}> per day</Text>
            </Text>
          </View>

          {requestStatus.hasRequest && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusTitle}>Request Status</Text>
              <StatusBadge
                status={requestStatus.status}
                reason={requestStatus.reason}
              />
              <Text style={styles.statusDate}>
                Requested on: {requestStatus.requestDate}
              </Text>
              {requestStatus.responseDate && (
                <Text style={styles.statusDate}>
                  Response on: {requestStatus.responseDate}
                </Text>
              )}
            </View>
          )}

          <View style={styles.ownerSection}>
            <Text style={styles.sectionTitle}>Owner Details</Text>
            <View style={styles.ownerInfo}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerAvatarText}>
                  {rental.owner.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.ownerDetails}>
                <Text style={styles.ownerName}>{rental.owner.name}</Text>
                <View style={styles.ownerRating}>
                  <Text style={styles.rating}>⭐ {rental.owner.rating}</Text>
                  <Text style={styles.reviews}>
                    ({rental.owner.reviews} reviews)
                  </Text>
                  {rental.owner.verified && (
                    <Text style={styles.verified}>✓ Verified</Text>
                  )}
                </View>
                <Text style={styles.joinDate}>
                  Member since {rental.owner.joinDate}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Specifications</Text>
            <View style={styles.specsGrid}>
              {Object.entries(rental.specifications).map(([key, value]) => (
                <View key={key} style={styles.specItem}>
                  <Text style={styles.specLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              {rental.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureText}>✓ {feature}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{rental.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.pricingGrid}>
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Daily</Text>
                <Text style={styles.pricingValue}>
                  Rs {rental.pricing.daily.toLocaleString()}
                </Text>
              </View>
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Weekly</Text>
                <Text style={styles.pricingValue}>
                  Rs {rental.pricing.weekly.toLocaleString()}
                </Text>
              </View>
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Monthly</Text>
                <Text style={styles.pricingValue}>
                  Rs {rental.pricing.monthly.toLocaleString()}
                </Text>
              </View>
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Security Deposit</Text>
                <Text style={styles.pricingValue}>
                  Rs {rental.pricing.securityDeposit.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Rules</Text>
            {rental.rules.map((rule, index) => (
              <Text key={index} style={styles.ruleItem}>
                • {rule}
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Documents</Text>
            {rental.documents.map((doc, index) => (
              <Text key={index} style={styles.documentItem}>
                • {doc}
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Information</Text>
            <Text style={styles.pickupInfo}>📍 {rental.pickupLocation}</Text>
            <Text style={styles.rentalPeriod}>
              Minimum rental: {rental.minRentalPeriod} | Maximum:{" "}
              {rental.maxRentalPeriod}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!requestStatus.hasRequest && (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => setShowBookingForm(true)}
          >
            <Text style={styles.bookButtonText}>Request Rental</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Contact Owner</Text>
        </TouchableOpacity>
      </View>

      <BookingForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    height: 300,
  },
  carouselImage: {
    width: width,
    height: 300,
    resizeMode: "cover",
  },
  imageIndicator: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: {
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0084ff",
  },
  priceType: {
    fontSize: 14,
    fontWeight: "400",
    color: "#64748b",
  },
  statusContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statusReason: {
    color: "#fff",
    fontSize: 10,
    marginTop: 2,
  },
  statusDate: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  ownerSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0084ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ownerAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  ownerRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: "#1e293b",
    marginRight: 8,
  },
  reviews: {
    fontSize: 12,
    color: "#64748b",
    marginRight: 8,
  },
  verified: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },
  joinDate: {
    fontSize: 12,
    color: "#64748b",
  },
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  specItem: {
    width: "48%",
    marginBottom: 12,
  },
  specLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: "500",
  },
  specValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featureItem: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#0084ff",
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  pricingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  pricingItem: {
    width: "48%",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  pricingLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  pricingValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  ruleItem: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    lineHeight: 20,
  },
  documentItem: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 6,
  },
  pickupInfo: {
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 8,
  },
  rentalPeriod: {
    fontSize: 12,
    color: "#64748b",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 12,
  },
  bookButton: {
    flex: 1,
    backgroundColor: "#0084ff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  contactButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0084ff",
  },
  contactButtonText: {
    color: "#0084ff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
  },
  closeButton: {
    fontSize: 24,
    color: "#64748b",
  },
  formContainer: {
    padding: 20,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  formFooter: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalContainer: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  totalNote: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#0084ff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
