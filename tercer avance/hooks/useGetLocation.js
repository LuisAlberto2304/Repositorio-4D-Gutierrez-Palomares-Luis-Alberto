import { useState, useEffect } from "react";
import { getOneLocation, getAllLocations } from "../services/locationService";
import { auth } from "../firebaseConfig";

export const useGetLocation = (locationId) => {
  const [location, setLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (locationId) {
          fetchLocationByName(locationId);
        } else {
          fetchAllLocations();
        }
      } else {
        setError("User not authenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLocationByName = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOneLocation(id);
      setLocation(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllLocations();
      setLocations(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    location,
    locations,
    loading,
    error,
    fetchLocationByName,
    fetchAllLocations,
  };
};
