import React, { useContext, useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import FontsTexts from "./components/FontsTexts";
import CustomDrawerContent from "./components/CustomDrawerContent";
import {
  doc,
  getDoc,
  where,
  query,
  collection,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import Login from "./components/LogIn";
import SignUp from "./components/SignUp";
import TicketTool from "./components/TicketTool";
import TicketScreen from "./components/TicketScreen";
import TicketDetailsScreen from "./components/TicketDetailsScreen";
import TicketCompleteScreen from "./components/TicketCompleteScreen";
import MakeTicketScreen from "./components/makeTicketScreen";
import LocationScreen from "./components/LocationScreen";
import LocationDetailScreen from "./components/LocationDetailScreen";
import DeviceTool from "./components/DeviceTool";
import DevicesScreen from "./components/DevicesScreen";
import AddEquipmentScreen from "./components/AddEquipmentScreen";
import TicketsScreen from "./components/WatchTicketsDevice";
import Reports from "./components/Reports";
import TicketChatScreen from "./components/TicketChatScreen";
import ReportsGeneral from "./components/ReportsGeneral";
import ReportsLocation from "./components/ReportsLocation";
import ReportsDevice from "./components/ReportsDevice";
import WatchHistoryScreen from "./components/watchHistoryScreen";
import WatchHistoryScreenTec from "./components/WatchHistoryScreenTec";
import ComponentsScreen from "./components/ComponentsScreen";
import TechnicianFeedback from "./components/TechnicanFeedback";
//JEFE
import UsersScreen from "./components/UserScreen";
//EMPLEADO
import EmployeeFeedbackScreen from "./components/EmployeeFeedbackScreen";

//GENERAL
import ProfileScreen from "./components/ProfileScreen";

import HomeTec from "./components/Homes/HomeTec";
import HomeJef from "./components/Homes/HomeJef";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function TicketsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Ticket Tool"
        component={TicketTool}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Pending Ticket" component={TicketScreen} />
      <Stack.Screen name="Ticket Details" component={TicketDetailsScreen} />
      <Stack.Screen
        name="Ticket Complete"
        component={TicketCompleteScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Ticket History" component={WatchHistoryScreenTec} />
      <Stack.Screen
        name="TicketChat"
        component={TicketChatScreen}
        options={{ title: "Ticket Chat" }}
      />
    </Stack.Navigator>
  );
}

function TicketsStackJefe() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Ticket Screen"
        component={TicketScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Ticket Details" component={TicketDetailsScreen} />
      <Stack.Screen
        name="Ticket Complete"
        component={TicketCompleteScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function LocationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Locations Tool"
        component={LocationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Location Detail" component={LocationDetailScreen} />
      <Stack.Screen name="Device List" component={DevicesScreen} options={{ title: "Device List" }} />
      <Stack.Screen name="History" component={WatchHistoryScreen} options={{ title: "History: Location" }} />
      <Stack.Screen name="FeedBack" component={EmployeeFeedbackScreen} options={{ title: "Feedback"}} />
      <Stack.Screen name="TecFeedBack" component={TechnicianFeedback} options={{title: "Technical Feedback"}} />
      <Stack.Screen name="TicketsScreen" component={TicketsScreen} options={{ title: "Tickets Device" }} />
      <Stack.Screen name="ComponentsScreen" component={ComponentsScreen} options={{ title: "Components/Peripherals" }} />
      <Stack.Screen name="Ticket Details" component={TicketDetailsScreen} />
    </Stack.Navigator>
  );
}

function LocationsStackJefe() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Locations Tool"
        component={LocationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Location Detail" component={LocationDetailScreen} />
      <Stack.Screen
        name="Device List"
        component={DevicesScreen}
        options={{ title: "Device List" }}
      />
      <Stack.Screen
        name="History"
        component={WatchHistoryScreen}
        options={{ title: "History: Location" }}
      />
      <Stack.Screen
        name="TicketsScreen"
        component={TicketsScreen}
        options={{ title: "Tickets Device" }}
      />
      <Stack.Screen
        name="ComponentsScreen"
        component={ComponentsScreen}
        options={{ title: "Components/Peripherals" }}
      />
      <Stack.Screen name="Ticket Details" component={TicketDetailsScreen} />
    </Stack.Navigator>
  );
}

function DevicesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Devices Tool"
        component={DeviceTool}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Add Device"
        component={AddEquipmentScreen}
        options={{ title: "New Device" }}
      />
      <Stack.Screen
        name="Device List"
        component={DevicesScreen}
        options={{ title: "Device List" }}
      />
      <Stack.Screen
        name="TicketsScreen"
        component={TicketsScreen}
        options={{ title: "Tickets Device" }}
      />
      <Stack.Screen name="Device Detail" component={LocationDetailScreen} />
      <Stack.Screen name="Ticket Details" component={TicketDetailsScreen} />
      <Stack.Screen
        name="ComponentsScreen"
        component={ComponentsScreen}
        options={{ title: "Components/Peripherals" }}
      />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReportsMain"
        component={Reports}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GeneralPerformance"
        component={ReportsGeneral}
        options={{ title: "Technicians Performance" }}
      />
      <Stack.Screen
        name="LocationPerformance"
        component={ReportsLocation}
        options={{ title: "Locations Performance" }}
      />
      <Stack.Screen
        name="DevicePerformance"
        component={ReportsDevice}
        options={{ title: "Devices Performance" }}
      />
    </Stack.Navigator>
  );
}

function HistoryUserStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HistoryMain" component={WatchHistoryScreen} options={{ title: "History" }} />
      <Stack.Screen
        name="TicketChat"
        component={TicketChatScreen}

      />
    </Stack.Navigator>
  );
}
function getDrawerScreens(tipoUser) {
  switch (tipoUser) {
    case 1:
      return (
        <>
          <Drawer.Screen name="Home" component={HomeTecStack} />
          <Drawer.Screen name="Tickets" component={TicketsStack} />
          <Drawer.Screen name="Devices" component={DevicesStack} />
          <Drawer.Screen name="Locations" component={LocationsStack} />
          <Drawer.Screen name="FeedBack" component={TechnicianFeedback} />
          <Drawer.Screen name="Reports" component={ReportsStack} />
          <Drawer.Screen name="Profile" component={ProfileScreen} />
        </>
      );
    case 2:
      return (
        <>
          <Drawer.Screen name="Home" component={HomeJef} />
          <Drawer.Screen name="Users" component={UsersScreen} />
          <Drawer.Screen
            name="Ticket Management"
            component={TicketsStackJefe}
          />
          <Drawer.Screen
            name="Locations Management"
            component={LocationsStackJefe}
          />
          <Drawer.Screen name="Devices" component={DevicesStack} />
          <Drawer.Screen name="Reports" component={ReportsStack} />
          <Drawer.Screen name="Profile" component={ProfileScreen} />
        </>
      );
    case 3:
      return (
        <>
          <Drawer.Screen name="Home" component={HomeScreenEmp} />
          <Drawer.Screen name="Tickets" component={MakeTicketScreen} />
          <Drawer.Screen name="History" component={HistoryUserStack} />
          <Drawer.Screen name="Feedback" component={EmployeeFeedbackScreen} />
          <Drawer.Screen name="Profile" component={ProfileScreen} />
        </>
      );
    default:
      return (
        <>
          <Drawer.Screen name="Home" component={HomeScreenEmp} />
        </>
      );
  }
}

