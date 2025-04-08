import React, { useState, useContext, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useTechnicianTickets } from "../hooks/useTechnicianTickets";
import { useAllTickets } from "../hooks/useAdminTickets";
import { AuthContext } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const TicketScreen = () => {
  const { userEmail, userType } = useContext(AuthContext);
  const isTechnician = userEmail && userType === 1;
  const isBoss = userEmail && userType === 2;

  const navigation = useNavigation();
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  // Estados para la asignación de tickets
  const [technicians, setTechnicians] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [updating, setUpdating] = useState(false);
  const [loadingTechs, setLoadingTechs] = useState(false);

  const { tickets, loading, error } = isTechnician
    ? useTechnicianTickets(userEmail)
    : useAllTickets();

  // Obtener técnicos para el jefe
  useEffect(() => {
    if (isBoss) {
      const fetchTechnicians = async () => {
        setLoadingTechs(true);
        try {
          const techsRef = collection(db, "Technical");
          const techsQuery = query(techsRef);
          const techsSnapshot = await getDocs(techsQuery);

          const techsData = techsSnapshot.docs.map((doc) => {
            const techData = doc.data();
            return {
              id: doc.id,
              uid: doc.id,
              fullName: `${techData.firstName} ${techData.lastName}`,
              ...techData,
            };
          });
          setTechnicians(techsData);
        } catch (err) {
          console.error("Error fetching technicians: ", err);
        } finally {
          setLoadingTechs(false);
        }
      };

      fetchTechnicians();
    }
  }, [isBoss]);

  const navigateToDetails = (ticket) => {
    navigation.navigate("Ticket Details", { ticket });
  };

  const navigateCompleteTicket = (ticket) => {
    navigation.navigate("Ticket Complete", { ticket });
  };

  const handleAssignTicket = (ticket) => {
    setSelectedTicket(ticket);
    setModalVisible(true);
  };

  const handleDenyTicket = async (ticket) => {
    setUpdating(true);
    try {
      const ticketRef = doc(db, "Ticket", ticket.id);
      await updateDoc(ticketRef, {
        status: "Denied",
        technicalEmail: null,
        technicalName: null,
      });
    } catch (err) {
      console.error("Error denying ticket: ", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleReactivateTicket = async (ticket) => {
    setUpdating(true);
    try {
      const ticketRef = doc(db, "Ticket", ticket.id);
      await updateDoc(ticketRef, {
        status: "Open",
        dateFinished: null,
      });
    } catch (err) {
      console.error("Error reactivating ticket: ", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTicket || !selectedTechnician) return;

    setUpdating(true);
    try {
      const tech = technicians.find((t) => t.fullName === selectedTechnician);

      if (!tech) {
        throw new Error("Técnico no encontrado");
      }

      const ticketRef = doc(db, "Ticket", selectedTicket.id);

      await updateDoc(ticketRef, {
        technicalName: tech.fullName,
        technicalEmail: tech.email,
        dateFinished: null,
        priority,
        status: "Open",
        assignedDate: new Date(),
      });

      // Cerrar modal y resetear estados
      setModalVisible(false);
      setSelectedTechnician("");
      setPriority("Medium");
    } catch (err) {
      console.error("Error assigning technician: ", err);
    } finally {
      setUpdating(false);
    }
  };

  // Resto del código de ordenamiento y formato permanece igual...
  const sortTickets = (tickets = [], field, direction) => {
    const safeTickets = [...(tickets || [])];

    return safeTickets.sort((a, b) => {
      let comparison = 0;

      if (field === "date") {
        const dateA = a?.dateCreated?.seconds
          ? new Date(a.dateCreated.seconds * 1000)
          : new Date(0);
        const dateB = b?.dateCreated?.seconds
          ? new Date(b.dateCreated.seconds * 1000)
          : new Date(0);
        comparison = dateB - dateA;
      } else if (field === "location") {
        comparison = String(a?.location ?? "").localeCompare(
          String(b?.location ?? ""),
        );
      } else if (field === "id") {
        comparison = String(a?.ticketId ?? "").localeCompare(
          String(b?.ticketId ?? ""),
        );
      } else if (field === "status") {
        comparison = String(a?.status ?? "").localeCompare(
          String(b?.status ?? ""),
        );
      }

      return direction === "asc" ? comparison : -comparison;
    });
  };

  const filteredTickets = useMemo(() => {
    if (userType === 2) {
      return tickets || [];
    } else {
      return (tickets || []).filter((ticket) => ticket.status === "Open");
    }
  }, [tickets, userType]);

  const sortedTickets = useMemo(
    () => sortTickets(filteredTickets, sortField, sortDirection),
    [filteredTickets, sortField, sortDirection],
  );

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      if (typeof date === "object" && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const statusStyles = {
    Open: styles.statusOpen,
    Resolved: styles.statusResolved,
    Denied: styles.statusDenied,
    Closed: styles.statusClosed,
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.sortControls}>
        <View style={styles.sortFieldContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <Picker
            selectedValue={sortField}
            style={styles.picker}
            onValueChange={setSortField}
          >
            <Picker.Item label="Ticket No." value="id" />
            <Picker.Item label="Date" value="date" />
            <Picker.Item label="Location" value="location" />
            <Picker.Item label="Status" value="status" />
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.sortDirectionButton}
          onPress={toggleSortDirection}
        >
          <Ionicons
            name={sortDirection === "asc" ? "arrow-up" : "arrow-down"}
            size={20}
            color="#1E3A8A"
          />
          <Text style={styles.sortDirectionText}>
            {sortDirection === "asc" ? "Ascending" : "Descending"}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <FlatList
          data={sortedTickets}
          keyExtractor={(item) => item.ticketId || item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket" size={40} color="#CBD5E0" />
              <Text style={styles.emptyText}>
                {isTechnician
                  ? "No open tickets assigned to you"
                  : "No open tickets in the system"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketNumber}>
                  #{item.ticketId || "N/A"}
                </Text>
                <TouchableOpacity
                  onPress={() => navigateToDetails(item)}
                  style={styles.detailsButton}
                >
                  <Ionicons name="information-circle" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.ticketBody}>
                <View style={styles.ticketRow}>
                  <Ionicons name="location" size={14} color="#4B5563" />
                  <Text style={styles.ticketText}>
                    {item.location || "No location specified"}
                  </Text>
                </View>
                <View style={styles.ticketRow}>
                  <Ionicons name="cube" size={14} color="#4B5563" />
                  <Text style={styles.ticketText}>
                    {item.affectedEquipment || "No equipment specified"}
                  </Text>
                </View>

                <View style={styles.ticketRow}>
                  <Ionicons name="calendar" size={14} color="#4B5563" />
                  <Text style={styles.ticketText}>
                    {formatDate(item.dateCreated)}
                  </Text>
                </View>

                <View style={styles.ticketRow}>
                  <Ionicons name="build" size={14} color="#4B5563" />
                  <Text style={styles.ticketText}>
                    {item.problemType || "Not specified"}
                  </Text>
                </View>

                {!isTechnician && (
                  <View style={styles.ticketRow}>
                    <Ionicons name="person" size={14} color="#4B5563" />
                    <Text style={styles.ticketText}>
                      {item.technicalName || "Unassigned"}
                    </Text>
                  </View>
                )}

                <View style={[styles.ticketRow, styles.statusRow]}>
                  <View
                    style={[
                      styles.statusIndicator,
                      statusStyles[item.status] || styles.statusClosed,
                    ]}
                  />
                  <Text style={styles.ticketText}>
                    Status: {item.status || "Pending"}
                  </Text>
                </View>
              </View>

              <View style={styles.buttonGroup}>
                {isTechnician && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => navigateCompleteTicket(item)}
                  >
                    <Text style={styles.completeButtonText}>
                      Complete Ticket
                    </Text>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#fff"
                      style={styles.completeButtonIcon}
                    />
                  </TouchableOpacity>
                )}

                {isBoss && (
                  <>
                    {item.status === "Denied" && item.status !== "Resolved" ? (
                      <TouchableOpacity
                        style={styles.reactivateButton}
                        onPress={() => handleReactivateTicket(item)}
                        disabled={updating}
                      >
                        <Text style={styles.buttonText}>Reactivate</Text>
                        <Ionicons
                          name="refresh"
                          size={16}
                          color="#fff"
                          style={styles.buttonIcon}
                        />
                      </TouchableOpacity>
                    ) : item.status !== "Resolved" &&
                      item.status !== "Denied" ? (
                      <TouchableOpacity
                        style={styles.denyButton}
                        onPress={() => handleDenyTicket(item)}
                        disabled={updating}
                      >
                        <Text style={styles.buttonText}>Deny</Text>
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color="#fff"
                          style={styles.buttonIcon}
                        />
                      </TouchableOpacity>
                    ) : null}

                    {!item.technicalName &&
                      item.status !== "Denied" &&
                      item.status !== "Resolved" && (
                        <TouchableOpacity
                          style={styles.assignButton}
                          onPress={() => handleAssignTicket(item)}
                          disabled={updating}
                        >
                          <Text style={styles.assignButtonText}>Assign</Text>
                          <Ionicons
                            name="person-add"
                            size={16}
                            color="#fff"
                            style={styles.assignButtonIcon}
                          />
                        </TouchableOpacity>
                      )}
                  </>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* Modal para asignar técnico */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedTicket && (
              <>
                <Text style={styles.modalTitle}>Assign Technician</Text>
                <Text style={styles.ticketInfo}>
                  Ticket #{selectedTicket.ticketId}
                </Text>
                <Text style={styles.ticketInfo}>
                  Problem: {selectedTicket.problemType}
                </Text>

                <Text style={styles.priorityLabel}>Technician:</Text>
                <Picker
                  selectedValue={selectedTechnician}
                  style={styles.pickerModal}
                  onValueChange={(itemValue) =>
                    setSelectedTechnician(itemValue)
                  }
                >
                  <Picker.Item label="Select a technician" value="" />
                  {technicians.map((tech) => (
                    <Picker.Item
                      key={tech.id}
                      label={tech.fullName}
                      value={tech.fullName}
                    />
                  ))}
                </Picker>

                <Text style={styles.priorityLabel}>Priority:</Text>
                <Picker
                  selectedValue={priority}
                  style={styles.pickerModal}
                  onValueChange={(itemValue) => setPriority(itemValue)}
                >
                  <Picker.Item label="Low" value="Low" />
                  <Picker.Item label="Medium" value="Medium" />
                  <Picker.Item label="High" value="High" />
                </Picker>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                    disabled={updating}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleAssignTechnician}
                    disabled={!selectedTechnician || updating}
                  >
                    {updating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.modalButtonText}>Assign</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Estilos anteriores permanecen igual...
  screenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  sortControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sortFieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  sortLabel: {
    fontFamily: "Poppins-SemiBold",
    color: "#4B5563",
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sortDirectionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  sortDirectionText: {
    marginLeft: 6,
    fontFamily: "Poppins-Medium",
    color: "#1E3A8A",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#B91C1C",
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#1E3A8A",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  ticketNumber: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#1E3A8A",
  },
  detailsButton: {
    backgroundColor: "#FFC107",
    padding: 8,
    borderRadius: 6,
  },
  ticketBody: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  ticketText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#4B5563",
    flex: 1,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusOpen: {
    backgroundColor: "#10B981",
  },
  statusResolved: {
    backgroundColor: "rgb(184 184 184)",
  },
  statusDenied: {
    backgroundColor: "#EF4444",
  },
  statusClosed: {
    backgroundColor: "#FF0000",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  completeButton: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    marginRight: 8,
  },
  completeButtonIcon: {
    marginLeft: 4,
  },
  assignButton: {
    backgroundColor: "#10B981",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  assignButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    marginRight: 8,
  },
  assignButtonIcon: {
    marginLeft: 4,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  denyButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  reactivateButton: {
    backgroundColor: "#10B981",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  // Estilos para el modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  ticketInfo: {
    fontSize: 16,
    marginBottom: 10,
    color: "#555",
  },
  priorityLabel: {
    height: 40,
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
  },
  pickerModal: {
    height: 55,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
  },
  confirmButton: {
    backgroundColor: "#2ecc71",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default TicketScreen;
