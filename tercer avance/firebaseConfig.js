import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native"; // Importa Platform para detectar el entorno
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from "@env";

const firebaseConfig = {
  apiKey: "AIzaSyANIW_Rjj0rBYYONuWLYnkpo5qm50u2uSI",
  authDomain: "tecnix-52017.firebaseapp.com",
  projectId: "tecnix-52017",
  storageBucket: "tecnix-52017.appspot.com",
  messagingSenderId: "507707479407",
  appId: "1:507707479407:android:0e499811cc7f12a54ec49a",
};

const app = initializeApp(firebaseConfig);

let auth;
if (Platform.OS === "web") {
  const { getAuth } = require("firebase/auth");
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

const db = getFirestore(app);

export { auth, db };
