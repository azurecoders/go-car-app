import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useSelector } from "react-redux";

export default function AdManagement() {
  const user = useSelector((state) => state.auth.user);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    images: [],
  });

  const categories = [
    "Cars",
    "Electronics",
    "Real Estate",
    "Jobs",
    "Services",
    "Fashion",
    "Sports",
    "Other",
  ];

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const response = await axios.get(
        "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rent"
      );
      const data = response.data;
      setAds(data);
      setLoading(false);
      return;
    } catch (error) {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAd(null);
    setFormData({
      title: "",
      description: "",
      price: "",
      category: "",
      location: "",
      images: [],
    });
    setModalVisible(true);
  };

  const openEditModal = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      category: ad.category,
      location: ad.location,
      images: ad.images,
    });
    setModalVisible(true);
  };

  const handleSaveAd = async () => {
    if (!formData.title || !formData.description || !formData.price) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      const newAd = {
        ...formData,
        id: editingAd ? editingAd.id : Date.now(),
        status: "active",
        createdAt: editingAd
          ? editingAd.createdAt
          : new Date().toISOString().split("T")[0],
        views: editingAd ? editingAd.views : 0,
      };

      if (editingAd) {
        // Update existing ad
        await axios.put(
          `https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rent/${editingAd.id}`,
          newAd
        );
        setAds(ads.map((ad) => (ad.id === editingAd.id ? newAd : ad)));
        Alert.alert("Success", "Ad updated successfully!");
      } else {
        // Create new ad
        await axios.post(
          "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rent",
          newAd
        );
        setAds([newAd, ...ads]);
        Alert.alert("Success", "Ad created successfully!");
      }

      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save ad");
    }
  };

  const handleDeleteAd = (adId) => {
    Alert.alert("Delete Ad", "Are you sure you want to delete this ad?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setAds(ads.filter((ad) => ad.id !== adId));
          Alert.alert("Success", "Ad deleted successfully!");
        },
      },
    ]);
  };

  const toggleAdStatus = (adId) => {
    setAds(
      ads.map((ad) =>
        ad.id === adId
          ? { ...ad, status: ad.status === "active" ? "inactive" : "active" }
          : ad
      )
    );
  };

  const AdCard = ({ ad }) => (
    <View style={styles.adCard}>
      <View style={styles.adHeader}>
        <View style={styles.adImageContainer}>
          <Image
            source={{
              uri: ad.images[0] || "https://via.placeholder.com/100x80",
            }}
            style={styles.adImage}
          />
        </View>
        <View style={styles.adInfo}>
          <Text style={styles.adTitle}>{ad.title}</Text>
          <Text style={styles.adPrice}>${ad.price}</Text>
          <Text style={styles.adCategory}>{ad.category}</Text>
          <Text style={styles.adLocation}>{ad.location}</Text>
        </View>
        <View style={styles.adStatus}>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: ad.status === "active" ? "#10b981" : "#ef4444",
              },
            ]}
          >
            <Text style={styles.statusText}>
              {ad.status === "active" ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.adStats}>
        <Text style={styles.adStat}>Views: {ad.views}</Text>
        <Text style={styles.adStat}>Created: {ad.createdAt}</Text>
      </View>

      <Text style={styles.adDescription} numberOfLines={2}>
        {ad.description}
      </Text>

      <View style={styles.adActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(ad)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.statusButton]}
          onPress={() => toggleAdStatus(ad.id)}
        >
          <Text style={styles.actionButtonText}>
            {ad.status === "active" ? "Deactivate" : "Activate"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAd(ad.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const CreateEditModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAd ? "Edit Ad" : "Create New Ad"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) =>
                    setFormData({ ...formData, title: text })
                  }
                  placeholder="Enter ad title"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="Enter ad description"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Price *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) =>
                    setFormData({ ...formData, price: text })
                  }
                  placeholder="Enter price"
                  keyboardType="numeric"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                >
                  <View style={styles.categoryContainer}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryChip,
                          formData.category === category &&
                            styles.selectedCategory,
                        ]}
                        onPress={() => setFormData({ ...formData, category })}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            formData.category === category &&
                              styles.selectedCategoryText,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) =>
                    setFormData({ ...formData, location: text })
                  }
                  placeholder="Enter location"
                  returnKeyType="done"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveAd}
              >
                <Text style={styles.saveButtonText}>
                  {editingAd ? "Update" : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084ff" />
        <Text style={styles.loadingText}>Loading your ads...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Ads</Text>
        <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
          <Text style={styles.createButtonText}>+ Create Ad</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ads.length}</Text>
          <Text style={styles.statLabel}>Total Ads</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {ads.filter((ad) => ad.status === "active").length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {ads.reduce((sum, ad) => sum + ad.views, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
      </View>

      <ScrollView style={styles.adsList}>
        {ads.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No ads found</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first ad to get started!
            </Text>
          </View>
        ) : (
          ads.map((ad) => <AdCard key={ad.id} ad={ad} />)
        )}
      </ScrollView>

      <CreateEditModal />
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
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  createButton: {
    backgroundColor: "#0084ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 5,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0084ff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  adsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  adCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  adImageContainer: {
    marginRight: 12,
  },
  adImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
  },
  adInfo: {
    flex: 1,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  adPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0084ff",
    marginBottom: 2,
  },
  adCategory: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  adLocation: {
    fontSize: 12,
    color: "#64748b",
  },
  adStatus: {
    alignItems: "flex-end",
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  adStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  adStat: {
    fontSize: 12,
    color: "#64748b",
  },
  adDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 16,
  },
  adActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#0084ff",
  },
  statusButton: {
    backgroundColor: "#10b981",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    height: Dimensions.get("window").height * 0.85,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    height: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#64748b",
  },
  modalBody: {
    padding: 20,
  },
  modalBodyContent: {
    paddingBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    minHeight: 44,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  categoryContainer: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: "#0084ff",
  },
  categoryText: {
    fontSize: 12,
    color: "#64748b",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  saveButton: {
    backgroundColor: "#0084ff",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
