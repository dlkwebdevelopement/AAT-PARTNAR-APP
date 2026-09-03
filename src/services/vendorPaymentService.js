import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const API_URL = `${API_BASE_URL}/api/vendor-payment`;

// ==================== UPI SERVICES ====================

/**
 * Add a new UPI ID
 * @param {string} vendorId 
 * @param {object} upiData { upiId, accountHolderName, isDefault }
 */
export const addUpiId = async (vendorId, upiData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${API_URL}/add-upi`, 
      { vendorId, ...upiData },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Add UPI error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to add UPI ID' };
  }
};

/**
 * Delete a UPI ID
 * @param {string} vendorId 
 * @param {string} upiId 
 */
export const deleteUpiId = async (vendorId, upiId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/delete-upi/${vendorId}/${upiId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Delete UPI error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to delete UPI ID' };
  }
};

/**
 * Set a UPI ID as default
 * @param {string} vendorId 
 * @param {string} upiId 
 */
export const setDefaultUpi = async (vendorId, upiId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.put(`${API_URL}/set-default-upi`, 
      { vendorId, upiId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Set default UPI error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to set default UPI' };
  }
};

/**
 * Generate/Regenerate QR Code for a UPI ID
 * @param {string} vendorId 
 * @param {string} upiId 
 */
export const generateUpiQrCode = async (vendorId, upiId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/generate-upi-qr/${vendorId}/${upiId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Generate QR error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to generate QR code' };
  }
};

// ==================== BANK ACCOUNT SERVICES ====================

/**
 * Add a new Bank Account
 * @param {string} vendorId 
 * @param {object} bankData { accountNumber, ifscCode, accountHolderName, bankName, accountType, isDefault, cancelledCheque }
 */
export const addBankAccount = async (vendorId, bankData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${API_URL}/add-bank`, 
      { vendorId, ...bankData },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Add bank error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to add bank account' };
  }
};

/**
 * Delete a Bank Account
 * @param {string} vendorId 
 * @param {string} accountId 
 */
export const deleteBankAccount = async (vendorId, accountId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/delete-bank/${vendorId}/${accountId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Delete bank error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to delete bank account' };
  }
};

/**
 * Set a Bank Account as default
 * @param {string} vendorId 
 * @param {string} accountId 
 */
export const setDefaultBankAccount = async (vendorId, accountId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.put(`${API_URL}/set-default-bank`, 
      { vendorId, accountId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Set default bank error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to set default bank account' };
  }
};

// ==================== CARD SERVICES ====================

/**
 * Add a new Card
 * @param {string} vendorId 
 * @param {object} cardData { cardNumber, cardHolderName, expiryMonth, expiryYear, cardType, cardNetwork, isDefault, cardImage }
 */
export const addCard = async (vendorId, cardData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${API_URL}/add-card`, 
      { vendorId, ...cardData },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Add card error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to add card' };
  }
};

/**
 * Delete a Card
 * @param {string} vendorId 
 * @param {string} cardId 
 */
export const deleteCard = async (vendorId, cardId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/delete-card/${vendorId}/${cardId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Delete card error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to delete card' };
  }
};

/**
 * Set a Card as default
 * @param {string} vendorId 
 * @param {string} cardId 
 */
export const setDefaultCard = async (vendorId, cardId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.put(`${API_URL}/set-default-card`, 
      { vendorId, cardId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Set default card error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to set default card' };
  }
};

// ==================== PROFILE & SETTINGS ====================

/**
 * Get Vendor Payment Profile
 * @param {string} vendorId 
 */
export const getPaymentProfile = async (vendorId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${API_URL}/get-payment-profile/${vendorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get payment profile error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch payment profile' };
  }
};

/**
 * Update Payout Settings
 * @param {string} vendorId 
 * @param {object} settings 
 */
export const updatePayoutSettings = async (vendorId, settings) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.put(`${API_URL}/update-payout-settings`, 
      { vendorId, ...settings },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Update payout settings error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to update payout settings' };
  }
};

// ==================== RAZORPAY INTEGRATION ====================

/**
 * Initiate Vendor Registration Fee (Razorpay)
 * @param {string} vendorId 
 */
export const initiateRegisterFee = async (vendorId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    // Note: The main payment controller handles registration fee initiation
    const response = await axios.post(`${API_BASE_URL}/payment/initiate-register-fee`, 
      { vendorId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Initiate register fee error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to initiate registration fee payment' };
  }
};

/**
 * Verify Razorpay Payment Signature
 * @param {object} paymentData { razorpay_order_id, razorpay_payment_id, razorpay_signature, vendorId, type: 'registration' }
 */
export const verifyPayment = async (paymentData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/payment/verify`, 
      paymentData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Verify payment error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Payment verification failed' };
  }
};