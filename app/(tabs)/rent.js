import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";

export default function RentalListings() {
  const user = useSelector((state) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState([]);

  const FetchAllRents = async () => {
    try {
      const response = await axios.get(
        "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rent"
      );
      const data = response.data;
      console.log(data);
      setRentals(data.rents);

      // Extract unique categories preserving original case
      const categoryMap = new Map();
      data.rents
        ?.filter((rent) => rent.status === "active" && rent.category)
        .forEach((rent) => {
          const lowerCategory = rent.category.toLowerCase();
          if (!categoryMap.has(lowerCategory)) {
            categoryMap.set(lowerCategory, rent.category); // Store original case
          }
        });

      setAvailableCategories(Array.from(categoryMap.entries()));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching rentals:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    FetchAllRents();
  }, []);

  const filteredRentals = rentals?.filter((rental) => {
    // Only show active rentals
    if (rental?.status !== "active") return false;

    const matchesSearch =
      rental?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental?.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      rental?.category?.toLowerCase() === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const handleContactOwner = (rental) => {
    Alert.alert(
      "Contact Owner",
      `Would you like to contact the owner about this ${rental?.category}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          onPress: () => {
            const phoneNumber = rental?.user?.phone;
            if (phoneNumber) {
              Linking.openURL(`tel:${phoneNumber}`);
            } else {
              Alert.alert("Error", "Phone number not available.");
            }
          },
        },
        {
          text: "Message",
          onPress: () => {
            const phoneNumber = rental?.user?.phone;
            if (phoneNumber) {
              Linking.openURL(`sms:${phoneNumber}`);
            } else {
              Alert.alert("Error", "Phone number not available.");
            }
          },
        },
      ]
    );
  };

  const FilterButton = ({ title, value, isSelected }) => (
    <TouchableOpacity
      style={[styles.filterButton, isSelected && styles.filterButtonActive]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          isSelected && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const RentalCard = ({ rental }) => {
    const originalPrice =
      typeof rental?.price === "string"
        ? parseFloat(rental?.price)
        : rental?.price;
    const isStudent = user?.isStudent === true;
    const discountedPrice = isStudent ? originalPrice * 0.9 : originalPrice;

    return (
      <TouchableOpacity
        style={styles.rentalCard}
        // onPress={() => handleRentalPress(rental)}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: rental?.imageUrl }}
            style={styles.rentalImage}
          />
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>
              {rental?.category?.toUpperCase()}
            </Text>
          </View>
          {rental?.status !== "active" && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableText}>Not Available</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.rentalTitle}>{rental?.title}</Text>
          <Text style={styles.rentalLocation}>📍 {rental?.location}</Text>

          <Text style={styles.rentalDescription} numberOfLines={2}>
            {rental?.description}
          </Text>

          <View style={styles.bottomRow}>
            <View style={styles.priceContainer}>
              {isStudent && (
                <Text style={styles.originalPrice}>
                  Rs {originalPrice?.toLocaleString()}
                </Text>
              )}
              <Text style={styles.price}>
                Rs {discountedPrice?.toLocaleString()}
                {isStudent && (
                  <Text style={styles.discountText}> (10% off)</Text>
                )}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.contactButton,
                rental?.status !== "active" && styles.contactButtonDisabled,
              ]}
              onPress={() => handleContactOwner(rental)}
              disabled={rental?.status !== "active" || user.role !== "user"}
            >
              <Text style={styles.contactButtonText}>
                {rental?.status === "active" ? "Contact" : "Unavailable"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const LoadingCard = () => (
    <View style={styles.loadingCard}>
      <View style={styles.loadingImage} />
      <View style={styles.loadingContent}>
        <View style={styles.loadingText} />
        <View style={[styles.loadingText, { width: "60%" }]} />
        <View style={[styles.loadingText, { width: "40%" }]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rentals</Text>
        <Text style={styles.subtitle}>Find what you need to rent</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, location, or description..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {loading
            ? "Loading..."
            : `${filteredRentals?.length || 0} items available`}
        </Text>
      </View>

      <FlatList
        data={loading ? [1, 2, 3, 4, 5] : filteredRentals}
        keyExtractor={(item, index) =>
          loading ? index?.toString() : item?._id?.toString()
        }
        renderItem={({ item }) =>
          loading ? <LoadingCard /> : <RentalCard rental={item} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => {
          setLoading(true);
          FetchAllRents();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterContainer: {
    paddingLeft: 20,
    paddingBottom: 10,
    maxHeight: 50,
  },
  filterContentContainer: {
    paddingRight: 20,
    gap: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minWidth: 60,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#0084ff",
    borderColor: "#0084ff",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultsCount: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rentalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  rentalImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  typeTag: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#0084ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  unavailableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  unavailableText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cardContent: {
    padding: 16,
  },
  rentalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  rentalLocation: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  rentalDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "column", // Changed from "row"
    alignItems: "flex-start", // Changed from "baseline"
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0084ff",
  },
  contactButton: {
    backgroundColor: "#0084ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  loadingImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#e2e8f0",
  },
  loadingContent: {
    padding: 16,
  },
  loadingText: {
    height: 12,
    backgroundColor: "#e2e8f0",
    borderRadius: 6,
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#10b981",
  },
});
