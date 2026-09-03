import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin, verifyOtp, sendLoginOtp } from '../services/vendorAuthService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Load user from storage on app start
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } else if (token) {
        // Fallback: recover basic info from token if user object missing
        try {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp > currentTime) {
            const userId = decoded._id || decoded.id;
            setUser({ 
              _id: userId, 
              userName: decoded.userName, 
              email: decoded.email,
              phoneNumber: decoded.phoneNumber,
              role: decoded.role 
            });
            setIsAuthenticated(true);
          }
        } catch (decodeError) {
          console.error('Failed to decode token fallback:', decodeError);
        }
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiLogin(email, password);
      
      if (response.success || response.token) {
        const userData = response.user || response;
        const token = response.token;
        
        // Store user data and token
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('userType', 'vendor');
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        setError(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP for phone login
  const sendOtp = async (phoneNumber) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sendLoginOtp(phoneNumber);
      
      if (response.success) {
        return { success: true, message: 'OTP sent successfully' };
      } else {
        setError(response.message || 'Failed to send OTP');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setError(error.message || 'Failed to send OTP');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and login
  const verifyOtpAndLogin = async (phoneNumber, otp) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await verifyOtp(phoneNumber, otp);
      
      if (response.success) {
        const userData = response.user;
        const token = response.token;
        
        // Store user data and token
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('userType', 'vendor');
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        setError(response.message || 'OTP verification failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.message || 'OTP verification failed');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Clear stored data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userType');
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data
  const updateUser = async (updatedData) => {
    try {
      const updatedUser = { ...user, ...updatedData };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      setError(error.message || 'Failed to update user');
      return { success: false, message: error.message };
    }
  };

  // Clear error
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        error,
        login,
        sendOtp,
        verifyOtpAndLogin,
        logout,
        updateUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};