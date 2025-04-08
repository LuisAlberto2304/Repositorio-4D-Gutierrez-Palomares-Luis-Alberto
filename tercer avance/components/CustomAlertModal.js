import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

const CustomAlertModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  isConfirmation,
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        {isConfirmation /*Lógica de botones según el modo | Modo Confirmacion*/ ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onCancel}
              style={[
                styles.button,
                styles.cancelButton,
                { paddingVertical: 2, paddingHorizontal: 1 },
              ]}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={[
                styles.button,
                styles.saveButton,
                { paddingVertical: 10, paddingHorizontal: 1 },
              ]}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /*Modo Aviso*/
          <TouchableOpacity
            onPress={onConfirm}
            style={[
              styles.button,
              styles.saveButton,
              {
                paddingVertical: 10,
                paddingHorizontal: 1,
                alignSelf: "flex-end",
              },
            ]}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  alertTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#64748B",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
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
});

export default CustomAlertModal;
