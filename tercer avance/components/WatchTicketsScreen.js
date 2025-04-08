import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { db } from "../firebaseConfig"; // Se importa la configuración de Firebase
import { collection, query, where, getDocs } from "firebase/firestore"; // Se importa Firestore

const WatchTicketsScreen = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect para obtener los datos filtrados
  useEffect(() => {
    const obtenerDatosTecnicos = async () => {
      try {
        // Filtrar por campo 'technical' igual a 1
        const q = query(
          collection(db, "Support request"),
          where("technical", "==", "1"),
        );

        const querySnapshot = await getDocs(q);

        // Mapeo solo de los campos específicos
        const listaDatos = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          creation_date: doc.data().creation_date,
          description: doc.data().description,
          equipment: doc.data().equipment,
          priority: doc.data().priority,
          status: doc.data().status,
          technical: doc.data().technical,
          tracking_history: doc.data().tracking_history,
          user: doc.data().user,
        }));

        setDatos(listaDatos);
      } catch (error) {
        console.error("Error al obtener los datos técnicos:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerDatosTecnicos();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Datos Técnicos</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : datos.length === 0 ? (
        <Text style={styles.emptyText}>No hay datos técnicos disponibles</Text>
      ) : (
        <FlatList
          data={datos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // Convertir el timestamp a una fecha legible
            const formattedDate = item.creation_date?.toDate
              ? item.creation_date.toDate().toLocaleDateString()
              : "Fecha no disponible";

            return (
              <View style={styles.card}>
                <Text style={styles.field}>
                  Fecha de creación: {formattedDate}
                </Text>
                <Text style={styles.field}>
                  Descripción: {item.description}
                </Text>
                <Text style={styles.field}>Equipo: {item.equipment}</Text>
                <Text style={styles.field}>Prioridad: {item.priority}</Text>
                <Text style={styles.field}>Estado: {item.status}</Text>
                <Text style={styles.field}>
                  Técnico: {item.technical === "1" ? "Sí" : "No"}
                </Text>
                <Text style={styles.field}>
                  Historial de seguimiento: {item.tracking_history}
                </Text>
                <Text style={styles.field}>Usuario: {item.user}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  field: {
    fontSize: 14,
    marginBottom: 5,
  },
});

export default WatchTicketsScreen;
