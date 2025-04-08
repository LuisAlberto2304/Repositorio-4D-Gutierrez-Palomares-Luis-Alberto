import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  limit,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import Ionicons from "react-native-vector-icons/Ionicons";
import CustomAlertModal from "./CustomAlertModal";

const AddEquipmentScreen = ({ navigation }) => {
  // States
  const [devices, setDevices] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState({
    initial: false,
    models: false,
    details: false,
    submit: false,
  });

  const [availablePeripherals, setAvailablePeripherals] = useState([]);
  const [peripheralCounter, setPeripheralCounter] = useState(1);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    isConfirmation: false,
  });

  const [deviceData, setDeviceData] = useState({
    deviceId: "",
    serialNumber: "",
    device: "",
    brand: "",
    model: "",
    location: "",
    type: "Desktop Computer",
    status: "Active",
    components: {},
    peripherals: {},
    lastMaintenance: {
      date: null,
      notes: "",
      type: "",
    },
  });

  const [activeSections, setActiveSections] = useState({
    location: true,
    basic: true,
    components: true,
    peripherals: true,
  });

  const deviceIdRef = useRef();
  const serialNumberRef = useRef();
  const deviceTypeRef = useRef();

  // Helper functions
  const showAlert = (
    title,
    message,
    isConfirmation = false,
    onConfirm = () => setAlertVisible(false),
  ) => {
    setAlertContent({
      title,
      message,
      onConfirm,
      isConfirmation,
    });
    setAlertVisible(true);
  };

  const toggleSection = (section) => {
    setActiveSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const generateDeviceId = useCallback((location) => {
    if (!location) return "";

    // Normalize and remove accents
    const normalized = location
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Split into words, ignore first word, and process remaining
    const words = normalized
      .trim()
      .split(/\s+/)
      .slice(1)
      .join("") // Combine words without spaces
      .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
      .toUpperCase();

    return words.length > 0 ? `${words}-` : "LOC-";
  }, []);

  const checkDeviceIdExists = async (deviceId) => {
    try {
      const q = query(
        collection(db, "EquipmentActive"),
        where("deviceId", "==", deviceId),
        limit(1),
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking device ID:", error);
      return true;
    }
  };

  const validateRequiredFields = () => {
    const requiredFields = [
      {
        field: deviceData.location,
        message: "Location is required",
        ref: null,
      },
      {
        field: deviceData.serialNumber,
        message: "Device Serial Number is required",
        ref: serialNumberRef,
      },
      {
        field: deviceData.deviceId,
        message: "Device ID is required",
        ref: deviceIdRef,
      },
      {
        field: deviceData.device,
        message: "Device Type is required",
        ref: deviceTypeRef,
      },
      { field: deviceData.brand, message: "Brand is required", ref: null },
      { field: deviceData.model, message: "Model is required", ref: null },
    ];

    for (const { field, message, ref } of requiredFields) {
      if (!field || field.trim() === "") {
        showAlert("Error", message, false, () => ref?.current?.focus());
        return false;
      }
    }

    // Validate components have serial numbers
    for (const [key, component] of Object.entries(deviceData.components)) {
      if (!component.serialNumber || component.serialNumber.trim() === "") {
        showAlert("Error", `Please enter serial number for ${component.name}`);
        return false;
      }
    }

    // Validate peripherals have serial numbers if any added
    if (Object.keys(deviceData.peripherals).length > 0) {
      for (const [id, peripheral] of Object.entries(deviceData.peripherals)) {
        if (!peripheral.serialNumber || peripheral.serialNumber.trim() === "") {
          showAlert(
            "Error",
            `Please enter serial number for ${peripheral.name}`,
          );
          return false;
        }
      }
    }

    return true;
  };

  const loadInitialData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, initial: true }));

      const [devicesSnapshot, locationsSnapshot, peripheralsSnapshot] =
        await Promise.all([
          getDocs(collection(db, "Equipment")),
          getDocs(collection(db, "Location")),
          getDocs(
            query(
              collection(db, "Component"),
              where("typeId", "not-in", ["CPU", "PSU", "RAM", "MB"]),
            ),
          ),
        ]);

      const devicesData = devicesSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "Unnamed",
        brand: doc.data().brand,
        model: doc.data().model,
      }));

      setDevices(devicesData);
      setBrands([...new Set(devicesData.map((e) => e.brand))].filter((b) => b));

      setLocations(
        locationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().nameLocal || doc.data().name || "Unnamed",
        })),
      );

      setAvailablePeripherals(
        peripheralsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          model: doc.data().model,
          type: doc.data().type,
        })),
      );
    } catch (error) {
      console.error("Error loading initial data:", error);
      showAlert("Error", "Failed to load initial data. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, initial: false }));
    }
  }, []);

  const loadModels = useCallback(
    (brand) => {
      if (!brand) {
        setModels([]);
        return;
      }
      const brandDevices = devices.filter((e) => e.brand === brand);
      const uniqueModels = [
        ...new Set(brandDevices.map((e) => e.model)),
      ].filter((m) => m);
      setModels(uniqueModels);
    },
    [devices],
  );

  const loadDeviceDetails = useCallback(
    async (deviceName) => {
      if (!deviceName) {
        setDeviceData((prev) => ({
          ...prev,
          brand: "",
          model: "",
          components: {},
        }));
        return;
      }

      try {
        setLoading((prev) => ({ ...prev, details: true }));

        // Buscar en los datos locales primero
        const localDevice = devices.find((e) => e.name === deviceName);
        if (localDevice) {
          setDeviceData((prev) => ({
            ...prev,
            brand: localDevice.brand,
            model: localDevice.model,
          }));
        }

        // Consultar Firestore para obtener los components
        const q = query(
          collection(db, "Equipment"),
          where("name", "==", deviceName),
          limit(1),
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          const componentsMap = {};

          // Procesar el mapa de components (que son strings)
          if (docData.components) {
            Object.entries(docData.components).forEach(([key, value]) => {
              componentsMap[key] = {
                name: value, // El valor es directamente el string del componente
                installationDate: new Date(),
                serialNumber: "",
              };
            });
          }

          setDeviceData((prev) => ({
            ...prev,
            components: componentsMap,
            brand: docData.brand || prev.brand,
            model: docData.model || prev.model,
          }));
        }
      } catch (error) {
        console.error("Error loading device details:", error);
        showAlert("Error", "Failed to load device details. Please try again.");
      } finally {
        setLoading((prev) => ({ ...prev, details: false }));
      }
    },
    [devices],
  );

  const handleSerialNumberChange = (componentKey, serialNumber) => {
    setDeviceData((prev) => {
      const updatedComponents = { ...prev.components };
      updatedComponents[componentKey] = {
        ...updatedComponents[componentKey],
        serialNumber: serialNumber.trim(),
        installationDate: new Date(),
      };

      return {
        ...prev,
        components: updatedComponents,
      };
    });
  };

  const handleAddPeripheral = (peripheral) => {
    const peripheralId = `peripheral${peripheralCounter}`;
    setDeviceData((prev) => ({
      ...prev,
      peripherals: {
        ...prev.peripherals,
        [peripheralId]: {
          id: peripheralId,
          name: peripheral.name,
          model: peripheral.model,
          installationDate: new Date(),
          serialNumber: "",
        },
      },
    }));
    setPeripheralCounter((prev) => prev + 1);
  };

  const handleRemovePeripheral = (peripheralId) => {
    setDeviceData((prev) => {
      const newPeripherals = { ...prev.peripherals };
      delete newPeripherals[peripheralId];
      return {
        ...prev,
        peripherals: newPeripherals,
      };
    });
  };

  const handlePeripheralSerialChange = (peripheralId, serialNumber) => {
    setDeviceData((prev) => ({
      ...prev,
      peripherals: {
        ...prev.peripherals,
        [peripheralId]: {
          ...prev.peripherals[peripheralId],
          serialNumber,
          installationDate: new Date(),
        },
      },
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (!validateRequiredFields()) {
      return;
    }

    const deviceExists = await checkDeviceIdExists(deviceData.deviceId);

    if (deviceExists) {
      showAlert(
        "Error",
        "Device ID already exists. Please enter a different ID.",
        false,
        () => deviceIdRef.current?.focus(),
      );
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, submit: true }));

      // Prepare components data
      const componentsToSave = {};
      Object.entries(deviceData.components).forEach(([key, component]) => {
        componentsToSave[key] = {
          name: component.name,
          serialNumber: component.serialNumber,
          installationDate: component.installationDate,
        };
      });

      // Prepare peripherals data
      const peripheralsToSave = {};
      Object.entries(deviceData.peripherals).forEach(([id, peripheral]) => {
        peripheralsToSave[id] = {
          name: peripheral.name,
          model: peripheral.model,
          serialNumber: peripheral.serialNumber,
          installationDate: peripheral.installationDate,
        };
      });

      const deviceToSave = {
        brand: deviceData.brand,
        model: deviceData.model,
        location: deviceData.location,
        serialNumber: deviceData.serialNumber,
        equipmentId: deviceData.deviceId,
        type: "Desktop Computer",
        status: "Active",
        components: componentsToSave,
        peripherals: peripheralsToSave,
        dateCreated: new Date(),
        dateModified: new Date(),
        lastMaintenance: {
          date: null,
          notes: "",
          problemType: "",
        },
      };

      await addDoc(collection(db, "EquipmentActive"), deviceToSave);

      showAlert("Success", "Device successfully registered", false, () =>
        navigation.goBack(),
      );
    } catch (error) {
      console.error("Error saving device:", error);
      showAlert("Error", "Failed to save device. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  }, [deviceData, navigation]);

  // Effects
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (deviceData.brand) {
      loadModels(deviceData.brand);
    }
  }, [deviceData.brand, loadModels]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Location Section */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("location")}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionHeaderText}>Location</Text>
          <Ionicons
            name={activeSections.location ? "chevron-up" : "chevron-down"}
            size={20}
            color="#1E3A8A"
          />
        </TouchableOpacity>

        {activeSections.location && (
          <View style={styles.sectionContent}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={deviceData.location}
                onValueChange={async (value) => {
                  const newId = generateDeviceId(value);
                  setDeviceData((prev) => ({
                    ...prev,
                    location: value,
                    deviceId: newId,
                  }));
                }}
                style={styles.picker}
                dropdownIconColor="#1E3A8A"
              >
                <Picker.Item label="Select a location" value="" />
                {locations.map((location) => (
                  <Picker.Item
                    key={location.id}
                    label={location.name}
                    value={location.name}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Basic Information Section */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("basic")}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionHeaderText}>Device Information</Text>
          <Ionicons
            name={activeSections.basic ? "chevron-up" : "chevron-down"}
            size={20}
            color="#1E3A8A"
          />
        </TouchableOpacity>

        {activeSections.basic && (
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Device Serial Number*</Text>
              <TextInput
                ref={serialNumberRef}
                placeholder="e.g., XAFA221-A"
                autoCapitalize="characters"
                value={deviceData.serialNumber}
                onChangeText={(text) =>
                  setDeviceData({ ...deviceData, serialNumber: text })
                }
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Device ID*</Text>
              <TextInput
                ref={deviceIdRef}
                style={styles.input}
                autoCapitalize="characters"
                value={deviceData.deviceId || ""}
                onChangeText={(text) =>
                  setDeviceData({ ...deviceData, deviceId: text })
                }
                placeholder="e.g., PLAYAS-CAJA001"
              />
              <Text style={styles.hintText}>
                Format Example:{" "}
                {deviceData.location
                  ? generateDeviceId(deviceData.location) + "CAJA001"
                  : "LOCATION-CAJA001"}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Device Type*</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  ref={deviceTypeRef}
                  selectedValue={deviceData.device}
                  onValueChange={(value) => {
                    const selectedDevice = devices.find(
                      (e) => e.name === value,
                    );
                    setDeviceData({
                      ...deviceData,
                      device: value,
                      brand: selectedDevice?.brand || "",
                      model: selectedDevice?.model || "",
                    });
                    loadDeviceDetails(value);
                  }}
                  enabled={!loading.initial}
                  style={styles.picker}
                  dropdownIconColor="#1E3A8A"
                >
                  <Picker.Item label="Select a Device" value="" />
                  {devices.map((device) => (
                    <Picker.Item
                      key={device.id}
                      label={device.name}
                      value={device.name}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Brand*</Text>
              <TextInput
                value={deviceData.brand}
                style={[styles.input, styles.disabledInput]}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Model*</Text>
              <TextInput
                value={deviceData.model}
                style={[styles.input, styles.disabledInput]}
                editable={false}
              />
            </View>
          </View>
        )}

        {/* Components Section */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("components")}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionHeaderText}>Components</Text>
          <Ionicons
            name={activeSections.components ? "chevron-up" : "chevron-down"}
            size={20}
            color="#1E3A8A"
          />
        </TouchableOpacity>

        {activeSections.components && (
          <View style={styles.sectionContent}>
            {loading.details ? (
              <ActivityIndicator size="small" color="#1E3A8A" />
            ) : Object.keys(deviceData.components).length > 0 ? (
              <View style={styles.componentsList}>
                {Object.entries(deviceData.components).map(
                  ([key, component]) => (
                    <View key={key} style={styles.componentCard}>
                      <Text style={styles.componentName}>{component.name}</Text>
                      <TextInput
                        placeholder={`Enter ${component.name} serial number`}
                        autoCapitalize="characters"
                        value={component.serialNumber || ""}
                        onChangeText={(text) =>
                          handleSerialNumberChange(key, text)
                        }
                        style={styles.serialInput}
                      />
                    </View>
                  ),
                )}
              </View>
            ) : (
              <Text style={styles.infoText}>
                No components available. Select a device first.
              </Text>
            )}
          </View>
        )}

        {/* Peripherals Section */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("peripherals")}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionHeaderText}>Peripherals</Text>
          <Ionicons
            name={activeSections.peripherals ? "chevron-up" : "chevron-down"}
            size={20}
            color="#1E3A8A"
          />
        </TouchableOpacity>

        {activeSections.peripherals && (
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Add Peripheral</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue=""
                  onValueChange={(value) => {
                    if (value) {
                      const selected = availablePeripherals.find(
                        (p) => p.id === value,
                      );
                      if (selected) {
                        handleAddPeripheral(selected);
                      }
                    }
                  }}
                  style={styles.picker}
                  dropdownIconColor="#1E3A8A"
                >
                  <Picker.Item label="Select a peripheral" value="" />
                  {availablePeripherals.map((p) => (
                    <Picker.Item key={p.id} label={p.name} value={p.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {Object.keys(deviceData.peripherals).length > 0 && (
              <View style={styles.peripheralsList}>
                {Object.entries(deviceData.peripherals).map(([id, p]) => (
                  <View key={id} style={styles.peripheralCard}>
                    <View style={styles.peripheralHeader}>
                      <Text style={styles.peripheralTitle}>{p.name}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemovePeripheral(id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#e74c3c"
                        />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      placeholder="Enter serial number"
                      autoCapitalize="characters"
                      value={p.serialNumber}
                      onChangeText={(text) =>
                        handlePeripheralSerialChange(id, text)
                      }
                      style={styles.input}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.button, loading.submit && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading.submit}
        >
          {loading.submit ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register Device</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CustomAlertModal
        visible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        onConfirm={alertContent.onConfirm}
        onCancel={alertContent.onCancel}
        isConfirmation={alertContent.isConfirmation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
  },
  sectionContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: "#334155",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 55,
    color: "#1E3A8A",
    fontFamily: "Poppins-Regular",
    borderWidth: 0,
  },
  infoText: {
    color: "#64748b",
    fontFamily: "Poppins-Italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  hintText: {
    fontSize: 12,
    fontFamily: "Poppins-Italic",
    color: "#64748b",
    marginTop: 4,
  },
  componentsList: {
    marginTop: 8,
  },
  componentCard: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#1E3A8A",
  },
  componentName: {
    fontSize: 15,
    fontFamily: "Poppins-Medium",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  serialInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#334155",
  },
  peripheralsList: {
    marginTop: 12,
  },
  peripheralCard: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#1E3A8A",
  },
  peripheralHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  peripheralTitle: {
    fontSize: 15,
    fontFamily: "Poppins-Medium",
    color: "#1E3A8A",
  },
  button: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  disabledInput: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
  },
});

export default AddEquipmentScreen;
