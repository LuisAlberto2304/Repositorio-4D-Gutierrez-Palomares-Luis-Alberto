import React, { useContext, useState, useEffect } from "react";
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
import CustomAlertModal from "./CustomAlertModal";

const SettingScreen = () => {
  const { userEmail, logOut } = useContext(AuthContext);
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

  // Validar formato de fecha
  const isValidDate = (day, month, year) => {
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (dayNum < 1 || dayNum > 31) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) return false;

    return true;
  };

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!userEmail) {
          Alert.alert("Error", "No se encontró email de usuario");
          setLoading(false);
          return;
        }

        const usersRef = collection(db, "User");
        const q = query(usersRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert("Error", "Usuario no encontrado");
          setLoading(false);
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        setUserId(userDoc.id);
        setUserData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          dateOfBirth: userData.dateOfBirth || "",
          phone: userData.phone || "",
          email: userData.email || userEmail,
          location: userData.location || "",
        });

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
  }, [userEmail]);

  const handleInputChange = (name, value) => {
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTempDateChange = (name, value) => {
    // Validar entrada numérica
    if (value && !/^\d+$/.test(value)) return;

    setTempDate((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateConfirm = () => {
    const { day, month, year } = tempDate;

    if (!day || !month || !year) {
      Alert.alert("Error", "Por favor complete todos los campos de fecha");
      return;
    }

    if (!isValidDate(day, month, year)) {
      Alert.alert("Error", "Fecha inválida");
      return;
    }

    handleInputChange("dateOfBirth", `${day}/${month}/${year}`);
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
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        dateOfBirth: userData.dateOfBirth,
        phone: userData.phone.trim(),
      };

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

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión");
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
      <Text style={styles.textMain}>Configuración de Perfil</Text>

      <View style={styles.profileSection}>
        {/* Campo de Email (solo lectura) */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={userData.email}
            editable={false}
          />
        </View>

        {/* Campo de Ubicación (solo lectura) */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ubicación</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={userData.location}
            editable={false}
          />
        </View>

        {/* Campos editables */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={userData.firstName}
            onChangeText={(text) => handleInputChange("firstName", text)}
            editable={editing}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            value={userData.lastName}
            onChangeText={(text) => handleInputChange("lastName", text)}
            editable={editing}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={userData.phone}
            onChangeText={(text) => handleInputChange("phone", text)}
            keyboardType="phone-pad"
            editable={editing}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Fecha de Nacimiento</Text>
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
            <Text style={styles.modalTitle}>
              Selecciona tu fecha de nacimiento
            </Text>

            <View style={styles.dateInputsContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Día</Text>
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
                <Text style={styles.dateLabel}>Mes</Text>
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
                <Text style={styles.dateLabel}>Año</Text>
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
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDateConfirm}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
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
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setEditing(false)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setEditing(true)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Editar Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <CustomAlertModal
        visible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        onConfirm={alertContent.onConfirm} // Función de confirmación
        onCancel={alertContent.onCancel} // Función de cancelación
        isConfirmation={alertContent.isConfirmation} // Modo
      />
    </ScrollView>
  );
};

// Añadir este estilo al objeto styles
const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: "#D9534F",
  },
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

export default SettingScreen;
