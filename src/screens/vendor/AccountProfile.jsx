import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  StatusBar, // FIX 1: Added missing StatusBar import
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AxiosService from '../../utils/AxioService';
import { LinearGradient } from 'expo-linear-gradient';

const API_BASE_URL = AxiosService.defaults.baseURL.split('/api')[0];

const AccountProfile = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('upi');
  const [editingId, setEditingId] = useState(null);

  const [upiForm, setUpiForm] = useState({
    upiId: '',
    accountHolderName: '',
    isDefault: false,
  });

  const [bankForm, setBankForm] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountType: 'savings',
    isDefault: false,
  });

  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardType: 'debit',
    cardNetwork: 'visa',
    isDefault: false,
  });

  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedUpiDetails, setSelectedUpiDetails] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState(null);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    getVendorId();
  }, []);

  // Real-time polling for withdrawal status updates
  useEffect(() => {
    if (vendorId) {
      // Initial fetch
      fetchWithdrawHistory(vendorId);
      
      // Set up polling every 3 seconds
      const interval = setInterval(() => {
        fetchWithdrawHistory(vendorId);
      }, 3000);
      
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    }
  }, [vendorId]);

  const getVendorId = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const id = userObj._id || userObj.id;
        if (id) {
          setVendorId(id);
          fetchPaymentProfile(id);
          return;
        }
      }
      Alert.alert('Error', 'Vendor not logged in');
      navigation.goBack();
    } catch (error) {
      console.error('Error getting vendor ID:', error);
      navigation.goBack();
    }
  };

  const fetchPaymentProfile = async (id) => {
    try {
      const response = await AxiosService.get(`/vendor-payment/get-payment-profile/${id}`);
      const data = response.data;
      if (data.success) {
        setProfile(data.profile);
        fetchWithdrawHistory(id);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWithdrawHistory = async (id) => {
    try {
      setHistoryLoading(true);
      const response = await AxiosService.get(`/vendor-payment/get-withdraw-history/${id}`);
      if (response.data.success) {
        setWithdrawHistory(response.data.history);
      }
    } catch (error) {
      console.error('Error fetching withdraw history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (vendorId) {
      fetchPaymentProfile(vendorId);
    }
  };

  const handleAddPaymentMethod = (type) => {
    setIsEditing(false);
    setEditingId(null);
    setSelectedPaymentMethod(type);
    setModalVisible(true);
  };

  const submitUpi = async () => {
    const upiId = upiForm.upiId.trim().toLowerCase();
    const accountHolderName = upiForm.accountHolderName.trim();

    // ── Required field checks ──────────────────────────────────────
    if (!upiId) {
      Alert.alert('Validation Error', 'UPI ID is required.');
      return;
    }
    if (!accountHolderName) {
      Alert.alert('Validation Error', 'Account holder name is required.');
      return;
    }

    // ── UPI ID format: must be in the form localpart@provider ──────
    // Allowed chars before @: letters, digits, dot, hyphen, underscore
    // Allowed chars after  @: letters, digits, dot, hyphen (bank handles)
    const upiRegex = /^[\w.\-]{2,64}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId)) {
      Alert.alert(
        'Invalid UPI ID',
        'UPI ID must be in the format: yourname@okhdfcbank\n\nExamples:\n• name@okhdfcbank\n• 9876543210@paytm\n• user@ybl'
      );
      return;
    }

    // ── Length guards ──────────────────────────────────────────────
    if (upiId.length > 72) {
      Alert.alert('Validation Error', 'UPI ID is too long (max 72 characters).');
      return;
    }

    // ── Name must be at least 2 characters ────────────────────────
    if (accountHolderName.length < 2) {
      Alert.alert('Validation Error', 'Account holder name must be at least 2 characters.');
      return;
    }
    if (accountHolderName.length > 100) {
      Alert.alert('Validation Error', 'Account holder name is too long (max 100 characters).');
      return;
    }

    // ── Name should only contain letters and spaces ────────────────
    if (!/^[a-zA-Z\s.'-]+$/.test(accountHolderName)) {
      Alert.alert('Validation Error', 'Account holder name should only contain letters, spaces, or hyphens.');
      return;
    }

    try {
      const response = await AxiosService.post('/vendor-payment/add-upi', {
        vendorId,
        upiId,
        accountHolderName,
        isDefault: upiForm.isDefault,
      });
      const data = response.data;
      if (data.success) {
        Alert.alert('Success', 'UPI ID added successfully');
        setModalVisible(false);
        setUpiForm({ upiId: '', accountHolderName: '', isDefault: false });
        fetchPaymentProfile(vendorId);
      } else {
        Alert.alert('Error', data.message || 'Failed to add UPI ID');
      }
    } catch (error) {
      const errMsg = error?.response?.data?.message || error.message;
      console.error('Error adding UPI:', errMsg);
      Alert.alert('Error', errMsg || 'Network error. Please try again.');
    }
  };

  const handleEditPaymentMethod = (type, item) => {
    setIsEditing(true);
    setEditingId(item._id);
    setSelectedPaymentMethod(type);
    if (type === 'upi') {
      setUpiForm({
        upiId: item.upiId,
        accountHolderName: item.accountHolderName,
        isDefault: item.isDefault,
      });
    }
    setModalVisible(true);
  };

  const updateUpi = async () => {
    const upiId = upiForm.upiId.trim().toLowerCase();
    const accountHolderName = upiForm.accountHolderName.trim();

    if (!upiId) {
      Alert.alert('Validation Error', 'UPI ID is required.');
      return;
    }
    if (!accountHolderName) {
      Alert.alert('Validation Error', 'Account holder name is required.');
      return;
    }

    const upiRegex = /^[\w.\-]{2,64}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId)) {
      Alert.alert(
        'Invalid UPI ID',
        'UPI ID must be in the format: yourname@okhdfcbank'
      );
      return;
    }

    try {
      const response = await AxiosService.put('/vendor-payment/edit-upi', {
        vendorId,
        upiId: editingId,
        newUpiId: upiId,
        accountHolderName,
      });
      const data = response.data;
      if (data.success) {
        Alert.alert('Success', 'UPI ID updated successfully');
        setModalVisible(false);
        setIsEditing(false);
        setEditingId(null);
        setUpiForm({ upiId: '', accountHolderName: '', isDefault: false });
        fetchPaymentProfile(vendorId);
      } else {
        Alert.alert('Error', data.message || 'Failed to update UPI ID');
      }
    } catch (error) {
      const errMsg = error?.response?.data?.message || error.message;
      console.error('Error updating UPI:', errMsg);
      Alert.alert('Error', errMsg || 'Network error. Please try again.');
    }
  };

  const handleSetDefaultUpi = async (upiId) => {
    try {
      const response = await AxiosService.put('/vendor-payment/set-default-upi', {
        vendorId,
        upiId,
      });
      const data = response.data;
      if (data.success) {
        Alert.alert('Success', 'Default UPI set successfully');
        fetchPaymentProfile(vendorId);
      } else {
        Alert.alert('Error', data.message || 'Failed to set default UPI');
      }
    } catch (error) {
      console.error('Error setting default UPI:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleShowQrCode = (upi) => {
    if (!upi.qrCodeUrl) {
      Alert.alert('Info', 'QR Code not available. Please generate first.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate', onPress: () => handleGenerateUpiQr(upi._id) },
      ]);
      return;
    }

    // Extract just the /uploads/filename.png part from the stored URL
    // The stored URL might point to production (worldofaat.com) but we need local server
    const serverBase = AxiosService.defaults.baseURL.replace(/\/api$/, '');
    let qrUrl = upi.qrCodeUrl;

    // Strip any existing host and extract the path starting from /uploads/
    const uploadsMatch = qrUrl.match(/\/uploads\/.+/);
    if (uploadsMatch) {
      qrUrl = `${serverBase}${uploadsMatch[0]}`;
    } else if (!qrUrl.startsWith('http')) {
      // Relative path — just prepend the server base
      qrUrl = `${serverBase}${qrUrl.startsWith('/') ? '' : '/'}${qrUrl}`;
    }
    // else: absolute URL with no /uploads/ match → use as-is

    console.log('📸 QR URL (stored):', upi.qrCodeUrl);
    console.log('📸 QR URL (resolved):', qrUrl);

    setSelectedUpiDetails(upi);
    setSelectedQrCode(qrUrl);
    setShowQrModal(true);
  };

  const handleGenerateUpiQr = async (upiId) => {
    try {
      setQrLoading(true);
      const res = await AxiosService.get(
        `/vendor-payment/generate-upi-qr/${vendorId}/${upiId}`
      );
      if (res.data.success) {
        Alert.alert('Success', 'QR Code generated successfully');
        await fetchPaymentProfile(vendorId);
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate QR Code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const pendingAmount = profile?.paymentProfile?.pendingPayouts || 0;
    if (pendingAmount <= 0) {
      Alert.alert('Info', 'You have no pending balance to withdraw.');
      return;
    }
    Alert.alert(
      'Request Payout',
      `Would you like to request a payout of ₹${pendingAmount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              const response = await AxiosService.post('/vendor-payment/request-payout', {
                vendorId,
                amount: pendingAmount,
              });
              const data = response.data;
              if (data.success) {
                Alert.alert('Success', 'Payout request submitted successfully.');
                fetchPaymentProfile(vendorId);
              } else {
                Alert.alert('Error', data.message || 'Failed to request payout');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error. Please try again.');
            }
          },
        },
      ]
    );
  };

  const submitBank = async () => {
    if (
      !bankForm.accountNumber ||
      !bankForm.ifscCode ||
      !bankForm.accountHolderName ||
      !bankForm.bankName
    ) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      const response = await AxiosService.post('/vendor-payment/add-bank', {
        vendorId,
        ...bankForm,
      });
      const data = response.data;
      if (data.success) {
        Alert.alert('Success', 'Bank account added successfully');
        setModalVisible(false);
        setBankForm({
          accountNumber: '',
          ifscCode: '',
          accountHolderName: '',
          bankName: '',
          branchName: '',
          accountType: 'savings',
          isDefault: false,
        });
        fetchPaymentProfile(vendorId);
      } else {
        Alert.alert('Error', data.message || 'Failed to add bank account');
      }
    } catch (error) {
      console.error('Error adding bank:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const submitCard = async () => {
    if (
      !cardForm.cardNumber ||
      !cardForm.cardHolderName ||
      !cardForm.expiryMonth ||
      !cardForm.expiryYear ||
      !cardForm.cvv
    ) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      const response = await AxiosService.post('/vendor-payment/add-card', {
        vendorId,
        ...cardForm,
      });
      const data = response.data;
      if (data.success) {
        Alert.alert('Success', 'Card added successfully');
        setModalVisible(false);
        setCardForm({
          cardNumber: '',
          cardHolderName: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          cardType: 'debit',
          cardNetwork: 'visa',
          isDefault: false,
        });
        fetchPaymentProfile(vendorId);
      } else {
        Alert.alert('Error', data.message || 'Failed to add card');
      }
    } catch (error) {
      console.error('Error adding card:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleDeletePaymentMethod = async (type, id) => {
    Alert.alert('Confirm Delete', `Are you sure you want to delete this ${type}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            let endpoint = '';
            if (type === 'UPI') {
              endpoint = `/vendor-payment/delete-upi/${vendorId}/${id}`;
            } else if (type === 'Bank') {
              endpoint = `/vendor-payment/delete-bank/${vendorId}/${id}`;
            } else if (type === 'Card') {
              endpoint = `/vendor-payment/delete-card/${vendorId}/${id}`;
            }
            const response = await AxiosService.delete(endpoint);
            const data = response.data;
            if (data.success) {
              Alert.alert('Success', `${type} deleted successfully`);
              fetchPaymentProfile(vendorId);
            } else {
              Alert.alert('Error', data.message || `Failed to delete ${type}`);
            }
          } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            Alert.alert('Error', 'Network error. Please try again.');
          }
        },
      },
    ]);
  };

  const renderAddMethodModal = () => {
    return (
      // FIX 3: Uses modalContainer (bottom-sheet style) — no longer overridden by duplicate
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit' : 'Add'}{' '}
                {selectedPaymentMethod === 'upi'
                  ? 'UPI ID'
                  : selectedPaymentMethod === 'bank'
                    ? 'Bank Account'
                    : 'Card'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedPaymentMethod === 'upi' && (
                <View>
                  <Text style={styles.inputLabel}>UPI ID *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., vendor@okhdfcbank"
                    value={upiForm.upiId}
                    onChangeText={(text) => setUpiForm({ ...upiForm, upiId: text })}
                  />

                  <Text style={styles.inputLabel}>Account Holder Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter account holder name"
                    value={upiForm.accountHolderName}
                    onChangeText={(text) =>
                      setUpiForm({ ...upiForm, accountHolderName: text })
                    }
                  />

                  {!isEditing && (
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => setUpiForm({ ...upiForm, isDefault: !upiForm.isDefault })}
                    >
                      <Ionicons
                        name={upiForm.isDefault ? 'checkbox' : 'square-outline'}
                        size={24}
                        color="#0B1A3D"
                      />
                      <Text style={styles.checkboxLabel}>Set as default payment method</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.submitButton} onPress={isEditing ? updateUpi : submitUpi}>
                    <Text style={styles.submitButtonText}>{isEditing ? 'Update UPI ID' : 'Add UPI ID'}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedPaymentMethod === 'bank' && (
                <View>
                  <Text style={styles.inputLabel}>Account Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter account number"
                    value={bankForm.accountNumber}
                    onChangeText={(text) => setBankForm({ ...bankForm, accountNumber: text })}
                    keyboardType="numeric"
                  />

                  <Text style={styles.inputLabel}>IFSC Code *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., HDFC0001234"
                    value={bankForm.ifscCode}
                    onChangeText={(text) =>
                      setBankForm({ ...bankForm, ifscCode: text.toUpperCase() })
                    }
                    autoCapitalize="characters"
                  />

                  <Text style={styles.inputLabel}>Account Holder Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter account holder name"
                    value={bankForm.accountHolderName}
                    onChangeText={(text) =>
                      setBankForm({ ...bankForm, accountHolderName: text })
                    }
                  />

                  <Text style={styles.inputLabel}>Bank Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter bank name"
                    value={bankForm.bankName}
                    onChangeText={(text) => setBankForm({ ...bankForm, bankName: text })}
                  />

                  <Text style={styles.inputLabel}>Branch Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter branch name"
                    value={bankForm.branchName}
                    onChangeText={(text) => setBankForm({ ...bankForm, branchName: text })}
                  />

                  <Text style={styles.inputLabel}>Account Type</Text>
                  <View style={styles.radioGroup}>
                    {['savings', 'current'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.radioButton}
                        onPress={() => setBankForm({ ...bankForm, accountType: type })}
                      >
                        <Ionicons
                          name={
                            bankForm.accountType === type
                              ? 'radio-button-on'
                              : 'radio-button-off'
                          }
                          size={20}
                          color="#0B1A3D"
                        />
                        <Text style={styles.radioLabel}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setBankForm({ ...bankForm, isDefault: !bankForm.isDefault })}
                  >
                    <Ionicons
                      name={bankForm.isDefault ? 'checkbox' : 'square-outline'}
                      size={24}
                      color="#0B1A3D"
                    />
                    <Text style={styles.checkboxLabel}>Set as default payment method</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.submitButton} onPress={submitBank}>
                    <Text style={styles.submitButtonText}>Add Bank Account</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedPaymentMethod === 'card' && (
                <View>
                  <Text style={styles.inputLabel}>Card Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter card number"
                    value={cardForm.cardNumber}
                    onChangeText={(text) => setCardForm({ ...cardForm, cardNumber: text })}
                    keyboardType="numeric"
                    maxLength={19}
                  />

                  <Text style={styles.inputLabel}>Card Holder Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter card holder name"
                    value={cardForm.cardHolderName}
                    onChangeText={(text) =>
                      setCardForm({ ...cardForm, cardHolderName: text })
                    }
                  />

                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <Text style={styles.inputLabel}>Expiry Month *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="MM"
                        value={cardForm.expiryMonth}
                        onChangeText={(text) =>
                          setCardForm({ ...cardForm, expiryMonth: text })
                        }
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.halfWidth}>
                      <Text style={styles.inputLabel}>Expiry Year *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YY"
                        value={cardForm.expiryYear}
                        onChangeText={(text) =>
                          setCardForm({ ...cardForm, expiryYear: text })
                        }
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>CVV *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter CVV"
                    value={cardForm.cvv}
                    onChangeText={(text) => setCardForm({ ...cardForm, cvv: text })}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />

                  <Text style={styles.inputLabel}>Card Network</Text>
                  <View style={styles.cardNetworkContainer}>
                    {['visa', 'mastercard', 'amex', 'rupay'].map((network) => (
                      <TouchableOpacity
                        key={network}
                        style={[
                          styles.cardNetworkButton,
                          cardForm.cardNetwork === network && styles.cardNetworkButtonActive,
                        ]}
                        onPress={() => setCardForm({ ...cardForm, cardNetwork: network })}
                      >
                        <Text
                          style={[
                            styles.cardNetworkText,
                            cardForm.cardNetwork === network && styles.cardNetworkTextActive,
                          ]}
                        >
                          {network.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() =>
                      setCardForm({ ...cardForm, isDefault: !cardForm.isDefault })
                    }
                  >
                    <Ionicons
                      name={cardForm.isDefault ? 'checkbox' : 'square-outline'}
                      size={24}
                      color="#0B1A3D"
                    />
                    <Text style={styles.checkboxLabel}>Set as default payment method</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.submitButton} onPress={submitCard}>
                    <Text style={styles.submitButtonText}>Add Card</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderQrModal = () => {
    return (
      // FIX 3: Uses qrModalContainer (centered overlay) instead of the duplicate modalContainer
      <Modal
        visible={showQrModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.qrModalContainer}>
          <View style={styles.qrModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>UPI QR Code</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrContainer}>
              {qrLoading ? (
                <ActivityIndicator size="large" color="#0B1A3D" />
              ) : selectedQrCode ? (
                <Image
                  source={{ uri: selectedQrCode }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.emptyText}>Failed to load QR code</Text>
              )}
            </View>

            {selectedUpiDetails && (
              <View style={styles.qrInfo}>
                <Text style={styles.qrUpiId}>{selectedUpiDetails.upiId}</Text>
                <Text style={styles.qrName}>{selectedUpiDetails.accountHolderName}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButtonAction}
              onPress={() => setShowQrModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />

      {/* Clean Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Ionicons name="wallet" size={22} color="#0B1A3D" style={{ marginRight: 8 }} />
            <Text style={[styles.headerTitle, { color: '#0B1A3D' }]}>Payment Methods</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#b21f1f"
          />
        }
      >
        <View style={styles.contentContainer}>
          {/* Tag UI for Payment Methods */}
          <View style={styles.tagContainer}>
            <TouchableOpacity 
              style={[styles.tagButton, activeTab === 'upi' && styles.tagButtonActive]}
              onPress={() => setActiveTab('upi')}
            >
              <Ionicons name="phone-portrait-outline" size={16} color={activeTab === 'upi' ? '#fff' : '#64748B'} style={{ marginRight: 4 }} />
              <Text style={[styles.tagText, activeTab === 'upi' && styles.tagTextActive]}>UPI</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tagButton, activeTab === 'bank' && styles.tagButtonActive]}
              onPress={() => setActiveTab('bank')}
            >
              <Ionicons name="business-outline" size={16} color={activeTab === 'bank' ? '#fff' : '#64748B'} style={{ marginRight: 4 }} />
              <Text style={[styles.tagText, activeTab === 'bank' && styles.tagTextActive]}>Banks</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tagButton, activeTab === 'card' && styles.tagButtonActive]}
              onPress={() => setActiveTab('card')}
            >
              <Ionicons name="card-outline" size={16} color={activeTab === 'card' ? '#fff' : '#64748B'} style={{ marginRight: 4 }} />
              <Text style={[styles.tagText, activeTab === 'card' && styles.tagTextActive]}>Cards</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={[styles.sectionHeaderRow, { justifyContent: 'flex-end', marginBottom: 8 }]}>
              <TouchableOpacity 
                style={styles.addBtnSmall}
                onPress={() => handleAddPaymentMethod(activeTab)}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addBtnSmallText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {/* Content Section */}
            <View style={styles.cardsContainer}>
              {/* UPI Tab */}
              {activeTab === 'upi' && (
                profile?.paymentProfile?.upiDetails?.length > 0 ? (
                  profile.paymentProfile.upiDetails.map((upi) => (
                    <View key={upi._id} style={[styles.modernCard, upi.isDefault && styles.modernCardDefault]}>
                      <View style={styles.modernCardHeader}>
                        <View style={styles.modernCardIconBox}>
                          <Ionicons name="phone-portrait" size={20} color="#0B1A3D" />
                        </View>
                        <View style={styles.modernCardTitleBox}>
                          <Text style={styles.modernCardTitle}>{upi.upiId}</Text>
                          <Text style={styles.modernCardSubtitle}>{upi.accountHolderName}</Text>
                        </View>
                        {upi.isDefault && (
                          <View style={styles.modernBadge}>
                            <Text style={styles.modernBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.modernCardActions}>
                        <TouchableOpacity onPress={() => handleShowQrCode(upi)} style={styles.modernActionBtn}>
                          <Ionicons name="qr-code" size={18} color="#0B1A3D" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleEditPaymentMethod('upi', upi)} style={styles.modernActionBtn}>
                          <Ionicons name="pencil-outline" size={18} color="#0B1A3D" />
                        </TouchableOpacity>
                        {!upi.isDefault && (
                          <TouchableOpacity onPress={() => handleSetDefaultUpi(upi._id)} style={styles.modernActionBtn}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#0B1A3D" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDeletePaymentMethod('UPI', upi._id)} style={[styles.modernActionBtn, { backgroundColor: '#FFEBEE' }]}>
                          <Ionicons name="trash-outline" size={18} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons name="wallet-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyText}>No UPI IDs added</Text>
                    <Text style={styles.emptySubtext}>Add a UPI ID to receive payments easily.</Text>
                  </View>
                )
              )}

              {/* Bank Tab */}
              {activeTab === 'bank' && (
                profile?.paymentProfile?.bankDetails?.length > 0 ? (
                  profile.paymentProfile.bankDetails.map((bank) => (
                    <View key={bank._id} style={[styles.modernCard, bank.isDefault && styles.modernCardDefault]}>
                      <View style={styles.modernCardHeader}>
                        <View style={styles.modernCardIconBox}>
                          <Ionicons name="business" size={20} color="#0B1A3D" />
                        </View>
                        <View style={styles.modernCardTitleBox}>
                          <Text style={styles.modernCardTitle}>{bank.bankName}</Text>
                          <Text style={styles.modernCardSubtitle}>{bank.accountNumber.replace(/.(?=.{4})/g, 'x')}</Text>
                        </View>
                        {bank.isDefault && (
                          <View style={styles.modernBadge}>
                            <Text style={styles.modernBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.modernCardActions}>
                        <TouchableOpacity onPress={() => handleEditPaymentMethod('bank', bank)} style={styles.modernActionBtn}>
                          <Ionicons name="pencil-outline" size={18} color="#0B1A3D" />
                        </TouchableOpacity>
                        {!bank.isDefault && (
                          <TouchableOpacity onPress={() => handleSetDefaultUpi(bank._id)} style={styles.modernActionBtn}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#0B1A3D" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDeletePaymentMethod('BANK', bank._id)} style={[styles.modernActionBtn, { backgroundColor: '#FFEBEE' }]}>
                          <Ionicons name="trash-outline" size={18} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons name="business-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyText}>No Bank Accounts</Text>
                    <Text style={styles.emptySubtext}>Add a bank account to receive wire transfers.</Text>
                  </View>
                )
              )}

              {/* Card Tab */}
              {activeTab === 'card' && (
                profile?.paymentProfile?.cardDetails?.length > 0 ? (
                  profile.paymentProfile.cardDetails.map((card) => (
                    <View key={card._id} style={[styles.modernCard, card.isDefault && styles.modernCardDefault]}>
                      <View style={styles.modernCardHeader}>
                        <View style={styles.modernCardIconBox}>
                          <Ionicons name="card" size={20} color="#0B1A3D" />
                        </View>
                        <View style={styles.modernCardTitleBox}>
                          <Text style={styles.modernCardTitle}>{card.cardNetwork.toUpperCase()} {card.cardType}</Text>
                          <Text style={styles.modernCardSubtitle}>Ending in {card.cardNumber.slice(-4)}</Text>
                        </View>
                        {card.isDefault && (
                          <View style={styles.modernBadge}>
                            <Text style={styles.modernBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.modernCardActions}>
                        <TouchableOpacity onPress={() => handleEditPaymentMethod('card', card)} style={styles.modernActionBtn}>
                          <Ionicons name="pencil-outline" size={18} color="#0B1A3D" />
                        </TouchableOpacity>
                        {!card.isDefault && (
                          <TouchableOpacity onPress={() => handleSetDefaultUpi(card._id)} style={styles.modernActionBtn}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#0B1A3D" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDeletePaymentMethod('CARD', card._id)} style={[styles.modernActionBtn, { backgroundColor: '#FFEBEE' }]}>
                          <Ionicons name="trash-outline" size={18} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons name="card-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyText}>No Cards Added</Text>
                    <Text style={styles.emptySubtext}>Add a debit or credit card for payments.</Text>
                  </View>
                )
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {renderQrModal()}
      {renderAddMethodModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Header ---
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerActionBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // --- Profile Summary in Header ---
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0B1A3D',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#fff',
  },
  profileTextInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  // --- Scroll / Content ---
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },

  // --- Earnings Overview ---
  earningsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  earningsCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  mainBalance: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0B1A3D',
  },
  earningsDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginBottom: 16,
  },
  earningsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  earningsStat: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  withdrawBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  disabledWithdrawBtn: {
    opacity: 0.6,
  },
  withdrawBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0B1A3D',
  },
  withdrawBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // --- Tag UI ---
  tagContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 16,
    gap: 8,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagButtonActive: {
    backgroundColor: '#0B1A3D',
    borderColor: '#0B1A3D',
  },
  tagText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#fff',
  },

  // --- Sections ---
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1A3D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBtnSmallText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardsContainer: {
    paddingHorizontal: 16,
  },
  modernCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#0B1A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  modernCardDefault: {
    borderLeftWidth: 4,
    borderLeftColor: '#0B1A3D',
  },
  modernCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modernCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernCardTitleBox: {
    flex: 1,
  },
  modernCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modernCardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  modernBadge: {
    backgroundColor: '#E6F0EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0B1A3D',
  },
  modernCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modernActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  paymentSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  paymentItem: {
    flexDirection: 'column',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  paymentActionsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentItemBody: {
    paddingLeft: 26,
    marginTop: 2,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  paymentSubtext: {
    fontSize: 12,
    color: '#666',
  },
  // FIX 5: Added missing paymentActions style
  paymentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  qrIconBtnActive: {
    backgroundColor: '#059669',
  },
  qrBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B1A3D',
  },
  qrBtnTextActive: {
    color: '#fff',
  },
  cardDetailsCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cardIconLarge: {
    marginBottom: 8,
  },
  paymentValueLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 1,
    marginBottom: 4,
  },
  paymentSubtextLarge: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentExpiryText: {
    fontSize: 12,
    color: '#999',
  },
  cardActionsTop: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 10,
    color: '#0B1A3D',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  settingsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pendingText: {
    color: '#0B1A3D',
  },
  // FIX 2: completedText properly defined with its own key
  completedText: {
    color: '#0B1A3D',
  },
  // FIX 5: Added missing withdrawButton / withdrawButtonText styles
  withdrawButton: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  withdrawBtnFull: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disabledWithdrawBtn: {
    opacity: 0.5,
  },

  // Premium Card
  premiumSummaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0B1A3D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  summaryGradient: {
    padding: 24,
  },
  mainBalanceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainBalanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainBalanceValue: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '800',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statSeparator: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginBottom: 12,
  },

  // --- Modals ---
  // FIX 3: modalContainer kept as bottom-sheet (justifyContent: 'flex-end')
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f1f3f5',
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    marginLeft: 4,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#0B1A3D',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#0B1A3D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 25,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  radioLabel: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  cardNetworkContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  cardNetworkButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  cardNetworkButtonActive: {
    backgroundColor: '#0B1A3D',
    borderColor: '#0B1A3D',
  },
  cardNetworkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  cardNetworkTextActive: {
    color: '#fff',
  },

  // FIX 3: Renamed from duplicate modalContainer → qrModalContainer (centered overlay)
  qrModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 20,
    width: '85%',
  },
  qrContainer: {
    width: 250,
    height: 250,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  qrUpiId: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B1A3D',
  },
  qrName: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  closeButtonAction: {
    width: '100%',
    backgroundColor: '#f1f3f5',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  setDefaultBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  editBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
});

export default AccountProfile;