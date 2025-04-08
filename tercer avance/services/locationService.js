import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const getOneLocation = async (location = null) => {
  try {
    const que = query(
      collection(db, "Location"),
      where("nameLocal", "==", location),
    );
    const querySnapshot = await getDocs(que);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching location:", error);
    throw error;
  }
};

export const getAllLocations = async () => {
  try {
    const snapshot = await getDocs(collection(db, "Location"));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
};
