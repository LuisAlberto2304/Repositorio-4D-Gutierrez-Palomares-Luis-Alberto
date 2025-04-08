import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { TabView, TabBar, SceneMap } from "react-native-tab-view";
import "../firebaseConfig";
import { useGetLocation } from "../hooks/useGetLocation";
import { AuthContext } from "../context/AuthContext";
import LocationAdd from "./LocationAdd";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import CustomAlertModal from "./CustomAlertModal";

const initialLayout = { width: Dimensions.get("window").width };

const ActiveLocationsTab = ({
  locations,
  loading,
  error,
  handleLocationSelect,
  isBoss,
  refreshLocations,
}) => {
  const [search, setSearch] = useState("");
  const [filteredLocations, setFilteredLocations] = useState([]);

  useEffect(() => {
    setFilteredLocations(locations.filter((loc) => !loc.deleted));
  }, [locations]);

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = locations.filter(
      (location) =>
        location.nameLocal.toLowerCase().includes(text.toLowerCase()) &&
        !location.deleted,
    );
    setFilteredLocations(filtered);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleLocationSelect(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="location-sharp" size={24} color="#1E3A8A" />
        <Text style={styles.title}>{item.nameLocal}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={16} color="#64748b" />
          <Text style={styles.itemText}>{item.phoneNumber}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name={item.status === "Open" ? "checkmark-circle" : "close-circle"}
            size={16}
            color={item.status === "Open" ? "#2ecc71" : "#e74c3c"}
          />
          <Text
            style={[
              styles.itemText,
              styles.statusText,
              { color: item.status === "Open" ? "#2ecc71" : "#e74c3c" },
            ]}
          >
            {item.status === "Open" ? "Open" : "Closed"}
          </Text>
        </View>
      </View>

      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#1E3A8A" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.tabContainer}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#64748b"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchBar}
          placeholder="Search by Location..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={40} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLocations}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const AddLocationTab = ({ refreshLocations }) => (
  <ScrollView style={styles.addLocationContainer}>
    <View style={styles.addLocationHeader}>
      <Ionicons name="add-circle" size={28} color="#1E3A8A" />
      <Text style={styles.addLocationTitle}>Add New Location</Text>
    </View>
    <View style={styles.addLocationCard}>
      <LocationAdd onSuccess={refreshLocations} />
    </View>
  </ScrollView>
);

const ManageLocationTab = ({ locations, refreshLocations }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    isConfirmation: false,
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStatusChange = (location, newStatus) => {
    let action =
      newStatus === "Open"
        ? "reactivate"
        : newStatus === "Denied"
          ? "deactivate"
          : "delete";

    setAlertContent({
      title: `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Are you sure you want to ${action} the ${location.nameLocal} location?`,
      onConfirm: () => confirmStatusChange(location, newStatus),
      onCancel: () => setAlertVisible(false),
      isConfirmation: true,
    });
    setAlertVisible(true);
  };

  const confirmStatusChange = async (location, newStatus) => {
    try {
      const locationRef = doc(db, "Location", location.id);
      await updateDoc(locationRef, {
        status: newStatus,
      });

      // Update local state through refresh
      refreshLocations();

      setAlertContent({
        title: "Success",
        message: `The location has been ${
          newStatus === "Open"
            ? "reactivated"
            : newStatus === "Denied"
              ? "deactivated"
              : "deleted"
        } successfully`,
        onConfirm: () => setAlertVisible(false),
        isConfirmation: false,
      });
      setAlertVisible(true);
    } catch (error) {
      console.error("Error updating location:", error);
      setAlertContent({
        title: "Error",
        message: `An error occurred while ${
          newStatus === "Open"
            ? "reactivating"
            : newStatus === "Denied"
              ? "deactivating"
              : "deleting"
        } the location. Please try again.`,
        onConfirm: () => setAlertVisible(false),
        isConfirmation: false,
      });
      setAlertVisible(true);
    }
  };

  return (
    <ScrollView style={styles.manageLocationContainer}>
      <Text style={styles.manageLocationTitle}>Manage Locations</Text>

      {locations.map((location) => (
        <View key={location.id} style={styles.accordionItem}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => toggleExpand(location.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.locationName}>{location.nameLocal}</Text>
            <View style={styles.iconContainer}>
              <FontAwesome
                name={expandedId === location.id ? "minus" : "plus"}
                size={20}
                color="#333"
              />
            </View>
          </TouchableOpacity>

          {expandedId === location.id && (
            <View style={styles.accordionContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>State:</Text>
                <Text style={styles.infoText}>{location.state}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Settlement:</Text>
                <Text style={styles.infoText}>{location.settlement}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoText}>{location.street}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoText}>{location.phoneNumber}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Schedule:</Text>
                <Text style={styles.infoText}>{location.openingHours}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text
                  style={[
                    styles.infoText,
                    location.status === "Open"
                      ? styles.statusOpen
                      : location.status === "Denied"
                        ? styles.statusClosed
                        : styles.statusDeleted,
                  ]}
                >
                  {location.status}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Registered since:</Text>
                <Text style={styles.infoText}>{location.dateRegister}</Text>
              </View>

              <View style={styles.buttonContainer}>
                {location.status !== "Open" && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.activateButton]}
                    onPress={() => handleStatusChange(location, "Open")}
                  >
                    <Text style={styles.actionButtonText}>Reactivate</Text>
                  </TouchableOpacity>
                )}

                {location.status !== "Denied" && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deactivateButton]}
                    onPress={() => handleStatusChange(location, "Denied")}
                  >
                    <Text style={styles.actionButtonText}>Deactivate</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleStatusChange(location, "Deleted")}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}

      <CustomAlertModal
        visible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        onConfirm={alertContent.onConfirm}
        onCancel={alertContent.onCancel}
        isConfirmation={alertContent.isConfirmation}
      />
    </ScrollView>
  );
};

