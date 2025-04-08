// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userUID, setUserUID] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedStatus = await AsyncStorage.getItem("loggedIn");
        const storedUserEmail = await AsyncStorage.getItem("userEmail");
        const storedUserType = await AsyncStorage.getItem("userType");
        const storedUID = await AsyncStorage.getItem("userUID");

        if (storedStatus === "true") {
          setLoggedIn(true);
          setUserType(parseInt(storedUserType, 10));
          setUserUID(storedUID);
          setUserEmail(storedUserEmail);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };
    checkLoginStatus();
  }, []);

  const logIn = async (type, email, uid) => {
    try {
      setLoggedIn(true);
      setUserType(type);
      setUserEmail(email);
      setUserUID(uid);
      await AsyncStorage.multiSet([
        ["loggedIn", "true"],
        ["userType", type.toString()],
        ["userEmail", email],
        ["userUID", uid],
      ]);
    } catch (error) {
      console.error("Error saving login data:", error);
    }
  };

  const logOut = async () => {
    try {
      await AsyncStorage.multiRemove([
        "loggedIn",
        "userType",
        "userEmail",
        "userUID",
        "equipmentsCache",
        "ticketsCache",
        "metricsCache",
      ]);
      setLoggedIn(false);
      setUserType(null);
      setUserEmail("");
      setUserUID(null);
    } catch (error) {
      console.error("Error clearing storage on logout:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ loggedIn, userType, userEmail, userUID, logIn, logOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
