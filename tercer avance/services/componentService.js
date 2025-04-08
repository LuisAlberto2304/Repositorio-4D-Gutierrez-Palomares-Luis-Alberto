import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Obtiene todos los componentes donde el campo typeId coincide con el valor proporcionado
 * @param {string} typeId - El ID de tipo a comparar
 * @returns {Promise<Array>} - Array de componentes que coinciden con el typeId
 */
export const getComponentsByTypeId = async (typeId) => {
  try {
    console.log("Buscando componentes para typeId:", typeId);
    if (!typeId) {
      throw new Error("typeId no proporcionado");
    }

    const componentsRef = collection(db, "Component");
    const q = query(componentsRef, where("typeId", "==", typeId));

    const querySnapshot = await getDocs(q);

    const components = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return components;
  } catch (error) {
    console.error("Error completo al obtener componentes:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

export const getTypeIdByComponentName = async (componentName) => {
  try {
    if (!componentName) {
      throw new Error("componentName no proporcionado");
    }

    const componentsRef = collection(db, "Component");
    const q = query(componentsRef, where("name", "==", componentName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Suponiendo que name es único, tomamos el primer documento
      const doc = querySnapshot.docs[0];
      return doc.data().typeId;
    }

    console.warn(`No se encontró componente con name: ${componentName}`);
    return null;
  } catch (error) {
    console.error("Error al obtener typeId por componentName:", error);
    throw error;
  }
};
