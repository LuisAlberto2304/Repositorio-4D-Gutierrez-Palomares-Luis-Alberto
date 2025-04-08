import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const useTechnicianTickets = (techEmail) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hacer lo mismo en useAllTickets
  useEffect(() => {
    if (!techEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("Configurando listener para tickets del técnico:", techEmail);

    // Crea la consulta
    const ticketRef = collection(db, "Ticket"); // Asegúrate que el nombre sea correcto
    const q = query(ticketRef, where("technicalEmail", "==", techEmail));

    // Configura el listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const ticketsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Puedes mantener el filtro adicional si es necesario
          if (data.dateFinished === null || data.dateFinished === undefined) {
            ticketsData.push({ id: doc.id, ...data });
          }
        });

        console.log(
          `Se encontraron ${ticketsData.length} tickets actualizados`,
        );
        setTickets(ticketsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error en listener de tickets:", err);
        setError(err.message || "Error al escuchar cambios en tickets");
        setLoading(false);
      },
    );

    // Función de limpieza que se ejecuta cuando el componente se desmonta
    // o cuando cambia techEmail
    return () => {
      console.log("Desuscribiendo listener de tickets");
      unsubscribe();
    };
  }, [techEmail]); // Solo vuelve a configurar el listener si cambia el techEmail

  const filteredTickets = (tickets || []).filter(
    (t) => t.status !== "Desactivado" && t.status !== "desactivado",
  );
  return { tickets, loading, error };
};
