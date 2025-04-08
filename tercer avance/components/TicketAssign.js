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
import { Picker } from "@react-native-picker/picker";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const TicketAssign = () => {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [updating, setUpdating] = useState(false);

  // Obtener tickets sin asignar y técnicos
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener técnicos
        const techsRef = collection(db, "Technical");
        const techsQuery = query(techsRef);
        const techsSnapshot = await getDocs(techsQuery);

        const techsData = techsSnapshot.docs.map((doc) => {
          const techData = doc.data();
          return {
            id: doc.id,
            uid: doc.id, // Agregamos el UID del documento
            fullName: `${techData.firstName} ${techData.lastName}`,
            ...techData,
          };
        });
        setTechnicians(techsData);
        setLoadingTechs(false);

        // Obtener y filtrar tickets
        const ticketsRef = collection(db, "Ticket");
        const ticketsQuery = query(
          ticketsRef,
          where("technicalName", "==", null),
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);

        const ticketsData = ticketsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((ticket) => !ticket.status || ticket.status == "Open");

        setTickets(ticketsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data: ", err);
        setError("Error al cargar los datos");
        setLoading(false);
        setLoadingTechs(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignTechnician = async () => {
    if (!selectedTicket || !selectedTechnician) return;

    setUpdating(true);
    try {
      // Encontrar el técnico seleccionado
      const tech = technicians.find((t) => t.fullName === selectedTechnician);

      if (!tech) {
        throw new Error("Técnico no encontrado");
      }

      const ticketRef = doc(db, "Ticket", selectedTicket.id);

      await updateDoc(ticketRef, {
        technicalName: tech.fullName, // Guardamos el nombre completo
        technicalEmail: tech.email, // Asumiendo que existe campo email
        dateFinished: null,
        priority,
        status: "Open",
        assignedDate: new Date(),
      });

      // Actualizar la lista local
      setTickets(tickets.filter((t) => t.id !== selectedTicket.id));
      setModalVisible(false);
      setSelectedTechnician("");
      setPriority("Medium");
    } catch (err) {
      console.error("Error assigning technician: ", err);
      setError("Error al asignar técnico");
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
      <Text style={styles.ticketText}>
        Prioridad: {item.priority || "No especificada"}
      </Text>
    </TouchableOpacity>
  );

  if (loading || loadingTechs) {
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
      <Text style={styles.header}>Tickets sin asignar</Text>

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
                <Text style={styles.modalTitle}>Asignar Técnico</Text>
                <Text style={styles.ticketInfo}>
                  Ticket #{selectedTicket.ticketId}
                </Text>
                <Text style={styles.ticketInfo}>
                  Problema: {selectedTicket.problemType}
                </Text>

                <Text style={styles.priorityLabel}>Técnico:</Text>
                <Picker
                  selectedValue={selectedTechnician}
                  style={styles.picker}
                  onValueChange={(itemValue) =>
                    setSelectedTechnician(itemValue)
                  }
                >
                  <Picker.Item label="Seleccione un técnico" value="" />
                  {technicians.map((tech) => (
                    <Picker.Item
                      key={tech.id}
                      label={tech.fullName}
                      value={tech.fullName}
                    />
                  ))}
                </Picker>

                <Text style={styles.priorityLabel}>Prioridad:</Text>
                <Picker
                  selectedValue={priority}
                  style={styles.picker}
                  onValueChange={(itemValue) => setPriority(itemValue)}
                >
                  <Picker.Item label="Baja" value="Low" />
                  <Picker.Item label="Media" value="Medium" />
                  <Picker.Item label="Alta" value="High" />
                </Picker>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                    disabled={updating}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.assignButton]}
                    onPress={handleAssignTechnician}
                    disabled={!selectedTechnician || updating}
                  >
                    {updating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Asignar</Text>
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

// Estilos (se mantienen iguales)
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
  },
  priorityLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  assignButton: {
    backgroundColor: "#2ecc71",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default TicketAssign;
