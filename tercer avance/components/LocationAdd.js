import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomAlertModal from "./CustomAlertModal";
import { Ionicons } from "@expo/vector-icons";

// Componente reutilizable para campos de formulario
const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        multiline && { height: 80, textAlignVertical: "top" },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      multiline={multiline}
    />
  </View>
);

// Componente para selección de hora
const TimeSelector = ({ time, onTimeChange, label }) => {
  const [show, setShow] = useState(false);

  return (
    <View style={styles.timeSelectorContainer}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TouchableOpacity style={styles.timeButton} onPress={() => setShow(true)}>
        <Text style={styles.timeText}>
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShow(false);
            if (selectedTime) {
              onTimeChange(selectedTime);
            }
          }}
        />
      )}
    </View>
  );
};

const LocationAdd = () => {
  // Estado para los tiempos
  const [openingTime, setOpeningTime] = useState(new Date(2023, 0, 1, 9, 0)); // 9:00 AM por defecto
  const [closingTime, setClosingTime] = useState(new Date(2023, 0, 1, 18, 0)); // 6:00 PM por defecto
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {}, // Función vacía por defecto
    onCancel: () => setAlertVisible(false), // Cierra por defecto
    isConfirmation: false, // Booleano, no con "="
  });
  // Estado para el formulario
  const [formData, setFormData] = useState({
    nameLocal: "",
    openingHours: "9:00 AM - 6:00 PM", // Valor inicial
    phoneNumber: "",
    settlement: "",
    state: "",
    status: "Open",
    street: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Actualiza el string de horario cuando cambian los tiempos
  const updateOpeningHours = (start, end) => {
    const formattedHours = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    handleInputChange("openingHours", formattedHours);
  };

  const handleStartTimeChange = (newTime) => {
    setOpeningTime(newTime);
    updateOpeningHours(newTime, closingTime);
  };

  const handleEndTimeChange = (newTime) => {
    setClosingTime(newTime);
    updateOpeningHours(openingTime, newTime);
  };

  const addLocation = async (locationData) => {
    try {
      const requiredFields = [
        "nameLocal",
        "openingHours",
        "phoneNumber",
        "settlement",
        "state",
        "status",
        "street",
      ];
      const missingFields = requiredFields.filter(
        (field) => !locationData[field],
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Faltan campos requeridos: ${missingFields.join(", ")}`,
        );
      }

      const newLocation = {
        dateRegister: new Date().toISOString().split("T")[0],
        ...locationData,
      };

      const docRef = await addDoc(collection(db, "Location"), newLocation);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error al agregar locación:", error);
      return {
        success: false,
        error: error.message,
        code: error.code || "UNKNOWN_ERROR",
      };
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await addLocation(formData);
    setIsSubmitting(false);

    if (result.success) {
      setAlertContent({
        title: "Success",
        message: "Location added successfully",
        onConfirm: () => setAlertVisible(false),
        isConfirmation: false,
      });
      setAlertVisible(true);
      // Resetear formulario
      setFormData({
        nameLocal: "",
        openingHours: "9:00 AM - 6:00 PM",
        phoneNumber: "",
        settlement: "",
        state: "",
        status: "Open",
        street: "",
      });
      // Resetear tiempos
      setOpeningTime(new Date(2023, 0, 1, 9, 0));
      setClosingTime(new Date(2023, 0, 1, 18, 0));
    } else {
      setAlertContent({
        title: "Error: Save Information",
        message:
          "Sorry, something went wrong, please exit and re-enter the current screen.",
        onConfirm: () => setAlertVisible(false),
        isConfirmation: false,
      });
      setAlertVisible(true);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>New Location</Text>

      <FormField
        label="Location Name*"
        value={formData.nameLocal}
        onChangeText={(text) => handleInputChange("nameLocal", text)}
        placeholder="e.g: Sucursal Florido"
      />

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Operating Hours*</Text>
        <View style={styles.timeSelectorsContainer}>
          <TimeSelector
            time={openingTime}
            onTimeChange={handleStartTimeChange}
            label="Opening:"
          />
          <TimeSelector
            time={closingTime}
            onTimeChange={handleEndTimeChange}
            label="Closure:"
          />
        </View>
        <TextInput
          style={styles.input}
          value={formData.openingHours}
          editable={false}
        />
      </View>

      <FormField
        label="Phone Number*"
        value={formData.phoneNumber}
        onChangeText={(text) => handleInputChange("phoneNumber", text)}
        placeholder="e.g: 890-123-4567"
        keyboardType="phone-pad"
      />

      <FormField
        label="Settlement*"
        value={formData.settlement}
        onChangeText={(text) => handleInputChange("settlement", text)}
        placeholder="e.g: Florido"
      />

      <FormField
        label="State*"
        value={formData.state}
        onChangeText={(text) => handleInputChange("state", text)}
        placeholder="e.g: Baja California"
      />

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Status*</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.status === "Open" && styles.radioButtonSelected,
            ]}
            onPress={() => handleInputChange("status", "Open")}
          >
            <Text
              style={[
                styles.radioButtonText,
                formData.status === "Open" && styles.radioButtonTextSelected,
              ]}
            >
              Open
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.status === "Closed" && styles.radioButtonSelected,
            ]}
            onPress={() => handleInputChange("status", "Closed")}
          >
            <Text
              style={[
                styles.radioButtonText,
                formData.status === "Closed" && styles.radioButtonTextSelected,
              ]}
            >
              Closed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FormField
        label="Address*"
        value={formData.street}
        onChangeText={(text) => handleInputChange("street", text)}
        placeholder="e.g: Blvd. Insurgentes 505"
        multiline
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>
            <Ionicons name="save" size={16} color="#fff" /> Save Location
          </Text>
        )}
      </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
    marginBottom: 20,
    textAlign: "left",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#334155",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#334155",
    backgroundColor: "#fff",
  },
  timeSelectorsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  timeSelectorContainer: {
    flex: 1,
    marginRight: 10,
  },
  timeLabel: {
    marginBottom: 5,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#334155",
  },
  timeButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#334155",
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  radioButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  radioButtonSelected: {
    backgroundColor: "#1E3A8A",
    borderColor: "#1E3A8A",
  },
  radioButtonText: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#64748B",
  },
  radioButtonTextSelected: {
    color: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: "#1E3A8A",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 2,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
  },
});

export default LocationAdd;
