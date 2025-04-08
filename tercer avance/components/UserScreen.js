import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
  Platform,
} from "react-native";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import CustomAlertModal from "./CustomAlertModal";

const UsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState([]);
  const [loading, setLoading] = useState({
    users: true,
    technicians: true,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editable, setEditable] = useState(false);
  const [role, setRole] = useState("Employee");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    isConfirmation: false,
  });

  const showCustomAlert = (title, message, isConfirmation = false) => {
    setAlertConfig({
      title,
      message,
      isConfirmation,
    });
    setShowAlert(true);
  };

  const handleAlertConfirm = async () => {
    setShowAlert(false);
    if (alertConfig.title === "Confirm Status Change") {
      await toggleUserStatus();
      setModalVisible(false);
    }
  };

  const handleAlertCancel = () => {
    setShowAlert(false);
  };

  const fetchUsers = async () => {
    try {
      setLoading((prev) => ({ ...prev, users: true }));
      const querySnapshot = await getDocs(collection(db, "User"));
      const userList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isActive: doc.data().status !== "inactive",
        role: doc.data().role || "Employee",
      }));
      setUsers(userList);
      applyFilters(userList, technicians);
    } catch (error) {
      console.error("Error fetching users:", error);
      showCustomAlert("Error", "Failed to load users");
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  const fetchTechnicians = async () => {
    try {
      setLoading((prev) => ({ ...prev, technicians: true }));
      const querySnapshot = await getDocs(collection(db, "Technical"));
      const technicianList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isActive: doc.data().status !== "inactive",
        role: doc.data().role || "Technician",
      }));
      setTechnicians(technicianList);
      applyFilters(users, technicianList);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      showCustomAlert("Error", "Failed to load technicians");
    } finally {
      setLoading((prev) => ({ ...prev, technicians: false }));
    }
  };

  const applyFilters = (usersData, techniciansData) => {
    const filteredBySearch = (data) => {
      if (searchQuery.trim() === "") return data;
      const lowerCaseQuery = searchQuery.toLowerCase();
      return data.filter((item) =>
        item.email?.toLowerCase().includes(lowerCaseQuery),
      );
    };

    const filteredByStatus = (data) => {
      switch (statusFilter) {
        case "active":
          return data.filter((item) => item.isActive);
        case "inactive":
          return data.filter((item) => !item.isActive);
        default:
          return data;
      }
    };

    const filteredUsers = filteredByStatus(filteredBySearch(usersData));
    const filteredTechs = filteredByStatus(filteredBySearch(techniciansData));

    setFilteredUsers(filteredUsers);
    setFilteredTechnicians(filteredTechs);
  };

  useEffect(() => {
    fetchUsers();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (users.length > 0 || technicians.length > 0) {
      applyFilters(users, technicians);
    }
  }, [searchQuery, statusFilter, users, technicians]);

  const openModal = (user) => {
    setSelectedUser(user);
    setRole(user.role || "Employee");
    setEditable(false);
    setModalVisible(true);
  };

  const toggleEdit = async () => {
    if (editable) {
      if (role === "Technician" && selectedUser.role !== "Technician") {
        try {
          await deleteDoc(doc(db, "User", selectedUser.id));
          await setDoc(doc(db, "Technical", selectedUser.id), {
            ...selectedUser,
            role: "Technician",
          });
          await fetchUsers();
          await fetchTechnicians();
        } catch (error) {
          console.error("Error moving user:", error);
          showCustomAlert("Error", "Failed to change user role");
        }
      }
    }
    setEditable(!editable);
  };

  const toggleUserStatus = async () => {
    try {
      const collectionName =
        selectedUser.role === "Technician" ? "Technical" : "User";
      const newStatus = selectedUser.isActive ? "inactive" : "active";

      await updateDoc(doc(db, collectionName, selectedUser.id), {
        status: newStatus,
      });

      if (selectedUser.role === "Technician") {
        await fetchTechnicians();
      } else {
        await fetchUsers();
      }

      setModalVisible(false);
    } catch (error) {
      console.error("Error toggling user status:", error);
      showCustomAlert("Error", "Failed to update user status");
    }
  };

  const confirmStatusChange = () => {
    setModalVisible(false);
    showCustomAlert(
      "Confirm Status Change",
      `Are you sure you want to ${selectedUser.isActive ? "deactivate" : "activate"} this user?`,
      true,
    );
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)}>
      <View style={[styles.card, !item.isActive && styles.inactiveCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>
            {item.firstName || "No name available"} {item.lastName || ""}
          </Text>
          <View
            style={[
              styles.roleBadge,
              item.role === "Technician" ? styles.techBadge : styles.empBadge,
            ]}
          >
            <Text style={styles.roleBadgeText}>{item.role || "Employee"}</Text>
          </View>
        </View>
        <Text style={styles.email}>{item.email || "No email"}</Text>
        {!item.isActive && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTechnicianItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)}>
      <View
        style={[
          styles.card,
          styles.techCard,
          !item.isActive && styles.inactiveCard,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.name, styles.techName]}>
            {item.firstName} {item.lastName}
          </Text>
          <View style={[styles.roleBadge, styles.techBadge]}>
            <Text style={styles.roleBadgeText}>Technician</Text>
          </View>
        </View>
        <Text style={styles.email}>{item.email}</Text>
        {!item.isActive && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CustomAlertModal
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
        isConfirmation={alertConfig.isConfirmation}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "users" && styles.activeTab]}
          onPress={() => setActiveTab("users")}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={activeTab === "users" ? "#1E3A8A" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "users" && styles.activeTabText,
            ]}
          >
            Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "technicians" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("technicians")}
        >
          <Ionicons
            name="construct-outline"
            size={20}
            color={activeTab === "technicians" ? "#1E3A8A" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "technicians" && styles.activeTabText,
            ]}
          >
            Technicians
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.filterRow}>
          <Text style={styles.title}>
            {activeTab === "users" ? "User List" : "Technician List"}
          </Text>

          <View style={styles.statusFilterContainer}>
            <TouchableOpacity
              style={[
                styles.statusFilterButton,
                statusFilter === "all" && styles.activeStatusFilter,
              ]}
              onPress={() => setStatusFilter("all")}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === "all" && styles.activeStatusFilterText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusFilterButton,
                statusFilter === "active" && styles.activeStatusFilter,
              ]}
              onPress={() => setStatusFilter("active")}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === "active" && styles.activeStatusFilterText,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusFilterButton,
                statusFilter === "inactive" && styles.activeStatusFilter,
              ]}
              onPress={() => setStatusFilter("inactive")}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === "inactive" && styles.activeStatusFilterText,
                ]}
              >
                Inactive
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#64748B"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by email..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <Ionicons name="close-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {loading.users && activeTab === "users" ? (
          <ActivityIndicator
            size="large"
            color="#FFC107"
            style={styles.loader}
          />
        ) : loading.technicians && activeTab === "technicians" ? (
          <ActivityIndicator
            size="large"
            color="#FFC107"
            style={styles.loader}
          />
        ) : activeTab === "users" && filteredUsers.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No users found matching your criteria"
              : statusFilter === "active"
                ? "No active users available"
                : statusFilter === "inactive"
                  ? "No inactive users available"
                  : "No users available"}
          </Text>
        ) : activeTab === "technicians" && filteredTechnicians.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No technicians found matching your criteria"
              : statusFilter === "active"
                ? "No active technicians available"
                : statusFilter === "inactive"
                  ? "No inactive technicians available"
                  : "No technicians available"}
          </Text>
        ) : (
          <FlatList
            data={activeTab === "users" ? filteredUsers : filteredTechnicians}
            keyExtractor={(item) => item.id}
            renderItem={
              activeTab === "users" ? renderUserItem : renderTechnicianItem
            }
            contentContainerStyle={styles.listContent}
            style={styles.list}
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedUser && (
              <>
                <View style={styles.profileHeader}>
                  <View style={styles.profileImageContainer}>
                    <Ionicons
                      name="person-circle-outline"
                      size={80}
                      color="#1E3A8A"
                    />
                    {!selectedUser.isActive && (
                      <View style={styles.profileInactiveOverlay}>
                        <Text style={styles.profileInactiveText}>INACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.profileName}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Text>
                  <Text style={styles.profileEmail}>{selectedUser.email}</Text>
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Phone:</Text>
                    <Text style={styles.infoText}>
                      {selectedUser.phone || "Not specified"}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Status:</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        selectedUser.isActive
                          ? styles.activeBadge
                          : styles.inactiveBadge,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {selectedUser.isActive ? "ACTIVE" : "INACTIVE"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Role:</Text>
                    {editable ? (
                      <View style={styles.rolePickerContainer}>
                        <Picker
                          selectedValue={role}
                          onValueChange={setRole}
                          style={styles.rolePicker}
                          dropdownIconColor="#1E3A8A"
                        >
                          <Picker.Item label="Employee" value="Employee" />
                          <Picker.Item
                            label="Technician"
                            value="Technician"
                            enabled={
                              selectedUser.role === "Employee" ||
                              !selectedUser.role
                            }
                          />
                        </Picker>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.roleBadge,
                          selectedUser.role === "Technician"
                            ? styles.techBadge
                            : styles.empBadge,
                          styles.modalBadge,
                        ]}
                      >
                        <Text style={styles.roleBadgeText}>
                          {selectedUser.role || "Employee"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.statusButton,
                      selectedUser.isActive
                        ? styles.deactivateButton
                        : styles.activateButton,
                    ]}
                    onPress={confirmStatusChange}
                  >
                    <Text style={styles.buttonText}>
                      {selectedUser.isActive ? "DEACTIVATE" : "ACTIVATE"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      editable ? styles.saveButton : styles.editButton,
                      selectedUser.role === "Technician" &&
                        styles.disabledButton,
                    ]}
                    onPress={toggleEdit}
                    disabled={selectedUser.role === "Technician"}
                  >
                    <Text style={styles.buttonText}>
                      {editable ? "CONFIRM" : "CHANGE ROLE"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.closeButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>CLOSE</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    padding: 20,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    flexWrap: "wrap",
  },
  statusFilterContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    padding: 2,
    marginTop: Platform.select({ web: 0, default: 10 }),
  },
  statusFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activeStatusFilter: {
    backgroundColor: "#1E3A8A",
  },
  statusFilterText: {
    fontSize: 14,
    color: "#64748B",
  },
  activeStatusFilterText: {
    color: "#FFFFFF",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    ...Platform.select({
      web: {
        position: "sticky",
        top: 0,
        zIndex: 100,
      },
    }),
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#EFF6FF",
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#1E3A8A",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginRight: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 20,
    textAlign: "center",
  },
  loader: {
    marginTop: 20,
  },
  list: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginVertical: 8,
    ...Platform.select({
      web: {
        width: "100%",
        maxWidth: "100%",
      },
      default: {
        width: Dimensions.get("window").width - 40,
      },
    }),
    position: "relative",
  },
  inactiveCard: {
    opacity: 0.8,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  techCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
  },
  techName: {
    color: "#1E3A8A",
  },
  email: {
    fontSize: 14,
    color: "#64748B",
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  empBadge: {
    backgroundColor: "#E2E8F0",
  },
  techBadge: {
    backgroundColor: "#1E3A8A",
  },
  modalBadge: {
    alignSelf: "flex-end",
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inactiveBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "#16A34A",
  },
  inactiveBadge: {
    backgroundColor: "#DC2626",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileInactiveOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(220, 38, 38, 0.8)",
    padding: 4,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileInactiveText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: Platform.OS === "web" ? "40%" : "90%",
    maxWidth: 500,
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    ...Platform.select({
      web: {
        width: "50%",
        maxWidth: 600,
      },
    }),
  },
  infoSection: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    minHeight: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    width: "30%",
  },
  infoText: {
    fontSize: 16,
    color: "#334155",
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 15,
  },
  rolePickerContainer: {
    flex: 1,
    marginLeft: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    justifyContent: "center",
    height: 55,
    backgroundColor: "#F8FAFC",
  },
  rolePicker: {
    width: "100%",
    height: "100%",
  },
  actionButtons: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  button: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  editButton: {
    backgroundColor: "#1E3A8A",
  },
  saveButton: {
    backgroundColor: "#16A34A",
  },
  closeButton: {
    backgroundColor: "#DC2626",
  },
  statusButton: {
    marginRight: 10,
  },
  deactivateButton: {
    backgroundColor: "#DC2626",
  },
  activateButton: {
    backgroundColor: "#16A34A",
  },
  disabledButton: {
    backgroundColor: "#94A3B8",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default UsersScreen;
