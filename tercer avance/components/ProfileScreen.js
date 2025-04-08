import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import FontsTexts from "./FontsTexts";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import CustomAlertModal from "./CustomAlertModal";

const ProfileScreen = () => {
  const { userType, userEmail, userUID } = useContext(AuthContext);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    isConfirmation: false,
  });
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const db = getFirestore();

  const IMGBB_API_KEY = "9c8a1d12f51ec7241365e439a523c978";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userUID || !userType) {
          setLoading(false);
          return;
        }

        let collectionName = "";
        switch (userType) {
          case 1:
            collectionName = "Technical";
            break;
          case 2:
            collectionName = "Administrator";
            break;
          case 3:
            collectionName = "User";
            break;
          default:
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, collectionName, userUID);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userUID, userType]);

  const handleImagePick = async () => {
    try {
      const options = {
        title: "Selecciona una foto",
        storageOptions: {
          skipBackup: true,
          path: "images",
        },
        quality: 0.8,
        mediaType: "photo",
      };

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1], // Relación de aspecto cuadrada (para avatar)
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      Alert.alert("Error", "No se pudo abrir la galería.");
    }
  };

  const uploadImage = async (uri) => {
    if (!userUID || !userType) return;

    setUploading(true);

    try {
      // Determinar la colección según el tipo de usuario
      let collectionName = "";
      switch (userType) {
        case 1:
          collectionName = "Technical";
          break;
        case 2:
          collectionName = "Administrator";
          break;
        case 3:
          collectionName = "User";
          break;
        default:
          return;
      }

      // Convertir imagen a FormData para ImgBB
      const formData = new FormData();
      formData.append("image", {
        uri: uri,
        type: "image/jpeg",
        name: "profile.jpg",
      });

      // Subir a ImgBB
      const imgbbResponse = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const imageUrl = imgbbResponse.data.data.url;

      // Actualizar Firestore con la nueva URL
      const userDocRef = doc(db, collectionName, userUID);
      await updateDoc(userDocRef, {
        photoURL: imageUrl,
      });

      // Actualizar el estado local
      setUserData((prev) => ({ ...prev, photoURL: imageUrl }));

      Alert.alert("Éxito", "Foto de perfil actualizada");
    } catch (error) {
      console.error("Error al subir imagen:", error);
      Alert.alert("Error", "No se pudo actualizar la foto de perfil");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>No se encontraron datos del usuario</Text>
      </View>
    );
  }

  return (
    <FontsTexts>
      <LinearGradient colors={["#007AFF", "#1E3A8A"]} style={styles.container}>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                userData.photoURL
                  ? { uri: userData.photoURL }
                  : require("../assets/pfp.jpg")
              }
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.editIcon}
              onPress={handleImagePick}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>
            {(userData.firstName ||
              userData.fullName ||
              "Nombre no proporcionado") +
              (userData.lastName ? ` ${userData.lastName}` : "")}
          </Text>
          <Text style={styles.email}>{userEmail}</Text>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tipo de usuario:</Text>
              <Text style={styles.infoValue}>
                {userType === 1
                  ? "Técnico"
                  : userType === 2
                    ? "Administrador"
                    : "Usuario"}
              </Text>
            </View>

            {userData.phone && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{userData.phone}</Text>
              </View>
            )}

            {userData.specialty && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Especialidad:</Text>
                <Text style={styles.infoValue}>{userData.specialty}</Text>
              </View>
            )}

            {userData.address && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Dirección:</Text>
                <Text style={styles.infoValue}>{userData.address}</Text>
              </View>
            )}
          </View>

          {userType === 1 && userData.rating && (
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
              <Text style={styles.ratingText}>{userData.rating}</Text>
            </View>
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
      </LinearGradient>
    </FontsTexts>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#DDD",
    marginBottom: 30,
  },
  infoSection: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
    paddingBottom: 5,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: "#DDD",
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: 16,
    color: "#FFF",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 18,
    color: "#FFD700",
    fontWeight: "bold",
    marginLeft: 5,
  },
});

export default ProfileScreen;
