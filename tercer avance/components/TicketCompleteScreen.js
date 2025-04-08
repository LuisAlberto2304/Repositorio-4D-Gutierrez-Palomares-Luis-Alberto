import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  getDeviceByTicket,
  getAllDevices,
  changeBaseEquipment,
  changeComponents,
  updateEquipmentActiveNoChanges,
} from "../services/deviceService";
import { getTypeIdByComponentName } from "../services/componentService";
import { getComponentsByTypeId } from "../services/componentService";
import CustomAlertModal from "./CustomAlertModal";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getFirestore
} from 'firebase/firestore';

import { auth } from '../firebaseConfig'; // Asegúrate que la ruta sea correcta
import { AuthContext } from '../context/AuthContext'; // Asegúrate que la ruta sea correcta
import { getAuth } from 'firebase/auth';


// Agrega esta importación al inicio del archivo
import { createInitialFeedback } from '../services/feedbackService';

const TicketCompleteScreen = ({ route }) => {
  const navigation = useNavigation();
  const { ticket } = route.params;
  const [expandedSections, setExpandedSections] = useState({
    device: true,
    note: true,
    changes: true,
    keepComponents: true,
  });
  const [equipmentChecked, setEquipmentChecked] = useState(false);
  const [equipmentData, setEquipmentData] = useState(null);
  const [fullDeviceChanged, setFullDeviceChanged] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [componentChanges, setComponentChanges] = useState([
    {
      selectedComponent: "",
      selectedAvailableComponent: "",
      selectedAvailableSerial: "",
      typeId: null,
      placeholder: "Select a Current Component",
    },
  ]);
  const [fullReplacementSerials, setFullReplacementSerials] = useState({
    serialNumber: "",
    cpu: "",
    mobo: "",
    ram: "",
    sto: "",
    psu: "",
  });
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [notes, setNotes] = useState("");
  const [newDevice, setNewDevice] = useState("");
  const [activePickerIndex, setActivePickerIndex] = useState(null);
  const [modalType, setModalType] = useState("component");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {}, // Función vacía por defecto
    onCancel: () => setAlertVisible(false), // Cierra por defecto
    isConfirmation: false, // Booleano, no con "="
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const equipmentUID = ticket.affectedEquipmentUID;

        if (equipmentUID) {
          const equipment = await getDeviceByTicket(equipmentUID);
          setEquipmentData(equipment);

          const devices = await getAllDevices({ type: equipment.type });
          setAvailableDevices(devices);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticket]);

  useEffect(() => {
    if (!equipmentChecked) {
      setFullDeviceChanged(null);
      setComponentChanges([
        {
          selectedComponent: "",
          selectedAvailableComponent: "",
          selectedAvailableSerial: "",
          typeId: null,
          placeholder: "Select a Current Component",
        },
      ]);
    }
  }, [equipmentChecked]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleEquipment = () => {
    const newValue = !equipmentChecked;
    setEquipmentChecked(newValue);

    // Cuando se activa el switch, establece el valor predeterminado a null (ninguna opción seleccionada)
    if (newValue) {
      setFullDeviceChanged(null);
    }
  };

  const addComponentChange = () => {
    // Obtener todos los componentes Y periféricos disponibles
    const allParts = [
      ...Object.values(equipmentData?.components || {}),
      ...Object.values(equipmentData?.peripherals || {}),
    ];

    // Contar cuántos ya están seleccionados
    const selectedCount = componentChanges.reduce((count, change) => {
      return change.selectedComponent ? count + 1 : count;
    }, 0);

    // Verificar si se puede añadir más
    if (selectedCount < allParts.length) {
      setComponentChanges((prev) => [
        ...prev,
        {
          selectedComponent: "",
          selectedAvailableComponent: "",
          selectedAvailableSerial: "",
          typeId: null,
          placeholder: "Select a Current Component",
        },
      ]);
    }
  };

  const removeComponentChange = (index) => {
    if (index === 0 || componentChanges.length <= 1) return;

    setComponentChanges((prev) => {
      const newChanges = [...prev];
      newChanges.splice(index, 1);
      return newChanges;
    });
  };

  // Paso 1: Agregar useEffect para sincronizar selecciones
  useEffect(() => {
    const currentSelections = componentChanges
      .map((change) => change.selectedComponent)
      .filter(Boolean);

    setSelectedComponents(currentSelections);
  }, [componentChanges]);

  // Paso 2: Modificar handleComponentChange
  const handleComponentChange = async (componentName, index) => {
    // Verificar si el componente ya está seleccionado en otro campo
    const isAlreadySelected = componentChanges.some(
      (change, idx) =>
        idx !== index && change.selectedComponent === componentName,
    );

    // Primera actualización: limpiar selecciones previas
    setComponentChanges((prev) => {
      const newChanges = [...prev];
      newChanges[index] = {
        ...newChanges[index],
        selectedComponent: componentName,
        selectedAvailableComponent: "", // Limpiar reemplazo
        typeId: null,
        availableComponents: null, // Temporalmente vacío mientras cargamos
      };
      return newChanges;
    });

    // Cargar datos del componente si hay nombre
    if (componentName) {
      try {
        const typeId = await getTypeIdByComponentName(componentName);

        if (typeId) {
          const components = await getComponentsByTypeId(typeId);

          // Segunda actualización: establecer los componentes disponibles
          setComponentChanges((prev) => {
            const newChanges = [...prev];
            newChanges[index] = {
              ...newChanges[index],
              typeId: typeId,
              availableComponents: components || [], // Asegurar array vacío si es null
            };
            return newChanges;
          });
        }
      } catch (err) {
        setError(err.message);
        console.error("Error loading component data:", error);
        // En caso de error, asegurarse de que availableComponents sea array vacío
        setComponentChanges((prev) => {
          const newChanges = [...prev];
          newChanges[index] = {
            ...newChanges[index],
            availableComponents: [],
          };
          return newChanges;
        });
      }
    }
  };

  const validateComponentChanges = () => {
    // Si el switch no está activado, no hay necesidad de validar
    if (!equipmentChecked) {
      return true;
    }

    // Validar que se haya seleccionado un tipo de cambio
    if (fullDeviceChanged === null) {
      setAlertContent({
        title: "Selection Required",
        message:
          "Please select whether you're replacing the full device or just components",
        onConfirm: () => setAlertVisible(false),
        isConfirmation: false,
      });
      setAlertVisible(true);
      return false;
    }

    if (fullDeviceChanged === true) {
      if (!newDevice) {
        setAlertContent({
          title: "Device Required",
          message: "Please select a new device for replacement",
          onConfirm: () => setAlertVisible(false),
          isConfirmation: false,
        });
        setAlertVisible(true);
        return false;
      }
      const requiredFields = Object.values(fullReplacementSerials);
      if (requiredFields.some((field) => !field.trim())) {
        setAlertContent({
          title: "Missing Information",
          message: "All serial numbers are required for full replacement",
          onConfirm: () => setAlertVisible(false),
          isConfirmation: false,
        });
        setAlertVisible(true);
        return false;
      }
      return true;
    }

    // Validación para Component Change
    if (fullDeviceChanged === false) {
      // 1. Eliminar filas completamente vacías
      const nonEmptyChanges = componentChanges.filter(
        (change) =>
          change.selectedComponent || change.selectedAvailableComponent,
      );

      // 2. Si hay filas vacías entre medias
      const hasEmptyRows = componentChanges.length !== nonEmptyChanges.length;
      if (hasEmptyRows) {
        setAlertContent({
          title: "Empty Rows",
          message: "Please complete or remove empty rows",
          onConfirm: () => setAlertVisible(false),
          isConfirmation: false,
        });
        setAlertVisible(true);
        return false;
      }

      // 3. Si no hay ningún cambio seleccionado
      const hasAnyChanges = nonEmptyChanges.length > 0;
      if (!hasAnyChanges) {
        return true; // Permite continuar (caso de solo notas)
      }

      // 4. Validar campos incompletos
      const incompleteChanges = nonEmptyChanges.filter(
        (change) =>
          change.selectedComponent &&
          (!change.selectedAvailableComponent ||
            !change.selectedAvailableSerial.trim()),
      );

      if (incompleteChanges.length > 0) {
        setAlertContent({
          title: "Incomplete Information",
          message: `Missing replacement or SN for: ${incompleteChanges
            .map((c) => c.selectedComponent)
            .join(", ")}`,
          onConfirm: () => setAlertVisible(false),
          isConfirmation: false,
        });
        setAlertVisible(true);
        return false;
      }

      // 5. Validar seriales duplicados
      const serialNumbers = nonEmptyChanges
        .map((c) => c.selectedAvailableSerial)
        .filter(Boolean);

      const hasDuplicates =
        new Set(serialNumbers).size !== serialNumbers.length;
      if (hasDuplicates) {
        setAlertContent({
          title: "Duplicate Serial Numbers",
          message: "You can't use the same SN for multiple components",
          onConfirm: () => setAlertVisible(false),
          isConfirmation: false,
        });
        setAlertVisible(true);
        return false;
      }
    }

    return true;
  };

  const handleConfirmation = async () => {
    if (equipmentChecked && !validateComponentChanges()) return;
  
    setAlertContent({
      title: "Confirm action",
      message: "Mark ticket as completed?",
      onConfirm: async () => {
        try {
          setAlertVisible(false);
          setLoading(true);
  
          // 1. Verificación de autenticación
          const auth = getAuth();
          let currentUser = auth.currentUser;
          
          if (!currentUser) {
            await auth.authStateReady();
            currentUser = auth.currentUser;
            if (!currentUser) throw new Error("You must log in to complete this action.");
          }
  
          // 2. Validación y preparación del ticket
          const validatedTicket = {
            ...ticket,
            assignedTo: ticket.assignedTo || currentUser.uid,  // Si no tiene assignedTo, usa el UID del usuario actual
            id: ticket.id || `temp-${Date.now()}`,
            assignedToName: ticket.assignedToName?.trim() || 'Unspecified technician',
            assignedToEmail: ticket.assignedToEmail?.toLowerCase().trim() || null
          };
  
          // 3. Asignar `reportedBy` con el email del empleado
          if (!validatedTicket.reportedBy && validatedTicket.employeeEmail) {
            validatedTicket.reportedBy = validatedTicket.employeeEmail.toLowerCase();  // Asignamos el email del empleado
          } else if (!validatedTicket.reportedBy) {
            validatedTicket.reportedBy = currentUser.email.toLowerCase();  // Si no hay email, usamos el email del usuario actual
          }
  
          // 4. Validación de los valores UID para el técnico
          const isValidUID = (uid) => uid && typeof uid === 'string' && uid.length >= 28 && /^[a-zA-Z0-9_-]+$/.test(uid);
          
          if (!isValidUID(validatedTicket.assignedTo)) {
            throw new Error("Invalid technician ID");
          }
  
  
          console.log('Validated data for feedback:', {
            ticketId: validatedTicket.id,
            employeeUID: validatedTicket.reportedBy,
            technicianUID: validatedTicket.assignedTo,
            differentUIDs: validatedTicket.reportedBy !== validatedTicket.assignedTo
          });
  
          // 6. Completar el ticket
          const saveResult = await handleSave();
          if (!saveResult?.success) {
            throw new Error(saveResult?.message || "Error saving changes to ticket");
          }
  
          // 7. Crear feedback con estructura clara
          const feedbackData = {
            employee: {
              uid: validatedTicket.reportedBy,
              email: validatedTicket.employeeEmail,
              name: validatedTicket.employeeName || 'Unidentified employee'
            },
            technician: {
              uid: validatedTicket.assignedTo,
              email: validatedTicket.technicalEmail,
              name: validatedTicket.employeeName
            },
            ticket: {
              id: validatedTicket.id,
              number: validatedTicket.ticketNumber || `TKT-${validatedTicket.id.slice(0, 8)}`,
              equipment: validatedTicket.affectedEquipment,
              problemType: validatedTicket.problemType
            },
            rating: 0,
            status: 'pending',
            createdAt: new Date().toISOString()
          };
  
          const feedbackResult = await createInitialFeedback(feedbackData);
          console.log("Feedback created successfully:", {
            feedbackId: feedbackResult.id,
            employeeUID: feedbackResult.employee.uid,
            technicianUID: feedbackResult.technician.uid
          });
          
          // 8. Éxito
          setAlertContent({
            title: "Filled!",
            message: "Ticket closed successfully",
            onConfirm: () => navigation.goBack(),
            isConfirmation: false,
            showFeedbackLink: true,
            feedbackId: feedbackResult.id
          });
  
        } catch (error) {
          console.error("Confirmation error:", {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });
  
          setAlertContent({
            title: "Error",
            message: error.message.includes("same person") 
              ? "The assigned technician cannot be the same as the reporting employee."
              : error.message,
            onConfirm: () => setAlertVisible(false),
            isConfirmation: false,
            showRetry: !error.message.includes("same person")
          });
        } finally {
          setLoading(false);
          setAlertVisible(true);
        }
      },
      onCancel: () => setAlertVisible(false),
      isConfirmation: true
    });
    setAlertVisible(true);
  };
  

  const handleSave = async () => {
    let response = {};
    try {
      if (equipmentChecked && fullDeviceChanged && newDevice) {
        /* Caso 1: Full Replacement */
        response = await changeBaseEquipment({
          oldDeviceId: equipmentData.id,
          newDeviceId: newDevice,
          problemType: ticket.problemType,
          notes: notes,
          serialNumber: fullReplacementSerials.serialNumber,
          componentSerials: {
            cpu: fullReplacementSerials.cpu,
            mobo: fullReplacementSerials.mobo,
            ram: fullReplacementSerials.ram,
            sto: fullReplacementSerials.sto,
            psu: fullReplacementSerials.psu,
          },
          ticketId: ticket.id,
        });
      } else if (equipmentChecked && !fullDeviceChanged) {
        // Caso 2: Component Change
        const componentUpdates = componentChanges
          .filter(
            (change) =>
              change.selectedComponent && change.selectedAvailableComponent,
          )
          .map((change) => ({
            componentName: change.selectedComponent,
            replacementComponentId: change.selectedAvailableComponent,
            replacementSerialNumber: change.selectedAvailableSerial,
            typeId: change.typeId,
            partType: change.partType,
          }));

        if (componentUpdates.length > 0) {
          response = await changeComponents({
            deviceId: equipmentData.id,
            componentUpdates: componentUpdates,
            problemType: ticket.problemType,
            notes: notes,
            ticketId: ticket.id,
          });
        }
      } else {
        // Caso 3: Switch DESACTIVADO (solo notas)
        response = await updateEquipmentActiveNoChanges({
          deviceId: equipmentData.id,
          problemType: ticket.problemType,
          notes: notes,
          ticketId: ticket.id,
        });
      }
      return response;
    } catch (err) {
      console.error("Error saving changes:", err);
      setError(err);
    }
  };

  const handleCancel = () => {
    setAlertContent({
      title: "Confirm Action",
      message: "Are you sure you want to exit this process?",
      onConfirm: () => {
        setAlertVisible(false);
        navigation.goBack(); // Navega si confirma
      },
      onCancel: () => setAlertVisible(false) /*Cerrar modal*/,
      isConfirmation: true,
    });
    setAlertVisible(true);
  };

  const handleSerialChange = (text, field, setStateFunction) => {
    const upperText = text.toUpperCase();
    if (setStateFunction === setFullReplacementSerials) {
      setStateFunction((prev) => ({ ...prev, [field]: upperText }));
    } else {
      // Para componentChanges
      const updatedChanges = [...componentChanges];
      updatedChanges[field.index][field.property] = upperText;
      setStateFunction(updatedChanges);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorHeader}>
          <MaterialIcons name="error-outline" size={40} color="#DC2626" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
        </View>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <View style={styles.boxError}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={navigation.goBack}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!equipmentData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No equipment data available</Text>
      </SafeAreaView>
    );
  }

  const filterAlphanumeric = (text) => text.replace(/[^a-zA-Z0-9\-_]/g, "");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ticket #{ticket?.ticketId || ""}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sección de Equipo */}
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection("device")}
        >
          <Text style={styles.accordionTitle}>Device Information</Text>
          <Text style={styles.accordionIcon}>
            {expandedSections.device ? "−" : "+"}
          </Text>
        </TouchableOpacity>

        {expandedSections.device && (
          <View style={styles.accordionContent}>
            <View style={styles.formRow}>
              <Text style={styles.label}>Device Type:</Text>
              <Text style={styles.value}>{equipmentData.type}</Text>
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.label, { marginBottom: 0 }]}>
                Device/Component(s) Changed:
              </Text>
              <TouchableOpacity
                style={[styles.toggle, equipmentChecked && styles.toggleOn]}
                onPress={toggleEquipment}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    equipmentChecked && styles.toggleKnobOn,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sección de Notas */}
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection("note")}
        >
          <Text style={styles.accordionTitle}>Situation Notes</Text>
          <Text style={styles.accordionIcon}>
            {expandedSections.note ? "−" : "+"}
          </Text>
        </TouchableOpacity>
        {expandedSections.note && (
          <View style={styles.accordionContent}>
            <View style={styles.formRow}>
              <Text style={styles.label}>Add a Note:</Text>
              <TextInput
                style={styles.input}
                multiline={true}
                textAlignVertical="top"
                textAlign="left"
                returnKeyType="next"
                value={notes}
                onChangeText={setNotes}
                placeholder="Describe the changes made..."
              />
            </View>
          </View>
        )}

        {/* Sección de Cambios (visible solo si equipmentChecked es true) */}
        {equipmentChecked && (
          <>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection("changes")}
            >
              <Text style={styles.accordionTitle}>Change Details</Text>
              <Text style={styles.accordionIcon}>
                {expandedSections.changes ? "−" : "+"}
              </Text>
            </TouchableOpacity>

            {expandedSections.changes && (
              <View style={styles.accordionContent}>
                <View style={styles.radioRow}>
                  <Text style={styles.label}>Change Type:</Text>
                  <View style={styles.radioOptions}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setFullDeviceChanged(true)}
                    >
                      <View
                        style={[
                          styles.radio,
                          fullDeviceChanged === true && styles.radioSelected,
                        ]}
                      />
                      <Text style={styles.radioLabel}>Full Replacement</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setFullDeviceChanged(false)}
                    >
                      <View
                        style={[
                          styles.radio,
                          fullDeviceChanged === false && styles.radioSelected,
                        ]}
                      />
                      <Text style={styles.radioLabel}>Component Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {fullDeviceChanged ? (
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Select New Device:</Text>
                    <Picker
                      style={styles.picker}
                      selectedValue={newDevice}
                      onValueChange={setNewDevice}
                    >
                      <Picker.Item label="Select new device..." value="" />
                      {availableDevices.map((device) => (
                        <Picker.Item
                          key={device.id}
                          label={device.name || `Device ${device.id}`}
                          value={device.id}
                        />
                      ))}
                    </Picker>
                    {newDevice && (
                      <>
                        <Text
                          style={[
                            styles.label,
                            { marginTop: 15, marginBottom: 0 },
                          ]}
                        >
                          Device Serial Number:
                        </Text>
                        <TextInput
                          style={styles.serialInput}
                          autoCapitalize="characters"
                          placeholder="New Device Serial Number"
                          value={fullReplacementSerials.serialNumber}
                          onChangeText={(text) =>
                            handleSerialChange(
                              text,
                              "serialNumber",
                              setFullReplacementSerials,
                            )
                          }
                        />
                        <Text
                          style={[
                            styles.label,
                            { marginTop: 15, marginBottom: 0 },
                          ]}
                        >
                          Components Serial Numbers:
                        </Text>
                        <TextInput
                          style={styles.serialInput}
                          autoCapitalize="characters"
                          placeholder="CPU Serial Number"
                          value={fullReplacementSerials.cpu}
                          onChangeText={(text) =>
                            handleSerialChange(
                              text,
                              "cpu",
                              setFullReplacementSerials,
                            )
                          }
                        />

                        <TextInput
                          style={styles.serialInput}
                          autoCapitalize="characters"
                          placeholder="Motherboard Serial Number"
                          value={fullReplacementSerials.mobo}
                          onChangeText={(text) =>
                            handleSerialChange(
                              text,
                              "mobo",
                              setFullReplacementSerials,
                            )
                          }
                        />

                        <TextInput
                          style={styles.serialInput}
                          autoCapitalize="characters"
                          placeholder="RAM Serial Number"
                          value={fullReplacementSerials.ram}
                          onChangeText={(text) =>
                            handleSerialChange(
                              text,
                              "ram",
                              setFullReplacementSerials,
                            )
                          }
                        />

                        <TextInput
                          style={styles.serialInput}
                          autoCapitalize="characters"
                          placeholder="Storage Serial Number"
                          value={fullReplacementSerials.sto}
                          onChangeText={(text) =>
                            handleSerialChange(
                              text,
                              "sto",
                              setFullReplacementSerials,
                            )
                          }
                        />

                        <TextInput
                          style={styles.serialInput}
                          autoCapitalize="characters"
                          placeholder="PSU Serial Number"
                          value={fullReplacementSerials.psu}
                          onChangeText={(text) =>
                            handleSerialChange(
                              text,
                              "psu",
                              setFullReplacementSerials,
                            )
                          }
                        />
                      </>
                    )}
                  </View>
                ) : (
                  <>
                    {!fullDeviceChanged && (
                      <>
                        <Text style={styles.label}>
                          Select Component(s) Changed:
                        </Text>
                        {componentChanges.map((change, index) => (
                          <View
                            key={`${index}-${change.selectedComponent || "empty"}`}
                            style={styles.componentCard}
                          >
                            <View style={styles.pickerContent}>
                              <View
                                style={{ flex: 1, flexDirection: "column" }}
                              >
                                {/* Picker del Equipo actual (Componentes) */}
                                <TouchableOpacity
                                  onPress={() => {
                                    setActivePickerIndex(index);
                                    setModalType("component");
                                  }}
                                  style={styles.pickerButton}
                                >
                                  <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={
                                      change.selectedComponent
                                        ? styles.selectedText
                                        : styles.placeholderText
                                    }
                                  >
                                    {change.selectedComponent ||
                                      "Select a Current Component"}
                                  </Text>
                                  <MaterialIcons
                                    name="arrow-drop-down"
                                    size={24}
                                    color="#1E3A8A"
                                  />
                                </TouchableOpacity>

                                {/* Picker de Componentes Compatibles (Visible si: hay componente seleccionado) */}
                                {change.selectedComponent && (
                                  <>
                                    <Text style={styles.label}>
                                      New component:
                                    </Text>
                                    <TouchableOpacity
                                      onPress={() => {
                                        setActivePickerIndex(index);
                                        setModalType("replacement");
                                      }}
                                      style={styles.pickerButton}
                                    >
                                      <Text
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                        style={
                                          change.selectedAvailableComponent
                                            ? styles.selectedText
                                            : styles.placeholderText
                                        }
                                      >
                                        {change.selectedAvailableComponent ||
                                          "Select replacement..."}
                                      </Text>
                                      <MaterialIcons
                                        name="arrow-drop-down"
                                        size={26}
                                        color="#1E3A8A"
                                      />
                                    </TouchableOpacity>
                                  </>
                                )}
                              </View>

                              {/* Botón de eliminar */}
                              {index > 0 && (
                                <TouchableOpacity
                                  onPress={() => removeComponentChange(index)}
                                  style={styles.deleteButton}
                                >
                                  <MaterialIcons
                                    name="delete"
                                    size={24}
                                    color="#EF4444"
                                  />
                                </TouchableOpacity>
                              )}

                              {/* Icono fantasma para el primer boton proposito estetico*/}
                              {index === 0 && (
                                <View style={styles.deleteButton}>
                                  <MaterialIcons
                                    name="delete"
                                    size={24}
                                    color="#FFFFFF"
                                  />
                                </View>
                              )}
                            </View>

                            {/* InputText Serial Number*/}
                            {change.selectedAvailableComponent && (
                              <>
                                <Text style={styles.label}>
                                  Serial Number(SN): New component
                                </Text>
                                <TextInput
                                  style={styles.serialInput}
                                  autoCapitalize="characters"
                                  placeholder="Enter SN of the new component"
                                  value={change.selectedAvailableSerial}
                                  onChangeText={(text) =>
                                    handleSerialChange(
                                      text,
                                      {
                                        index: index,
                                        property: "selectedAvailableSerial",
                                      },
                                      setComponentChanges,
                                    )
                                  }
                                />
                              </>
                            )}
                          </View>
                        ))}

                        {/* Botón para agregar más componentes */}
                        {componentChanges.length <
                          [
                            ...Object.values(equipmentData?.components || {}),
                            ...Object.values(equipmentData?.peripherals || {}),
                          ].length && (
                          <TouchableOpacity
                            onPress={addComponentChange}
                            style={styles.addButton}
                          >
                            <MaterialIcons
                              name="add-circle"
                              size={24}
                              color="#1E3A8A"
                            />
                            <Text style={styles.addButtonText}>
                              Add component
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </>
                )}
              </View>
            )}
          </>
        )}

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleConfirmation}
          >
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        visible={activePickerIndex !== null}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <FlatList
            data={
              modalType === "component"
                ? [
                    ...Object.values(equipmentData?.components || {}),
                    ...Object.values(equipmentData?.peripherals || {}),
                  ]
                : componentChanges[activePickerIndex]?.availableComponents || []
            }
            keyExtractor={(item, index) =>
              `${item.type || "part"}-${item.name}-${item.model || index}`
            }
            renderItem={({ item }) => {
              const partType = equipmentData?.components
                ? Object.values(equipmentData.components).includes(item)
                  ? "component"
                  : "peripheral"
                : "parte";

              const name = item.name || "Unnamed";

              const currentValue =
                modalType === "component"
                  ? componentChanges[activePickerIndex]?.selectedComponent
                  : componentChanges[activePickerIndex]
                      ?.selectedAvailableComponent;

              const isSelected = currentValue === name;
              const isDisabled =
                modalType === "component" &&
                componentChanges.some(
                  (change, idx) =>
                    idx !== activePickerIndex &&
                    change.selectedComponent === name,
                );

              return (
                <TouchableOpacity
                  style={[
                    styles.item,
                    isSelected && styles.selectedItem,
                    isDisabled && styles.disabledItem,
                  ]}
                  onPress={async () => {
                    if (!isDisabled) {
                      const updated = [...componentChanges];
                      if (modalType === "component") {
                        // Actualizar el estado primero
                        updated[activePickerIndex] = {
                          ...updated[activePickerIndex],
                          selectedComponent: isSelected ? "" : name,
                          partType: partType,
                        };
                        setComponentChanges(updated);

                        // Llamar a handleComponentChange para cargar componentes compatibles
                        if (!isSelected) {
                          await handleComponentChange(name, activePickerIndex);
                        }
                      } else {
                        updated[activePickerIndex].selectedAvailableComponent =
                          isSelected ? "" : name;
                        setComponentChanges(updated);
                      }

                      setActivePickerIndex(null);
                    }
                  }}
                  disabled={isDisabled}
                >
                  <View style={styles.itemContent}>
                    <View style={styles.itemBox}>
                      <Text
                        style={[
                          styles.itemText,
                          isSelected && styles.selectedText,
                          isDisabled && styles.disabledText,
                        ]}
                      >
                        {name}
                      </Text>
                      <Text style={styles.serialText}>
                        SN: {item.serialNumber || "N/A"}
                      </Text>
                    </View>
                    <Text style={styles.partTypeTag}>
                      {partType.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity
            onPress={() => setActivePickerIndex(null)}
            style={[
              styles.button,
              {
                paddingVertical: 5,
                paddingHorizontal: 1,
                backgroundColor: "#EF4444",
              },
            ]}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <CustomAlertModal
        visible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        onConfirm={alertContent.onConfirm} // Función de confirmación
        onCancel={alertContent.onCancel} // Función de cancelación
        isConfirmation={alertContent.isConfirmation} // Modo
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderBottomWidth: 3,
    borderBottomColor: "#FFC107",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1E3A8A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  accordionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
  },
  accordionIcon: {
    fontSize: 22,
    color: "#FFC107",
  },
  accordionContent: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#1E3A8A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  formRow: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FFC107",
  },
  input: {
    width: "100%",
    minHeight: 150,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FFC107",
    padding: 10,
    textAlign: "left",
    textAlignVertical: "top",
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#1E3A8A",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FFC107",
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: "#1E3A8A",
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  toggleKnobOn: {
    alignSelf: "flex-end",
  },
  radioRow: {
    marginBottom: 20,
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 8,
  },
  radioOptions: {
    flexDirection: Platform.select({
      web: "row",
      default: "column",
    }),
    justifyContent: Platform.select({
      web: "space-between",
      default: "flex-start",
    }),
    marginTop: 8,
  },
  radioOption: {
    ...Platform.select({
      web: {
        width: "40%",
        flexDirection: "row",
      },
      default: {
        width: "100%",
        flexDirection: "row",
        marginBottom: 12,
      },
    }),
    alignItems: "center",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    marginRight: 8,
  },
  radioSelected: {
    borderColor: "#1E3A8A",
    backgroundColor: "#1E3A8A",
  },
  radioLabel: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#1E3A8A",
  },
  picker: {
    width: "100%",
    height: 54,
    padding: 2,
    backgroundColor: "#F1F5F9",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#1E3A8A",
    color: "#1E3A8A",
    fontFamily: "Poppins-Medium",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    backgroundColor: "#F8FAFC",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
  },
  cancelButton: {
    width: "45%",
    backgroundColor: "#EF4444",
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  saveButton: {
    width: "45%",
    backgroundColor: "#1E3A8A",
    borderWidth: 1,
    borderColor: "#1E40AF",
  },
  buttonText: {
    color: "white",
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
  },
  boxError: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    textAlign: "center",
    margin: 20,
    fontFamily: "Poppins-Medium",
    backgroundColor: "#FEE2E2",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  selectedItem: {
    backgroundColor: "#EFF6FF",
  },
  disabledItem: {
    backgroundColor: "#F1F5F9",
  },
  disabledText: {
    color: "#94A3B8",
    fontFamily: "Poppins-Regular",
  },
  componentCard: {
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 12,
  },
  pickerContent: {
    flex: 1,
    flexDirection: "row",
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  selectedText: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    marginLeft: 8,
    fontFamily: "Poppins-Medium",
  },
  placeholderText: {
    color: "#6B7280",
    fontSize: 15,
    marginLeft: 8,
    fontStyle: "italic",
    opacity: 0.7,
  },
  deleteButton: {
    paddingLeft: 15,
    alignSelf: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    marginTop: 8,
  },
  addButtonText: {
    color: "#1E40AF",
    fontSize: 15,
    fontFamily: "Poppins-Medium",
    marginLeft: 8,
  },
  serialInput: {
    height: 50,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FFC107",
    textTransform: "uppercase",
  },
  /* Modal de Components */
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  itemBox: {
    flex: 1,
  },
  partTypeTag: {
    fontSize: 10,
    color: "#64748B",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
    borderRadius: 10,
    fontFamily: "Poppins-Semibold",
  },
  itemText: {
    flex: 1,
    flexShrink: 1,
    marginRight: 6,
    color: "#1E293B",
    fontFamily: "Poppins-Medium",
  },
  serialText: {
    fontSize: 12,
    fontFamily: "Poppins-Italic",
    color: "#64748B",
    marginLeft: 3,
  },
});

export default TicketCompleteScreen;
