import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import FontsTexts from "./FontsTexts";
import "../firebaseConfig";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const auth = getAuth();
  const { logIn } = useContext(AuthContext);
  const db = getFirestore();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isLargeScreen = isWeb && width >= 768;

  // Función para verificar el rol del usuario y obtener su UID del documento
  const checkUserRole = async (email) => {
    const collections = ["Technical", "Administrator", "User"];
    for (let i = 0; i < collections.length; i++) {
      const colRef = collection(db, collections[i]);
      const q = query(colRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        return {
          userType: i + 1, // 1 para Technical, 2 para Administrator, 3 para User
          docId: docId,
        };
      }
    }
    return null;
  };

  // Manejador de autenticación con email y contraseña
  const handleLogIn = async () => {
    try {
      if (!email || !password) {
        setError("Please enter your email and password");
        return;
      }

      setIsLoading(true);
      setError(null);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const userInfo = await checkUserRole(user.email);
      if (userInfo) {
        logIn(userInfo.userType, user.email, userInfo.docId);
      } else {
        setError("User not found in any category");
      }
    } catch (error) {
      console.log("Login error:", error);
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  // Navegación a la pantalla de registro
  const handleSignUp = () => {
    navigation.navigate("SignUp");
  };

  return (
    <FontsTexts>
      <LinearGradient colors={["#007AFF", "#1E3A8A"]} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contentContainer}>
              <View style={styles.logoContainer}>
                <Image
                  style={styles.logo}
                  source={require("../assets/TecnixLogoBlanco.png")}
                />
              </View>

              <View
                style={[
                  styles.infoContainer,
                  isLargeScreen && styles.infoContainerWeb,
                ]}
              >
                <Text style={styles.title}>Let's Get to Work</Text>
                <Text style={styles.subtitle}>
                  Sign in to access your account
                </Text>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={24}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleLogIn}
                  style={styles.loginButton}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.loginText}>Log In</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={handleSignUp}>
                    <Text style={styles.signUpLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </FontsTexts>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    ...(Platform.OS === "web" && {
      flexDirection: "row",
      maxWidth: 1000,
      alignSelf: "center",
      width: "100%",
    }),
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web"
      ? {
          width: "50%",
          paddingRight: 40,
        }
      : {
          width: "100%",
          marginBottom: 30,
        }),
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: "contain",
  },
  infoContainer: {
    justifyContent: "center",
    width: Platform.OS === "web" ? "50%" : "100%",
    maxWidth: 400,
  },
  infoContainerWeb: {
    paddingLeft: 40,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.2)",
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    color: "#FFF",
    marginBottom: 8,
    textAlign: Platform.OS === "web" ? "left" : "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#E2E8F0",
    marginBottom: 30,
    textAlign: Platform.OS === "web" ? "left" : "center",
  },
  errorContainer: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
  },
  errorText: {
    color: "#FECACA",
    fontFamily: "Poppins-Medium",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#1E293B",
  },
  loginButton: {
    backgroundColor: "#FFC107",
    padding: 16,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginText: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#1E3A8A",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  signUpText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#E2E8F0",
  },
  signUpLink: {
    color: "#FFD700",
    fontFamily: "Poppins-SemiBold",
    textDecorationLine: "underline",
  },
});

export default Login;
