import { useNavigation } from "@react-navigation/native";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LocationAdmin = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.screenContainer}>
      {/* First row with two buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.buttonTool}
          onPress={() => navigation.navigate("Add Location")}
        >
          <Image
            style={styles.iconTicket}
            source={require("../assets/Icons/vista.png")}
          />
          <Text style={styles.textTool}>Add Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonTool}
          onPress={() => navigation.navigate("Disable Location")}
        >
          <Image
            style={styles.iconTicket}
            source={require("../assets/Icons/administrar.png")}
          />
          <Text style={styles.textTool}>Desactivar Locacion</Text>
        </TouchableOpacity>
      </View>

      {/* Second row with single centered button */}
      <View style={styles.singleButtonContainer}>
        <TouchableOpacity
          style={[styles.buttonTool, styles.singleButton]}
          onPress={() => navigation.navigate("Delete Location")} // Add your navigation target here
        >
          <Image
            style={styles.iconTicket}
            source={require("../assets/Icons/agregar.png")} // Add your icon
          />
          <Text style={styles.textTool}>Delete Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    alignItems: "center",
    padding: 25,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  singleButtonContainer: {
    width: "100%",
    alignItems: "center",
  },
  buttonTool: {
    ...(Platform.OS === "web"
      ? {
          height: 180,
          width: "45%",
        }
      : {
          height: 200,
          width: "48%",
        }),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    borderRadius: 10,
    padding: 10,
  },
  singleButton: {
    ...(Platform.OS === "web"
      ? {
          width: "60%",
        }
      : {
          width: "80%",
        }),
  },
  iconTicket: {
    width: 50,
    height: 50,
    tintColor: "#fff",
    marginBottom: 15,
  },
  textTool: {
    textAlign: "center",
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: Platform.OS === "web" ? 20 : 18,
  },
});

export default LocationAdmin;
