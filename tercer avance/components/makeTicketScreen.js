import React, { useReducer, useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import CustomAlertModal from "./CustomAlertModal";
import { Picker } from "@react-native-picker/picker";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";

const initialState = {
  firstname: "",
  lastname: "",
  location: "",
  schedule: "",
  date: "",
  problemType: "",
  description: "",
  equipment: "",
  equipmentId: "",
  steps: {
    restartDevice: false,
    checkCable: false,
    checkInternetConnection: false,
  },
};

function reducer(state, action) {
  if (action.type === "RESET_PARTIAL") {
    return {
      ...initialState,
      name: state.name,
      firstname: state.firstname,
      lastname: state.lastname,
      location: state.location,
      schedule: state.schedule,
      date: new Date().toISOString(),
    };
  }

  return {
    ...state,
    [action.name]: action.value,
  };
}

const MakeTicketScreen = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [equipments, setEquipments] = useState([]);
  const { userEmail } = useContext(AuthContext);
  const [formValid, setFormValid] = useState(false);
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    isConfirmation: false,
  });

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    dispatch({ name: "date", value: formattedDate });

    const fetchUserEmail = async () => {
      const email = userEmail || (await AsyncStorage.getItem("userEmail"));
      if (email) {
        dispatch({ name: "name", value: email });
        await fetchUserData(email);
      }
    };

    fetchUserEmail();
  }, [userEmail]);

  useEffect(() => {
    const isValid =
      state.description.trim() !== "" &&
      state.equipment !== "" &&
      state.problemType !== "";
    setFormValid(isValid);
  }, [state.description, state.equipment, state.problemType]);

  const fetchUserData = async (email) => {
    try {
      const q = query(collection(db, "User"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        dispatch({
          name: "firstname",
          value: userData.firstName || "",
        });
        dispatch({
          name: "lastname",
          value: userData.lastName || "",
        });

        if (userData.location) {
          const locationQuery = query(
            collection(db, "Location"),
            where("nameLocal", "==", userData.location),
          );
          const locationSnapshot = await getDocs(locationQuery);

          if (!locationSnapshot.empty) {
            const locationData = locationSnapshot.docs[0].data();
            dispatch({
              name: "location",
              value: locationData.nameLocal || "",
            });
            dispatch({
              name: "schedule",
              value: locationData.openingHours || "",
            });
            await fetchEquipments(locationData.nameLocal);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      showErrorAlert(
        "Failed to load user data. Please exit and re-enter the current screen.",
      );
    }
  };

  const fetchEquipments = async (location) => {
    try {
      if (!location) return;

      const activeQuery = query(
        collection(db, "EquipmentActive"),
        where("location", "==", location),
        where("status", "==", "Active"),
      );
      const activeSnapshot = await getDocs(activeQuery);

      if (activeSnapshot.empty) {
        setEquipments([]);
        return;
      }

      const equipmentList = activeSnapshot.docs.map((doc) => ({
        id: doc.id,
        model: doc.data().model,
        name: doc.data().equipmentId,
      }));

      setEquipments(equipmentList);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      showErrorAlert(
        "Failed to load equipment. Please exit and re-enter the current screen.",
      );
    }
  };

  const getNextTicketId = async () => {
    const ticketCounterRef = doc(db, "Counters", "ticketCounter");

    try {
      const docSnapshot = await getDoc(ticketCounterRef);
      let currentCount = 1;

      if (docSnapshot.exists()) {
        currentCount = docSnapshot.data().count + 1;
      }

      await setDoc(ticketCounterRef, { count: currentCount }, { merge: true });
      return currentCount;
    } catch (error) {
      console.error("Error updating ticket counter:", error);
      showErrorAlert(
        "Failed to generate ticket ID. Please exit and re-enter the current screen.",
      );
      return 1;
    }
  };

  const showErrorAlert = (message) => {
    setAlertContent({
      title: "Error",
      message: message,
      onConfirm: () => setAlertVisible(false),
      isConfirmation: false,
    });
    setAlertVisible(true);
  };

  const showSuccessAlert = (ticketId) => {
    setAlertContent({
      title: "Success",
      message: `Ticket #${ticketId} created successfully!`,
      onConfirm: () => {
        setAlertVisible(false);
        dispatch({ type: "RESET_PARTIAL" });
        navigation.navigate("Tickets");
      },
      isConfirmation: false,
    });
    setAlertVisible(true);
  };

  const handleSubmit = async () => {
    if (!formValid) {
      showErrorAlert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketId = await getNextTicketId();

      const ticketData = {
        ticketId: ticketId,
        employeeName: `${state.firstname} ${state.lastname}`,
        employeeEmail: state.name,
        technicalName: null,
        technicalEmail: null,
        dateCreated: new Date(),
        location: state.location,
        locationHours: state.schedule,
        problemType: state.problemType,
        affectedEquipmentUID: state.equipment,
        affectedEquipment: state.equipmentId,
        description: state.description,
        previousSteps: state.steps,
        status: "Open",
      };

      await addDoc(collection(db, "Ticket"), ticketData);
      showSuccessAlert(ticketId);
    } catch (error) {
      console.error("Error creating ticket:", error);
      showErrorAlert(
        "Failed to create ticket. Please exit and re-enter the current screen.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Support Ticket</Text>
        <View style={styles.headerLine} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Issue Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description*</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={state.description}
            onChangeText={(text) =>
              dispatch({ name: "description", value: text })
            }
            placeholder="Describe the issue you're experiencing"
            multiline
            placeholderTextColor="#95A5A6"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Equipment*</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={state.equipment}
              style={styles.picker}
              dropdownIconColor="#1E3A8A"
              onValueChange={(value) => {
                const selectedEquipment = equipments.find(
                  (eq) => eq.id === value,
                );
                if (selectedEquipment) {
                  dispatch({ name: "equipment", value });
                  dispatch({
                    name: "equipmentId",
                    value: selectedEquipment.name,
                  });
                }
              }}
            >
              <Picker.Item label="Select equipment" value="" />
              {equipments.map((eq) => (
                <Picker.Item
                  key={eq.id}
                  label={`${eq.name} (${eq.model})`}
                  value={eq.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Problem Type*</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={state.problemType}
              onValueChange={(value) =>
                dispatch({ name: "problemType", value })
              }
              style={styles.picker}
            >
              <Picker.Item label="Select problem type" value="" />
              <Picker.Item label="Software" value="Software" />
              <Picker.Item label="Hardware" value="Hardware" />
              <Picker.Item label="Software Update" value="Software Update" />
              <Picker.Item label="Security" value="Security" />
              <Picker.Item label="Configuration" value="Configuration" />
              <Picker.Item label="Connectivity" value="Connectivity" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Troubleshooting Steps</Text>
        <View style={styles.checkboxGroup}>
          <TouchableOpacity
            style={styles.checkboxItem}
            onPress={() =>
              dispatch({
                name: "steps",
                value: {
                  ...state.steps,
                  restartDevice: !state.steps.restartDevice,
                },
              })
            }
          >
            <View
              style={[
                styles.checkbox,
                state.steps.restartDevice && styles.checked,
              ]}
            >
              {state.steps.restartDevice && (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Restart Device</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxItem}
            onPress={() =>
              dispatch({
                name: "steps",
                value: { ...state.steps, checkCable: !state.steps.checkCable },
              })
            }
          >
            <View
              style={[
                styles.checkbox,
                state.steps.checkCable && styles.checked,
              ]}
            >
              {state.steps.checkCable && (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Check Cables</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxItem}
            onPress={() =>
              dispatch({
                name: "steps",
                value: {
                  ...state.steps,
                  checkInternetConnection: !state.steps.checkInternetConnection,
                },
              })
            }
          >
            <View
              style={[
                styles.checkbox,
                state.steps.checkInternetConnection && styles.checked,
              ]}
            >
              {state.steps.checkInternetConnection && (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Check Internet Connection</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          !formValid && styles.buttonDisabled,
          isSubmitting && styles.buttonSubmitting,
        ]}
        onPress={handleSubmit}
        disabled={!formValid || isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Creating Ticket..." : "Submit Ticket"}
        </Text>
      </TouchableOpacity>

      <CustomAlertModal
        visible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        onConfirm={alertContent.onConfirm}
        onCancel={alertContent.onCancel}
        isConfirmation={alertContent.isConfirmation}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F8F9FA",
  },
  header: {
    marginBottom: 25,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  headerLine: {
    height: 3,
    width: 60,
    backgroundColor: "#FFC107",
    borderRadius: 3,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DEE2E6",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#212529",
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  picker: {
    height: 55,
    color: "#212529",
  },
  checkboxGroup: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 10,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ADB5BD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checked: {
    backgroundColor: "#1E3A8A",
    borderColor: "#1E3A8A",
  },
  checkboxLabel: {
    fontSize: 15,
    color: "#212529",
  },
  button: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#ADB5BD",
    shadowColor: "transparent",
  },
  buttonSubmitting: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MakeTicketScreen;
