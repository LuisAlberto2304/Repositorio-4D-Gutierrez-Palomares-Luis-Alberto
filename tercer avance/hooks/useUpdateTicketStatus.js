import { useState } from "react";
import { updateTicketStatus } from "../services/ticketService";

export const useUpdateTicketStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateStatus = async (ticketId, newStatus) => {
    try {
      setLoading(true);
      await updateTicketStatus(ticketId, newStatus);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };
  return { loading, error, updateStatus };
};
