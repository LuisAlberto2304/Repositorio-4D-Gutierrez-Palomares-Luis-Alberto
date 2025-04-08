import React, { useState, useEffect, useContext } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { AuthContext } from "../context/AuthContext";

const WatchProfileEmp = () => {
  const { userEmail } = useContext(AuthContext); // Obtenemos el email del contexto
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    location: "",
  });

  const [editing, setEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState({
    day: "",
    month: "",
    year: "",
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    isConfirmation: false,
  });

  // Obtener los datos del usuario basado en el email
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("Email del usuario:", userEmail); // Debug

        if (!userEmail) {
          Alert.alert("Error", "No se encontró email de usuario");
          setLoading(false);
          return;
        }

        // 1. Buscar el usuario por email
        const usersRef = collection(db, "User");
        const q = query(usersRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);

        console.log("Documentos encontrados:", querySnapshot.size); // Debug

        if (querySnapshot.empty) {
          Alert.alert("Error", "Usuario no encontrado");
          setLoading(false);
          return;
        }

        // 2. Obtener los datos del primer documento (asumiendo emails únicos)
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        console.log("Datos del usuario:", userData); // Debug

        setUserId(userDoc.id); // Guardamos el ID del documento
        setUserData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          dateOfBirth: userData.dateOfBirth || "",
          phone: userData.phone || "",
          email: userData.email || userEmail, // Usamos el email del contexto como fallback
          location: userData.location || "",
        });

        // Parsear la fecha de nacimiento si existe
        if (userData.dateOfBirth) {
          const [day, month, year] = userData.dateOfBirth.split("/");
          setTempDate({ day, month, year });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        Alert.alert("Error", "No se pudieron cargar los datos");
        setLoading(false);
      }
    };

    loadUserData();
  }, [userEmail]); // Dependencia del efecto

  const handleInputChange = (name, value) => {
    setUserData({
      ...userData,
      [name]: value,
    });
  };

  const handleTempDateChange = (name, value) => {
    setTempDate({
      ...tempDate,
      [name]: value,
    });
  };

  const handleDateConfirm = () => {
    const { day, month, year } = tempDate;
    if (day && month && year) {
      handleInputChange("dateOfBirth", `${day}/${month}/${year}`);
    }
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!userData.firstName || !userData.lastName) {
        Alert.alert("Error", "Nombre y apellido son obligatorios");
        return;
      }

      const updatedData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: userData.dateOfBirth,
        phone: userData.phone,
      };

      // Actualizamos usando el ID del documento
      await updateDoc(doc(db, "User", userId), updatedData);

      Alert.alert("Éxito", "Datos actualizados correctamente");
      setEditing(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "No se pudieron guardar los cambios");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4E9F3D" />
        <Text>Cargando datos del usuario...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screenContainer}>
      <Text style={styles.textMain}>Profile Settings</Text>

      <View style={styles.profileSection}>
        {/* Campo de Email (solo lectura) */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={userData.email}
            editable={false}
          />
        </View>

        {/* Campo de Ubicación (solo lectura) */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={userData.location}
            editable={false}
          />
        </View>

        {/* Campos editables */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>FirstName</Text>
          <TextInput
            style={styles.input}
            value={userData.firstName}
            onChangeText={(text) => handleInputChange("firstName", text)}
            editable={editing}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>LastName</Text>
          <TextInput
            style={styles.input}
            value={userData.lastName}
            onChangeText={(text) => handleInputChange("lastName", text)}
            editable={editing}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>CellPhone Number</Text>
          <TextInput
            style={styles.input}
            value={userData.phone}
            onChangeText={(text) => handleInputChange("phone", text)}
            keyboardType="phone-pad"
            editable={editing}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Birthdate</Text>
          <TouchableOpacity
            onPress={() => editing && setShowDatePicker(true)}
            disabled={!editing}
          >
            <TextInput
              style={styles.input}
              value={userData.dateOfBirth}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selector de fecha personalizado */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Select your date of birth</Text>

            <View style={styles.dateInputsContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Day</Text>
                <TextInput
                  style={styles.dateInput}
                  value={tempDate.day}
                  onChangeText={(text) => handleTempDateChange("day", text)}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="DD"
                />
              </View>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Month</Text>
                <TextInput
                  style={styles.dateInput}
                  value={tempDate.month}
                  onChangeText={(text) => handleTempDateChange("month", text)}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="MM"
                />
              </View>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Year</Text>
                <TextInput
                  style={styles.dateInput}
                  value={tempDate.year}
                  onChangeText={(text) => handleTempDateChange("year", text)}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="AAAA"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDateConfirm}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Botones de acción */}
      <View style={styles.buttonContainer}>
        {editing ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setEditing(false)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setEditing(true)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
        <CustomAlertModal
          visible={alertVisible}
          title={alertContent.title}
          message={alertContent.message}
          onConfirm={alertContent.onConfirm} // Función de confirmación
          onCancel={alertContent.onCancel} // Función de cancelación
          isConfirmation={alertContent.isConfirmation} // Modo
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  textMain: {
    fontFamily: "Poppins-Bold",
    fontSize: 24,
    textAlign: "center",
    marginVertical: 20,
    color: "#2E2E2E",
  },
  profileSection: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  input: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    padding: 12,
    backgroundColor: "white",
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#777",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  button: {
    backgroundColor: "#4E9F3D",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    margin: 5,
    minWidth: 150,
  },
  saveButton: {
    backgroundColor: "#4E9F3D",
  },
  cancelButton: {
    backgroundColor: "#D9534F",
  },
  buttonText: {
    fontFamily: "Poppins-SemiBold",
    color: "white",
    fontSize: 16,
  },
  // Estilos para el modal de fecha
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  dateInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  dateInputContainer: {
    alignItems: "center",
    width: "30%",
  },
  dateLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    marginBottom: 5,
  },
  dateInput: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    padding: 10,
    width: "100%",
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#4E9F3D",
  },
  modalButtonText: {
    fontFamily: "Poppins-SemiBold",
    color: "white",
    fontSize: 16,
  },
});

export default WatchProfileEmp;
