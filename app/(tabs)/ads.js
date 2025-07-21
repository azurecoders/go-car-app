import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
} from "react-native";
import { useSelector } from "react-redux";
// Import StatusBar from expo-status-bar for proper modal handling
import { StatusBar } from "expo-status-bar";
import axios from "axios";
// Import the modal from @react-native-async-storage/async-storage or use react-native-modal
// For this example, I'll use react-native-modal which works well with Expo
import Modal from "react-native-modal";

const CreateEditModal = ({
  isVisible,
  onClose,
  onSave,
  editingAd,
  categories,
}) => {
  // Individual state variables to minimize re-renders
  const [title, setTitle] = useState(editingAd ? editingAd.title : "");
  const [description, setDescription] = useState(
    editingAd ? editingAd.description : ""
  );
  const [price, setPrice] = useState(editingAd ? editingAd.price : "");
  const [category, setCategory] = useState(editingAd ? editingAd.category : "");
  const [location, setLocation] = useState(editingAd ? editingAd.location : "");
  const [imageUrl, setImageUrl] = useState(editingAd ? editingAd.imageUrl : "");

  // Refs for TextInput focus management
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const imageUrlInputRef = useRef(null);

  // Track the currently focused input
  const focusedInputRef = useRef(null);

  // Reset form when modal opens/closes or editing ad changes
  useEffect(() => {
    if (isVisible) {
      setTitle(editingAd ? editingAd.title : "");
      setDescription(editingAd ? editingAd.description : "");
      setPrice(editingAd ? editingAd.price : "");
      setCategory(editingAd ? editingAd.category : "");
      setLocation(editingAd ? editingAd.location : "");
      setImageUrl(editingAd ? editingAd.imageUrl : "");
    }
  }, [isVisible, editingAd]);

  // Restore focus after re-render
  const restoreFocus = useCallback((ref) => {
    if (ref.current) {
      setTimeout(() => {
        ref.current.focus();
      }, 0);
    }
  }, []);

  // Handle input changes with focus retention
  const handleInputChange = useCallback(
    (setter, value, ref) => {
      setter(value);
      focusedInputRef.current = ref;
      restoreFocus(ref);
    },
    [restoreFocus]
  );

  // Focus next field
  const focusNextField = (nextRef) => {
    if (nextRef.current) {
      nextRef.current.focus();
      focusedInputRef.current = nextRef;
    }
  };

  // Handle save
  const handleSave = () => {
    const adData = {
      title,
      description,
      price,
      category,
      location,
      imageUrl,
      images: editingAd ? editingAd.images : imageUrl ? [imageUrl] : [],
      id: editingAd ? editingAd.id : Date.now(),
      status: editingAd ? editingAd.status : "active",
      createdAt: editingAd
        ? editingAd.createdAt
        : new Date().toISOString().split("T")[0],
      views: editingAd ? editingAd.views : 0,
    };

    onSave(adData);
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
      backdropOpacity={0.5}
      avoidKeyboard={true}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      useNativeDriverForBackdrop={true}
      hideModalContentWhileAnimating={true}
      propagateSwipe={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContent}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      >
        <StatusBar style="light" />

        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHandleContainer}>
            <View style={styles.modalHandle} />
          </View>
          <View style={styles.modalTitleContainer}>
            <Text style={styles.modalTitle}>
              {editingAd ? "Edit Ad" : "Create New Ad"}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Body */}
        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={styles.modalBodyContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              ref={titleInputRef}
              style={styles.input}
              value={title}
              onChangeText={(text) =>
                handleInputChange(setTitle, text, titleInputRef)
              }
              placeholder="Enter ad title"
              returnKeyType="next"
              blurOnSubmit={false}
              autoFocus={true}
              onSubmitEditing={() => focusNextField(descriptionInputRef)}
              onFocus={() => (focusedInputRef.current = titleInputRef)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              ref={descriptionInputRef}
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={(text) =>
                handleInputChange(setDescription, text, descriptionInputRef)
              }
              placeholder="Enter ad description"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => focusNextField(priceInputRef)}
              onFocus={() => (focusedInputRef.current = descriptionInputRef)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              ref={priceInputRef}
              style={styles.input}
              value={price}
              onChangeText={(text) =>
                handleInputChange(setPrice, text, priceInputRef)
              }
              placeholder="Enter price"
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => focusNextField(imageUrlInputRef)}
              onFocus={() => (focusedInputRef.current = priceInputRef)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              ref={imageUrlInputRef}
              style={styles.input}
              value={imageUrl}
              onChangeText={(text) =>
                handleInputChange(setImageUrl, text, imageUrlInputRef)
              }
              placeholder="Enter image URL"
              returnKeyType="next"
              blurOnSubmit={false}
              keyboardType="url"
              autoCapitalize="none"
              onSubmitEditing={() => focusNextField(locationInputRef)}
              onFocus={() => (focusedInputRef.current = imageUrlInputRef)}
            />
          </View>

          {/* Image Preview */}
          {imageUrl ? (
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.label}>Image Preview</Text>
              <Image
                source={{ uri: imageUrl }}
                style={styles.imagePreview}
                onError={() => {
                  console.log("Failed to load image");
                }}
              />
            </View>
          ) : null}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.categoryContainer}>
                {categories?.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.selectedCategory,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.selectedCategoryText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              ref={locationInputRef}
              style={styles.input}
              value={location}
              onChangeText={(text) =>
                handleInputChange(setLocation, text, locationInputRef)
              }
              placeholder="Enter location"
              returnKeyType="done"
              blurOnSubmit={true}
              onFocus={() => (focusedInputRef.current = locationInputRef)}
            />
          </View>
        </ScrollView>

        {/* Modal Footer */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              {editingAd ? "Update" : "Create"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const DeleteReasonModal = ({ isVisible, onClose, onDelete }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [budget, setBudget] = useState("");
  const [showBudgetInput, setShowBudgetInput] = useState(false);

  const predefinedReasons = [
    "Item sold",
    "No longer available",
    "Price changed significantly",
    "User bought it",
    "Duplicate listing",
    "Other",
  ];

  const handleReasonSelect = (reason) => {
    setSelectedReason(reason);
    setShowBudgetInput(reason === "User bought it" || reason === "Item sold");
    if (reason !== "Other") {
      setCustomReason("");
    }
    if (reason !== "User bought it") {
      setBudget("");
    }
  };

  const handleDelete = () => {
    let finalReason = "";

    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason for deletion");
      return;
    }

    if (selectedReason === "Other") {
      if (!customReason.trim()) {
        Alert.alert("Error", "Please provide a custom reason");
        return;
      }
      finalReason = customReason.trim();
    } else if (selectedReason === "User bought it") {
      if (!budget.trim()) {
        Alert.alert("Error", "Please provide the budget/price");
        return;
      }
      finalReason = `User bought it for ${budget.trim()}`;
    } else {
      finalReason = selectedReason;
    }

    onDelete(finalReason);
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    setBudget("");
    setShowBudgetInput(false);
    onClose();
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={handleClose}
      style={styles.deleteModal}
      backdropOpacity={0.5}
    >
      <View style={styles.deleteModalContent}>
        <Text style={styles.deleteModalTitle}>Delete Ad</Text>
        <Text style={styles.deleteModalSubtitle}>
          Please select a reason for deleting this ad:
        </Text>

        <ScrollView
          style={styles.reasonsContainer}
          showsVerticalScrollIndicator={false}
        >
          {predefinedReasons.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonOption,
                selectedReason === reason && styles.selectedReasonOption,
              ]}
              onPress={() => handleReasonSelect(reason)}
            >
              <View style={styles.reasonOptionContent}>
                <View
                  style={[
                    styles.radioButton,
                    selectedReason === reason && styles.selectedRadioButton,
                  ]}
                >
                  {selectedReason === reason && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.selectedReasonText,
                  ]}
                >
                  {reason}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedReason === "Other" && (
          <TextInput
            style={[styles.input, styles.customReasonInput]}
            value={customReason}
            onChangeText={setCustomReason}
            placeholder="Please specify the reason..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            autoFocus={true}
          />
        )}

        {showBudgetInput && (
          <TextInput
            style={[styles.input, styles.budgetInput]}
            value={budget}
            onChangeText={setBudget}
            placeholder="Enter the budget/price (e.g., $500)"
            keyboardType="default"
            autoFocus={true}
          />
        )}

        <View style={styles.deleteModalActions}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.deleteConfirmButton]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteConfirmButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function AdManagement() {
  const user = useSelector((state) => state.auth.user);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [deletingAd, setDeletingAd] = useState(null);

  const categories = ["Cars", "Bike"];

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const response = await axios.get(
        `https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rent/user/${user.id}`
      );
      const data = response.data;
      setAds(data.rents);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAds();
    setRefreshing(false);
  }, []);

  const openCreateModal = () => {
    setEditingAd(null);
    setModalVisible(true);
  };

  const openEditModal = (ad) => {
    setEditingAd(ad);
    setModalVisible(true);
  };

  const openDeleteModal = (ad) => {
    setDeletingAd(ad);
    setDeleteModalVisible(true);
  };

  const handleSaveAd = async (adData) => {
    console.log("Saving ad data:", adData);

    try {
      const newAd = {
        ...adData,
        userId: user.id,
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
        setAds(ads?.map((ad) => (ad.id === editingAd.id ? newAd : ad)));
        Alert.alert("Success", "Ad updated successfully!");
      } else {
        // Create new ad
        const data = await axios.post(
          "https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rent",
          newAd
        );
        console.log(data);
        setAds([newAd, ...ads]);
        Alert.alert("Success", "Ad created successfully!");
      }

      setModalVisible(false);
    } catch (error) {
      console.error("Error saving ad:", error);
      Alert.alert("Error", "Failed to save ad");
    }
  };

  const handleDeleteAd = async (reason) => {
    try {
      const data = await axios.post(
        `https://d6elp5bdgrgthejqpor3ihwnsu.srv.us/api/rent/delete/${deletingAd._id}`,
        {
          reason,
        }
      );
      console.log(data.data);
      setAds(ads?.filter((ad) => ad.id !== deletingAd.id));
      Alert.alert("Success", "Ad deleted successfully!");
      setDeleteModalVisible(false);
      setDeletingAd(null);
    } catch (error) {
      console.error("Error deleting ad:", error);
      Alert.alert("Error", "Failed to delete ad");
    }
  };

  const AdCard = ({ ad }) => (
    <View style={styles.adCard}>
      <View style={styles.adHeader}>
        <View style={styles.adImageContainer}>
          <Image
            source={{
              uri:
                ad.imageUrl ||
                ad.images?.[0] ||
                "https://via.placeholder.com/100x80",
            }}
            style={styles.adImage}
          />
        </View>
        <View style={styles.adInfo}>
          <Text style={styles.adTitle}>{ad.title}</Text>
          <Text style={styles.adPrice}>PKR {ad.price}</Text>
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

      <View style={styles.adMeta}>
        <Text style={styles.adDate}>Created: {ad.createdAt}</Text>
      </View>

      <Text style={styles.adDescription} numberOfLines={2}>
        {ad.description}
      </Text>

      <View style={styles.adActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(ad)}
        >
          <Text style={styles.actionButtonText}>✏️ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => openDeleteModal(ad)}
        >
          <Text style={styles.actionButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
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
          <Text style={styles.createButtonText}>✨ Create Ad</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ads.length}</Text>
          <Text style={styles.statLabel}>Total Ads</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {ads?.filter((ad) => ad.status === "active").length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      <ScrollView
        style={styles.adsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0084ff"]}
            tintColor="#0084ff"
          />
        }
      >
        {ads?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateText}>No ads found</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first ad to get started!
            </Text>
          </View>
        ) : (
          ads?.map((ad) => <AdCard key={ad.title} ad={ad} />)
        )}
      </ScrollView>

      <CreateEditModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveAd}
        editingAd={editingAd}
        categories={categories}
      />

      <DeleteReasonModal
        isVisible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeletingAd(null);
        }}
        onDelete={handleDeleteAd}
      />
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
  },
  createButton: {
    backgroundColor: "#0084ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#0084ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 8,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0084ff",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
  },
  adsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  adCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  adHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  adImageContainer: {
    marginRight: 16,
  },
  adImage: {
    width: 90,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  adInfo: {
    flex: 1,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },
  adPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0084ff",
    marginBottom: 4,
  },
  adCategory: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 2,
    fontWeight: "500",
  },
  adLocation: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  adStatus: {
    alignItems: "flex-end",
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "700",
  },
  adMeta: {
    marginBottom: 12,
  },
  adDate: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  adDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 20,
  },
  adActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButton: {
    backgroundColor: "#0084ff",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    padding: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
  // Modal Styles
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get("window").height * 0.9,
    minHeight: Dimensions.get("window").height * 0.6,
  },
  modalHeader: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 10,
  },
  modalHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
  },
  modalTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    backgroundColor: "#f3f4f6",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#6b7280",
    fontWeight: "300",
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalBodyContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 24,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    minHeight: 50,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  imagePreviewContainer: {
    marginBottom: 24,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    resizeMode: "cover",
  },
  categoryContainer: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 12,
  },
  selectedCategory: {
    backgroundColor: "#0084ff",
  },
  categoryText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  saveButton: {
    backgroundColor: "#0084ff",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Add these styles to your existing StyleSheet.create() object:

  deleteModal: {
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  deleteModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  deleteModalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  reasonInput: {
    height: 100,
    textAlignVertical: "top",
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  deleteConfirmButton: {
    backgroundColor: "#ef4444",
  },
  deleteConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Add these styles to your existing StyleSheet.create() object:

  reasonsContainer: {
    maxHeight: 250,
    marginBottom: 20,
  },
  reasonOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedReasonOption: {
    backgroundColor: "#e0f2fe",
    borderColor: "#0084ff",
  },
  reasonOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedRadioButton: {
    borderColor: "#0084ff",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0084ff",
  },
  reasonText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  selectedReasonText: {
    color: "#0084ff",
    fontWeight: "600",
  },
  customReasonInput: {
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  budgetInput: {
    marginBottom: 20,
  },
});
