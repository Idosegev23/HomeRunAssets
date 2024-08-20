import { useState, useCallback } from 'react';
import api from '../utils/api.js';
export const useMatchingProperties = () => {
  const [matchingProperties, setMatchingProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const findMatchingProperties = useCallback(async (customer) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/matchingProperties/${customer.id}`);
      setMatchingProperties(response.data);
    } catch (err) {
      setError(`שגיאה בטעינת נכסים מתאימים: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return { matchingProperties, loading, error, findMatchingProperties };
};