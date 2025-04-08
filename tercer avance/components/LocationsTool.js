import { useNavigation } from "@react-navigation/native";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { View } from "react-native";

const LocationsTool = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.screenContainer}>
      <TouchableOpacity
        style={styles.buttonTool}
        onPress={() => navigation.navigate("All Location")}
      >
        <Image
          style={styles.iconTicket}
          source={require("../assets/Icons/vista.png")}
        />
        <Text style={styles.textTool}>See all locations</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonTool}
        onPress={() => navigation.navigate("Location Admin")}
      >
        <Image
          style={styles.iconTicket}
          source={require("../assets/Icons/administrar.png")}
        />
        <Text style={styles.textTool}>Admin Locations</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    ...(Platform.OS === "web"
      ? {
          flexDirection: "row",
        }
      : {
          flexDirection: "column",
        }),
    alignItems: "center",
    justifyContent: "space-around",
    padding: 25,
  },
  buttonTool: {
    ...(Platform.OS === "web"
      ? {
          height: "80%",
          width: "40%",
        }
      : {
          height: "48%",
          width: "100%",
        }),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    borderRadius: 10,
  },
  iconTicket: {
    maxWidth: 200,
    maxHeight: 200,
    tintColor: "#fff",
    marginBottom: 20,
  },
  textTool: {
    textAlign: "center",
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 24,
  },
});

export default LocationsTool;
