import { useState } from "react";
import { getTicketByFolio } from "../services/ticketService";

export const useTicketDetails = () => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTicketByFolio = async (folio) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Buscando ticket con folio:", folio);
      const data = await getTicketByFolio(folio);
      console.log("Ticket encontrado:", data);
      setTicket(data);
    } catch (err) {
      console.error("Error en fetchTicketByFolio:", err);
      setError(err.message || "Error al buscar el ticket");
    } finally {
      setLoading(false);
    }
  };

  return { ticket, loading, error, fetchTicketByFolio };
};
