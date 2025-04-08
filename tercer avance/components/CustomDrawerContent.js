import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, Alert, Platform } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import CustomAlertModal from "./CustomAlertModal";

const CustomDrawerContent = (props) => {
  const { logOut } = useContext(AuthContext);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertContent, setAlertContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    isConfirmation: false,
  });

  const handleLogOut = () => {
    setAlertContent({
      title: "Error",
      message: "Are you sure you want to log out?",
      onConfirm: () => {
        setAlertVisible(false);
        logOut();
      },
      onCancel: () => setAlertVisible(false),
      isConfirmation: true,
    });
    setAlertVisible(true);
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <Text style={styles.headerText}>TECNIX</Text>
      </View>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Log Out"
        onPress={handleLogOut}
        labelStyle={styles.logOutText}
      />
      <CustomAlertModal
        visible={alertVisible}
        title={alertContent.title}
        message={alertContent.message}
        onConfirm={alertContent.onConfirm} // Función de confirmación
        onCancel={alertContent.onCancel} // Función de cancelación
        isConfirmation={alertContent.isConfirmation} // Modo
      />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 6,
    marginBottom: 6,
    alignItems: "center",
  },
  headerText: {
    color: "#FFF",
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    fontWeight: "bold",
  },
  logOutText: {
    color: "#FFF",
    fontWeight: "semibold",
  },
});

export default CustomDrawerContent;
