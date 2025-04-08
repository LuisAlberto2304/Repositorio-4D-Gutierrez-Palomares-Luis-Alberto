import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const LocationDetailScreen = () => {
  const route = useRoute();
  const { item } = route.params;
  const navigation = useNavigation();

  const handleSeeDevice = () => {
    navigation.navigate("Device List", { item });
  };

  const handleSeeHistory = () => {
    navigation.navigate("History", { item });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topRowContainer}>
        {/* Caja de Sucursal */}
        <View style={styles.branchBox}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={100}
              color="#1E3A8A"
            />
          </View>
          <Text style={styles.header}>{item.nameLocal}</Text>
        </View>

        {/* Caja de Acciones */}
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={styles.verticalActionButton}
            onPress={handleSeeDevice}
          >
            <MaterialCommunityIcons
              name="desktop-classic"
              size={42}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>See Devices</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.verticalActionButton}
            onPress={handleSeeHistory}
          >
            <MaterialCommunityIcons name="history" size={42} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>See History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Resto del contenido */}
      <View style={styles.card}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="contacts" size={24} color="#1E3A8A" />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="phone" size={20} color="#1E3A8A" />
            <Text style={styles.infoText}>{item.phoneNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color="#1E3A8A"
            />
            <Text style={styles.infoText}>
              {item.street}, {item.settlement}, {item.state}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color="#1E3A8A"
            />
            <Text style={styles.sectionTitle}>Operating Hours</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="clock-time-eight-outline"
              size={20}
              color="#1E3A8A"
            />
            <Text style={styles.infoText}>{item.openingHours}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: 16,
  },
  topRowContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  branchBox: {
    flex: 2,
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    padding: 12,
    marginRight: 8,
  },
  actionsBox: {
    flex: 1,
    height: "100%",
    borderRadius: 16,
    justifyContent: "space-between",
  },
  iconContainer: {
    backgroundColor: "#FFFFFF",
    width: 120,
    height: 120,
    borderRadius: 120,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  header: {
    fontSize: 30,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    flexShrink: 1,
    textAlign: "center",
  },
  verticalActionButton: {
    height: "49%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#1E3A8A",
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    elevation: 3,
    borderTopWidth: 4,
    borderTopColor: "#FFC107",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#1E293B",
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#475569",
    marginLeft: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    marginLeft: 8,
  },
});

export default LocationDetailScreen;
