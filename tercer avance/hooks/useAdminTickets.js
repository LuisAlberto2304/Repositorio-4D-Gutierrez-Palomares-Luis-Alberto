import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const useAllTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    console.log("Configurando listener para TODOS los tickets");

    // Consulta para obtener todos los tickets sin filtros
    const ticketRef = collection(db, "Ticket");
    const q = query(ticketRef);

    // Configura el listener en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const ticketsData = [];
        querySnapshot.forEach((doc) => {
          ticketsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        console.log(`Se encontraron ${ticketsData.length} tickets`);
        setTickets(ticketsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error en listener de tickets:", err);
        setError(err.message || "Error al cargar tickets");
        setLoading(false);
      },
    );

    // Limpieza al desmontar
    return () => {
      console.log("Desuscribiendo listener de tickets");
      unsubscribe();
    };
  }, []); // Array de dependencias vacío para ejecutar solo una vez

  const filteredTickets = (tickets || []).filter(
    (t) => t.status !== "Desactivado" && t.status !== "desactivado",
  );
  return { tickets, loading, error };
};
