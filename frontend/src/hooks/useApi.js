import { useState, useCallback } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (apiCall, options = {}) => {
    const { 
      showSuccessToast = false, 
      showErrorToast = true, 
      successMessage = 'Operation completed successfully',
      onSuccess,
      onError 
    } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(response);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, options = {}) => {
    return request(() => api.get(url), options);
  }, [request]);

  const post = useCallback((url, data, options = {}) => {
    return request(() => api.post(url, data), options);
  }, [request]);

  const put = useCallback((url, data, options = {}) => {
    return request(() => api.put(url, data), options);
  }, [request]);

  const patch = useCallback((url, data, options = {}) => {
    return request(() => api.patch(url, data), options);
  }, [request]);

  const del = useCallback((url, options = {}) => {
    return request(() => api.delete(url), options);
  }, [request]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    clearError
  };
};