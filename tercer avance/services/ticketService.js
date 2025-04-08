import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export const getTicketByFolio = async (folio) => {
  try {
    const ticketRef = collection(db, "Ticket");
    const q = query(ticketRef, where("folio", "==", folio));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No se encontró ningún ticket con ese folio.");
      return null; // Devuelve null si no se encuentra ningún ticket
    }

    // Como el folio es único, solo habrá un documento en el resultado
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() }; // Devuelve el ticket encontrado
  } catch (error) {
    console.error("Error al obtener el ticket por folio: ", error);
    throw error; // Lanza el error para que pueda ser manejado por el llamador
  }
};

export const getAllTicketsPendingForTech = async (technicalEmail) => {
  try {
    const ticketRef = collection(db, "Ticket");
    const q = query(ticketRef, where("technicalEmail", "==", technicalEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No se encontraron tickets.");
      return []; // Devuelve un array vacío si no hay tickets
    }

    const tickets = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.dateFinished === null) {
        tickets.push({ id: doc.id, ...data });
      }
    });

    return tickets; // Devuelve un array con todos los tickets
  } catch (error) {
    console.error(
      "Error al obtener todos los tickets para el técnico: ",
      error,
    );
    throw error; // Lanza el error para que pueda ser manejado por el llamador
  }
};

export const getAllTickets = async () => {
  try {
    const ticketRef = collection(db, "Ticket");
    const querySnapshot = await getDocs(ticketRef);

    if (querySnapshot.empty) {
      console.log("No se encontraron tickets.");
      return []; // Devuelve un array vacío si no hay tickets
    }

    const tickets = [];
    querySnapshot.forEach((doc) => {
      tickets.push({ id: doc.id, ...doc.data() });
    });

    return tickets; // Devuelve un array con todos los tickets
  } catch (error) {
    console.error("Error al obtener todos los tickets: ", error);
    throw error; // Lanza el error para que pueda ser manejado por el llamador
  }
};

export const updateTicketFinished = async (ticketId) => {
  try {
    const ticketRef = doc(db, "Ticket", ticketId);
    await updateDoc(ticketRef, {
      status: "Resolved",
      dateFinished: serverTimestamp(),
    });
    console.log("Estado del ticket actualizado correctamente.");
  } catch (error) {
    console.error("Error al actualizar el estado del ticket: ", error);
    throw error; // Lanza el error para que pueda ser manejado por el llamador
  }
};

export const updateTicketDetails = async (ticketId, updatedDetails) => {
  try {
    const ticketRef = doc(db, "Ticket", ticketId);
    await updateDoc(ticketRef, updatedDetails);
    console.log("Detalles del ticket actualizados correctamente.");
  } catch (error) {
    console.error("Error al actualizar los detalles del ticket: ", error);
    throw error; // Lanza el error para que pueda ser manejado por el llamador
  }
};
