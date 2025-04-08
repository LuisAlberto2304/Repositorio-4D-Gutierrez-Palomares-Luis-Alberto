import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import "../firebaseConfig";
import CustomAlertModal from "./CustomAlertModal";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    isConfirmation: false,
  });

  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isLargeScreen = isWeb && width >= 768;

  // Cache de locations con expiración de 10 minutos
  const [locationsCache, setLocationsCache] = useState({
    data: [],
    timestamp: null,
  });

  const fetchLocations = async () => {
    const now = new Date();
    if (
      locationsCache.timestamp &&
      now.getTime() - locationsCache.timestamp.getTime() < 600000
    ) {
      setLocations(locationsCache.data);
      return;
    }

    setLoadingLocations(true);
    try {
      const querySnapshot = await getDocs(collection(db, "Location"));
      const locationsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLocations(locationsData);
      setLocationsCache({
        data: locationsData,
        timestamp: now,
      });
    } catch (error) {
      console.error("Error fetching locations:", error);
      Alert.alert("Error", "Could not load locations");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName || !phone || !location) {
      setAlertContent({
        title: "Error",
        message: "Please fill all fields",
        onConfirm: () => setAlertVisible(false),
        isConfirmation: false,
      });
      setAlertVisible(true);
      return;
    }

    if (phone.length !== 10) {
      setAlertContent({
        title: "Error",
        message: "Phone number must be 10 digits",
        onConfirm: () => setAlertVisible(false),
        isConfirmation: false,
      });
      setAlertVisible(true);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await setDoc(doc(db, "User", user.uid), {
        firstName,
        lastName,
        email,
        phone,
        location,
        createdAt: new Date(),
      });

      setAlertContent({
        title: "Success",
        message: "Account created successfully!",
        onConfirm: () => {
          setAlertVisible(false);
          navigation.navigate("Login");
        },
        isConfirmation: false,
      });
      setAlertVisible(true);
    } catch (error) {
      setAlertContent({
        title: "Error",
        message: error.message,
        onConfirm: () => setAlertVisible(false),
        isConfirmation: false,
      });
      setAlertVisible(true);
    }
  };

  const openLocationModal = () => {
    fetchLocations();
    setLocationModalVisible(true);
  };

  const handlePhoneChange = (text) => {
    // Solo permitir números y máximo 10 dígitos
    const cleanedText = text.replace(/[^0-9]/g, "");
    if (cleanedText.length <= 10) {
      setPhone(cleanedText);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollView,
          isLargeScreen && styles.scrollViewWeb,
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={[styles.header, isLargeScreen && styles.headerWeb]}>
          <Text style={styles.title}>Create Account</Text>
        </View>

        <View style={[styles.form, isLargeScreen && styles.formWeb]}>
          {isLargeScreen ? (
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="person"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor="#64748B"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="people"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name(s)"
                    placeholderTextColor="#64748B"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>

                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={openLocationModal}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="location-on"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <View style={styles.locationInput}>
                    <Text
                      style={
                        location ? styles.inputText : styles.placeholderText
                      }
                    >
                      {location || "Select Location"}
                    </Text>
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#64748B"
                    />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.column}>
                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="email"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone (10 digits)"
                    placeholderTextColor="#64748B"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="lock"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  {password.length > 0 && (
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? "eye-off" : "eye"}
                        size={24}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="person"
                  size={20}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#64748B"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="people"
                  size={20}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name(s)"
                  placeholderTextColor="#64748B"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <TouchableOpacity
                style={styles.inputContainer}
                onPress={openLocationModal}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <View style={styles.locationInput}>
                  <Text
                    style={location ? styles.inputText : styles.placeholderText}
                  >
                    {location || "Select Location"}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#64748B"
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="email"
                  size={20}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="phone"
                  size={20}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone (10 digits)"
                  placeholderTextColor="#64748B"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="lock"
                  size={20}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                {password.length > 0 && (
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off" : "eye"}
                      size={24}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Location */}
        <Modal
          visible={locationModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setLocationModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity
                onPress={() => setLocationModalVisible(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={24} color="#1E3A8A" />
              </TouchableOpacity>
            </View>

            {loadingLocations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E3A8A" />
              </View>
            ) : (
              <FlatList
                data={locations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.locationItem,
                      location === item.nameLocal &&
                        styles.selectedLocationItem,
                    ]}
                    onPress={() => {
                      setLocation(item.nameLocal);
                      setLocationModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color={
                        location === item.nameLocal ? "#FFC107" : "#1E3A8A"
                      }
                    />
                    <Text
                      style={[
                        styles.locationText,
                        location === item.nameLocal &&
                          styles.selectedLocationText,
                      ]}
                    >
                      {item.nameLocal}
                    </Text>
                    {location === item.nameLocal && (
                      <MaterialIcons
                        name="check"
                        size={20}
                        color="#FFC107"
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </Modal>

        <CustomAlertModal
          visible={alertVisible}
          title={alertContent.title}
          message={alertContent.message}
          onConfirm={alertContent.onConfirm}
          onCancel={alertContent.onCancel}
          isConfirmation={alertContent.isConfirmation}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 0,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 8,
  },
  header: {
    marginTop: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#FFF",
  },
  form: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 25,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#1E293B",
  },
  locationInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  inputText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#1E293B",
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#64748B",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
  },
  signUpButton: {
    backgroundColor: "#1E3A8A",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedLocationItem: {
    backgroundColor: "#EFF6FF",
    borderColor: "#1E3A8A",
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#1E293B",
    marginLeft: 12,
  },
  selectedLocationText: {
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
  },
  checkIcon: {
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  // Nuevos estilos para web
  scrollViewWeb: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  headerWeb: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  formWeb: {
    maxWidth: 800,
    width: "80%",
    alignSelf: "center",
    padding: 30,
  },
  twoColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    width: "48%",
  },
});

export default SignUp;