function AppContent() {
  const { loggedIn, userType } = useContext(AuthContext);
  const dimensions = useWindowDimensions();
  const isLargeScreen = dimensions.width >= 770;

  if (!loggedIn) {
    return (
      <FontsTexts>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Login"
              component={Login}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUp}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </FontsTexts>
    );
  }

  return (
    <FontsTexts>
      <NavigationContainer>
        <Drawer.Navigator
          initialRouteName="Home"
          screenOptions={{
            drawerType: isLargeScreen ? "permanent" : "slide",
            drawerStyle: isLargeScreen ? null : { width: "100%" },
            overlayColor: "transparent",
            drawerStyle: {
              backgroundColor: "#1E3A8A",
              ...(Platform.OS === "web" && {
                borderRightWidth: 1,
                borderRightColor: "#1E3A8A",
              }),
            },
            drawerActiveTintColor: "white",
            drawerActiveBackgroundColor: "#003CB3",
            drawerLabelStyle: {
              color: "white",
            },
          }}
          drawerContent={(props) => <CustomDrawerContent {...props} />}
        >
          {getDrawerScreens(userType)}
        </Drawer.Navigator>
        <StatusBar style="auto" translucent={false} backgroundColor="#faec5c" />
      </NavigationContainer>
    </FontsTexts>
  );
}

const HomeScreenEmp = () => {
  const { userEmail } = useContext(AuthContext); // Obtener el correo desde el contexto
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!userEmail) return;

    const fetchUserInfo = async () => {
      try {
        const userQuery = query(
          collection(db, "User"),
          where("email", "==", userEmail),
        );
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
          setUserInfo(querySnapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchUserInfo();
  }, [userEmail]);

  return (
    <View style={styles1.screenContainer}>
      <Text style={styles1.textMain}>Welcome Employee</Text>
      {userInfo ? (
        <View style={styles1.cardContainer}>
          <View style={styles1.card}>
            <Ionicons name="person-outline" size={24} color="#5DADE2" />
            <Text style={styles1.cardText}>
              Name: {userInfo.firstName} {userInfo.lastName}
            </Text>
          </View>
          <View style={styles1.card}>
            <Ionicons name="mail-outline" size={24} color="#5DADE2" />
            <Text style={styles1.cardText}>Email: {userInfo.email}</Text>
          </View>
          <View style={styles1.card}>
            <Ionicons name="location-outline" size={24} color="#5DADE2" />
            <Text style={styles1.cardText}>Location: {userInfo.location}</Text>
          </View>
          <View style={styles1.card}>
            <Ionicons name="call-outline" size={24} color="#5DADE2" />
            <Text style={styles1.cardText}>Phone: {userInfo.phone}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles1.loadingText}>Loading information...</Text>
      )}
    </View>
  );
};

function HomeTecStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeTec"
        component={HomeTec}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Ticket Details" component={TicketDetailsScreen} />
      <Stack.Screen
        name="Ticket Complete"
        component={TicketCompleteScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  textMain: {
    fontFamily: "Poppins-Bold",
    fontSize: 50,
    textAlign: "center",
    lineHeight: 46,
    margin: 20,
    paddingTop: 10,
    color: "#2E2E2E",
  },
  emailText: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  card: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  containerTopCard: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FFC107",
  },
  cardTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 20,
    color: "#2E2E2E",
  },
  view: {
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    width: 80,
    borderRadius: 3,
  },
  viewText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#1E3A8A",
  },
  cardContent: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#2E2E2E",
    marginVertical: 5,
  },
  ticketItem: {
    marginVertical: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  ticketCode: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#1E3A8A",
  },
  ticketTitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#333",
  },
  ticketPriority: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
  },
  highPriority: {
    color: "#E74C3C",
  },
  normalPriority: {
    color: "#3498DB",
  },
  ticketDate: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#777",
  },
  actionButton: {
    backgroundColor: "#1E3A8A",
    padding: 12,
    borderRadius: 5,
    marginVertical: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFF",
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
  },
});

const styles1 = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  textMain: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  cardContainer: {
    width: "100%",
    marginTop: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 18,
    color: "#888",
    fontStyle: "italic",
  },
});
