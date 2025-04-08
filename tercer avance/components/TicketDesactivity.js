import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const TicketDesactivity = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Obtener tickets sin asignar
  useEffect(() => {
    const fetchNonAssignedTickets = async () => {
      try {
        const ticketsRef = collection(db, "Ticket");
        const q = query(
          ticketsRef,
          where("technicalName", "==", null),
          where("status", "==", "Open"),
          where("priority", "==", null),
        );

        const querySnapshot = await getDocs(q);
        const ticketsData = [];

        querySnapshot.forEach((doc) => {
          ticketsData.push({ id: doc.id, ...doc.data() });
        });

        setTickets(ticketsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tickets: ", err);
        setError("Error al cargar los tickets");
        setLoading(false);
      }
    };

    fetchNonAssignedTickets();
  }, []);

  const handleDesactivateTicket = async () => {
    if (!selectedTicket) return;

    setUpdating(true);
    try {
      const ticketRef = doc(db, "Ticket", selectedTicket.id);

      await updateDoc(ticketRef, {
        status: "Denied",
        dateFinished: serverTimestamp(),
      });

      // Actualizar la lista local
      setTickets(tickets.filter((t) => t.id !== selectedTicket.id));
      setModalVisible(false);
    } catch (err) {
      console.error("Error desactivating ticket: ", err);
      setError("Error al desactivar el ticket");
    } finally {
      setUpdating(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => {
        setSelectedTicket(item);
        setModalVisible(true);
      }}
    >
      <Text style={styles.ticketId}>Ticket #{item.ticketId || "N/A"}</Text>
      <Text style={styles.ticketText}>Equipo: {item.affectedEquipment}</Text>
      <Text style={styles.ticketText}>Problema: {item.problemType}</Text>
      <Text style={styles.ticketText}>Ubicación: {item.location}</Text>
      <Text style={styles.ticketText}>
        Estado: {item.status || "No asignado"}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tickets sin asignar (para desactivar)</Text>

      {tickets.length === 0 ? (
        <Text style={styles.noTicketsText}>No hay tickets sin asignar</Text>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal para confirmar desactivación */}
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
                <Text style={styles.modalTitle}>Desactivar Ticket</Text>
                <Text style={styles.ticketInfo}>
                  ¿Está seguro que desea desactivar este ticket?
                </Text>
                <Text style={styles.ticketInfo}>
                  Ticket #{selectedTicket.ticketId}
                </Text>
                <Text style={styles.ticketInfo}>
                  Problema: {selectedTicket.problemType}
                </Text>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                    disabled={updating}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.desactivateButton]}
                    onPress={handleDesactivateTicket}
                    disabled={updating}
                  >
                    {updating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Desactivar</Text>
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  ticketCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketId: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3498db",
    marginBottom: 5,
  },
  ticketText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 3,
  },
  noTicketsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
  },
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
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    padding: 12,
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
  },
  desactivateButton: {
    backgroundColor: "#f39c12",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default TicketDesactivity;
