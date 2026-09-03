import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const API_URL = `${API_BASE_URL}/api/vendor`;

// Login with email and password
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    
    if (response.data) {
      return {
        success: true,
        token: response.data.token,
        user: response.data.user,
        message: response.data.message,
      };
    }
    return response.data;
  } catch (error) {
    console.error('Login API error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Send OTP for phone login
export const sendLoginOtp = async (phoneNumber) => {
  try {
    const response = await axios.post(`${API_URL}/send-login-otp`, {
      phoneNumber,
    });
    return response.data;
  } catch (error) {
    console.error('Send OTP error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to send OTP' };
  }
};

// Verify OTP
export const verifyOtp = async (phoneNumber, otp) => {
  try {
    const response = await axios.post(`${API_URL}/verify-otp`, {
      phoneNumber,
      otp,
    });
    
    if (response.data) {
      return {
        success: true,
        token: response.data.token,
        user: response.data.user,
        message: response.data.message,
      };
    }
    return response.data;
  } catch (error) {
    console.error('Verify OTP error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'OTP verification failed' };
  }
};

// Vendor Signup
export const signup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, userData);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Signup failed' };
  }
};

// Forgot Password
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to send reset PIN' };
  }
};

// Validate PIN
export const validatePin = async (email, resetPin) => {
  try {
    const response = await axios.post(`${API_URL}/validate-pin`, {
      email,
      resetPin,
    });
    return response.data;
  } catch (error) {
    console.error('Validate PIN error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'PIN validation failed' };
  }
};

// Reset Password
export const resetPassword = async (email, resetPin, newPassword, confirmPassword) => {
  try {
    const response = await axios.post(`${API_URL}/reset-password`, {
      email,
      resetPin,
      newPassword,
      confirmPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Password reset failed' };
  }
};

// Get Vendor Profile
export const getVendorProfile = async (vendorId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/get-vendor`,
      { vendorId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch profile' };
  }
};

// Update Vendor Profile
export const updateVendorProfile = async (vendorId, formData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    // Check if formData is already a FormData object (for files)
    const isFormData = formData instanceof FormData;
    
    const data = isFormData ? formData : { vendorId, ...formData };
    if (isFormData && vendorId) {
      formData.append('vendorId', vendorId);
    }

    const response = await axios.put(
      `${API_URL}/edit-profile`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to update profile' };
  }
};

// Change Password
export const changePassword = async (vendorId, oldPassword, newPassword, confirmPassword) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/edit-password`,
      {
        _id: vendorId,
        oldPassword,
        newPassword,
        confirmPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Change password error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to change password' };
  }
};

// Store FCM Token
export const storeFcmToken = async (vendorId, expoPushToken) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/store-fcm-token`,
      {
        vendorId,
        expoPushToken,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Store FCM token error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to store FCM token' };
  }
};