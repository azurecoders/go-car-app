import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import axios from "axios";

export default function RentalListings() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const FetchAllRents = async () => {
    try {
      const response = await axios.get(
        "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rent"
      );
      const data = response.data;
      setRentals(data.rent);
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
    const matchesSearch =
      rental.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" || rental.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleRentalPress = (rental) => {
    // Navigate to rental details page
    router.push(`/rental-details/${rental.id}`);
  };

  const handleContactOwner = (rental) => {
    Alert.alert(
      "Contact Owner",
      `Would you like to contact ${rental.owner} about this ${rental.type}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => router.push(`/ad`) },
        { text: "Message", onPress: () => console.log("Messaging owner") },
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

  const RentalCard = ({ rental }) => (
    <TouchableOpacity
      style={styles.rentalCard}
      onPress={() => handleRentalPress(rental)}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: rental.image }} style={styles.rentalImage} />
        <View style={styles.typeTag}>
          <Text style={styles.typeTagText}>{rental.type.toUpperCase()}</Text>
        </View>
        {!rental.available && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Not Available</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.rentalTitle}>{rental.title}</Text>
        <Text style={styles.rentalLocation}>📍 {rental.location}</Text>

        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {rental.rating}</Text>
          <Text style={styles.reviews}>({rental.reviews} reviews)</Text>
        </View>

        <View style={styles.featuresContainer}>
          {rental.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>
            {rental.type === "car"
              ? `${rental.seats} seats`
              : `${rental.engine}`}
          </Text>
          <Text style={styles.detailText}>• {rental.transmission}</Text>
          <Text style={styles.detailText}>• {rental.fuel}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>Rs {rental.price.toLocaleString()}</Text>
            <Text style={styles.priceType}>per {rental.priceType}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.contactButton,
              !rental.available && styles.contactButtonDisabled,
            ]}
            onPress={() => handleContactOwner(rental)}
            disabled={!rental.available}
          >
            <Text style={styles.contactButtonText}>
              {rental.available ? "Contact" : "Unavailable"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>Vehicle Rentals</Text>
        <Text style={styles.subtitle}>
          Find the perfect ride for your needs
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by vehicle or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <FilterButton
          title="All"
          value="all"
          isSelected={selectedFilter === "all"}
        />
        <FilterButton
          title="Cars"
          value="car"
          isSelected={selectedFilter === "car"}
        />
        <FilterButton
          title="Bikes"
          value="bike"
          isSelected={selectedFilter === "bike"}
        />
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {loading
            ? "Loading..."
            : `${filteredRentals?.length || 0} vehicles available`}
        </Text>
      </View>

      <FlatList
        data={loading ? [1, 2, 3, 4, 5] : filteredRentals}
        keyExtractor={(item, index) =>
          loading ? index.toString() : item.id.toString()
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
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rating: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  reviews: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 4,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailText: {
    fontSize: 12,
    color: "#64748b",
    marginRight: 8,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0084ff",
  },
  priceType: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
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
});