const LocationScreen = () => {
  const { userType } = useContext(AuthContext);
  const isBoss = userType === 2;
  const navigation = useNavigation();

  const { locations, loading, error, fetchAllLocations } = useGetLocation();
  const [index, setIndex] = useState(0);
  const [routes] = useState(
    isBoss
      ? [
          { key: "active", title: "Active" },
          { key: "add", title: "Add" },
          { key: "manage", title: "Manage" },
        ]
      : [{ key: "active", title: "Locations" }],
  );

  const refreshLocations = () => {
    fetchAllLocations();
    if (isBoss) {
      setIndex(0); // Return to Active tab after adding
    }
  };

  useEffect(() => {
    fetchAllLocations();
  }, []);

  const handleLocationSelect = (item) => {
    navigation.navigate("Location Detail", { item });
  };

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: "#1E3A8A",
        height: 3,
      }}
      style={{
        backgroundColor: "#FFFFFF",
        elevation: 2,
      }}
      labelStyle={{
        fontFamily: "Poppins-Medium",
        fontSize: 14,
        textTransform: "capitalize",
        margin: 0,
        padding: 0,
      }}
      activeColor="#1E3A8A"
      inactiveColor="#64748B"
      pressColor="#EFF6FF"
      tabStyle={{
        width: 130,
      }}
    />
  );

  return (
    <View style={styles.screenContainer}>
      {isBoss ? (
        <TabView
          swipeEnabled={false}
          navigationState={{ index, routes }}
          renderScene={({ route }) => {
            switch (route.key) {
              case "active":
                return (
                  <ActiveLocationsTab
                    locations={locations}
                    loading={loading}
                    error={error}
                    handleLocationSelect={handleLocationSelect}
                    isBoss={isBoss}
                    refreshLocations={refreshLocations}
                  />
                );
              case "add":
                return <AddLocationTab refreshLocations={refreshLocations} />;
              case "manage":
                return (
                  <ManageLocationTab
                    locations={locations}
                    refreshLocations={refreshLocations}
                  />
                );
              default:
                return null;
            }
          }}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
          renderTabBar={renderTabBar}
        />
      ) : (
        <ActiveLocationsTab
          locations={locations}
          loading={loading}
          error={error}
          handleLocationSelect={handleLocationSelect}
          isBoss={isBoss}
          refreshLocations={refreshLocations}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  tabContainer: {
    flex: 1,
    margin: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    height: 50,
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#334155",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#1E3A8A",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
    marginLeft: 10,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 8,
  },
  infoContainer: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  itemText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
    marginLeft: 8,
  },
  statusText: {
    fontFamily: "Poppins-Medium",
  },
  arrowContainer: {
    position: "absolute",
    right: 7,
    top: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#e74c3c",
    marginTop: 12,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  addLocationContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  addLocationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  addLocationTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
    marginLeft: 10,
  },
  addLocationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#1E3A8A",
  },
  // Manage Location Tab styles
  manageLocationContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  manageLocationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  accordionItem: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  accordionContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: "bold",
    color: "#555",
    width: "40%",
  },
  infoText: {
    flex: 1,
    color: "#333",
    textAlign: "right",
  },
  statusOpen: {
    color: "green",
  },
  statusClosed: {
    color: "red",
  },
  statusDeleted: {
    color: "gray",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  actionButton: {
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  activateButton: {
    backgroundColor: "#2ecc71",
  },
  deactivateButton: {
    backgroundColor: "#e74c3c",
  },
  deleteButton: {
    backgroundColor: "#7f8c8d",
  },
});

export default LocationScreen;
