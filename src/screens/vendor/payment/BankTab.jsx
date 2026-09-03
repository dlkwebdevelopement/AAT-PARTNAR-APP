import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

// Expo modules
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  addBankAccount,
  deleteBankAccount,
  setDefaultBankAccount
} from '../../../services/vendorPaymentService';

const BankTab = ({ profile, vendorId, onUpdate, navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  
  const [formData, setFormData] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountType: 'savings',
    isDefault: false,
    cancelledCheque: null
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length < 9 || formData.accountNumber.length > 18) {
      newErrors.accountNumber = 'Account number should be 9-18 digits';
    } else if (!/^\d+$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number should contain only digits';
    }

    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(formData.ifscCode.toUpperCase())) {
        newErrors.ifscCode = 'Invalid IFSC code format (e.g., SBIN0123456)';
      }
    }

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    } else if (formData.accountHolderName.length < 3) {
      newErrors.accountHolderName = 'Please enter full name';
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddBank = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await addBankAccount(vendorId, {
        ...formData,
        ifscCode: formData.ifscCode.toUpperCase(),
        cancelledCheque: formData.cancelledCheque ? {
          name: formData.cancelledCheque.name,
          uri: formData.cancelledCheque.uri,
          type: formData.cancelledCheque.mimeType || 'application/pdf'
        } : null
      });
      
      if (response.success) {
        Alert.alert('Success', 'Bank account added successfully');
        setModalVisible(false);
        resetForm();
        onUpdate();
      } else {
        Alert.alert('Error', response.message || 'Failed to add bank account');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = (accountId) => {
    Alert.alert(
      'Delete Bank Account',
      'Are you sure you want to delete this bank account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteBankAccount(vendorId, accountId);
              if (response.success) {
                Alert.alert('Success', 'Bank account deleted successfully');
                onUpdate();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete bank account');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete bank account');
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (accountId) => {
    try {
      const response = await setDefaultBankAccount(vendorId, accountId);
      if (response.success) {
        Alert.alert('Success', 'Default bank account set successfully');
        onUpdate();
      } else {
        Alert.alert('Error', response.message || 'Failed to set default bank account');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to set default bank account');
    }
  };

  const handleUploadCancelledCheque = async () => {
    try {
      setUploadingDocument(true);
      
      // Check if document picker is available
      const { status } = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (status === 'granted') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          
          // Read file as base64
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64
          });

          setFormData({
            ...formData,
            cancelledCheque: {
              name: asset.name,
              uri: asset.uri,
              size: asset.size,
              mimeType: asset.mimeType || 'application/pdf',
              base64: base64
            }
          });

          Alert.alert('Success', 'Cancelled cheque uploaded successfully');
        }
      }
    } catch (error) {
      console.error('Document pick error:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleShareDocument = async (document) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(document.uri, {
          mimeType: document.mimeType || 'application/pdf',
          dialogTitle: 'Share Document',
          UTI: 'public.data'
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share document');
    }
  };

  const handleRemoveCheque = () => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFormData({
              ...formData,
              cancelledCheque: null
            });
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankName: '',
      branchName: '',
      accountType: 'savings',
      isDefault: false,
      cancelledCheque: null
    });
    setErrors({});
  };

  const formatAccountNumber = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setFormData({ ...formData, accountNumber: cleaned });
  };

  const formatIfscCode = (text) => {
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    setFormData({ ...formData, ifscCode: cleaned });
  };

  const bankAccounts = profile?.paymentProfile?.bankAccounts || [];

  const getAccountTypeIcon = (type) => {
    return type === 'savings' ? 'piggy-bank' : 'briefcase';
  };

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Settlement Bank</Text>
          <Text style={styles.headerSubtitle}>Manage accounts for your payouts</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1a2a6c', '#b21f1f']}
            style={styles.addBtnGradient}
          >
            <Icon name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {bankAccounts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <FontAwesome name="bank" size={48} color="#ccc" />
            </View>
            <Text style={styles.emptyStateText}>No Bank Accounts</Text>
            <Text style={styles.emptyStateSubText}>
              Connect a bank account to receive your earnings and manage payouts securely.
            </Text>
            <TouchableOpacity 
              style={styles.emptyAddBtn}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyAddBtnText}>Add Bank Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bankAccounts.map((account) => (
            <LinearGradient
              key={account._id}
              colors={['#fff', '#f8f9fa']}
              style={styles.bankCard}
            >
              <View style={styles.bankHeader}>
                <LinearGradient
                  colors={account.isDefault ? ['#1a2a6c', '#b21f1f'] : ['#f1f3f5', '#e9ecef']}
                  style={styles.bankIconBg}
                >
                  <FontAwesome 
                    name={getAccountTypeIcon(account.accountType)} 
                    size={24} 
                    color={account.isDefault ? '#fff' : '#1a2a6c'} 
                  />
                </LinearGradient>
                <View style={styles.bankInfo}>
                  <View style={styles.bankNameRow}>
                    <Text style={styles.bankName}>{account.bankName}</Text>
                    {account.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>PRIMARY</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.accountNumberText}>{account.accountNumber}</Text>
                  <Text style={styles.accountHolderText}>{account.accountHolderName}</Text>
                  <View style={styles.bankDetailsRow}>
                    <Text style={styles.ifscCodeText}>IFSC: {account.ifscCode}</Text>
                    {account.branchName ? (
                      <Text style={styles.branchNameText}> • {account.branchName}</Text>
                    ) : null}
                  </View>

                  <View style={styles.badgesRow}>
                    <View style={styles.typeBadge}>
                      <Icon 
                        name={account.accountType === 'savings' ? 'savings' : 'business'} 
                        size={12} 
                        color="#666" 
                      />
                      <Text style={styles.typeBadgeText}>
                        {account.accountType === 'savings' ? 'Savings' : 'Current'}
                      </Text>
                    </View>
                    
                    {account.isVerified ? (
                      <View style={styles.verifiedBadge}>
                        <Icon name="verified" size={14} color="#2e7d32" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Icon name="hourglass-empty" size={14} color="#f57c00" />
                        <Text style={styles.pendingText}>Pending</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.bankActions}>
                {!account.isDefault && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(account._id)}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: '#EFF6FF' }]}>
                      <Icon name="check-circle" size={18} color="#4CAF50" />
                    </View>
                    <Text style={styles.actionButtonText}>Set Primary</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleDeleteBank(account._id)}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: '#FFEBEE' }]}>
                    <Icon name="delete-outline" size={18} color="#EF5350" />
                  </View>
                  <Text style={[styles.actionButtonText, styles.deleteText]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ))
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.scrollModalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Bank Account</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Account Number <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.accountNumber && styles.inputError]}
                    placeholder="Enter account number"
                    value={formData.accountNumber}
                    onChangeText={formatAccountNumber}
                    keyboardType="numeric"
                    maxLength={18}
                    editable={!loading}
                  />
                  {errors.accountNumber ? (
                    <Text style={styles.errorText}>{errors.accountNumber}</Text>
                  ) : (
                    <Text style={styles.hintText}>9-18 digits account number</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    IFSC Code <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.ifscCode && styles.inputError]}
                    placeholder="e.g., SBIN0123456"
                    value={formData.ifscCode}
                    onChangeText={formatIfscCode}
                    autoCapitalize="characters"
                    maxLength={11}
                    editable={!loading}
                  />
                  {errors.ifscCode ? (
                    <Text style={styles.errorText}>{errors.ifscCode}</Text>
                  ) : (
                    <Text style={styles.hintText}>11 characters (e.g., SBIN0123456)</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Account Holder Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.accountHolderName && styles.inputError]}
                    placeholder="Enter account holder name"
                    value={formData.accountHolderName}
                    onChangeText={(text) => setFormData({ ...formData, accountHolderName: text })}
                    editable={!loading}
                  />
                  {errors.accountHolderName && (
                    <Text style={styles.errorText}>{errors.accountHolderName}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Bank Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.bankName && styles.inputError]}
                    placeholder="Enter bank name"
                    value={formData.bankName}
                    onChangeText={(text) => setFormData({ ...formData, bankName: text })}
                    editable={!loading}
                  />
                  {errors.bankName && (
                    <Text style={styles.errorText}>{errors.bankName}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Branch Name (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter branch name"
                    value={formData.branchName}
                    onChangeText={(text) => setFormData({ ...formData, branchName: text })}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Account Type</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.accountType}
                      onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                      style={styles.picker}
                      enabled={!loading}
                      dropdownIconColor="#007AFF"
                    >
                      <Picker.Item label="Savings Account" value="savings" />
                      <Picker.Item label="Current Account" value="current" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Cancelled Cheque (Optional)</Text>
                  {formData.cancelledCheque ? (
                    <View style={styles.fileInfo}>
                      <View style={styles.fileIcon}>
                        {formData.cancelledCheque.mimeType?.includes('pdf') ? (
                          <FontAwesome name="file-pdf-o" size={24} color="#FF3B30" />
                        ) : (
                          <FontAwesome name="file-image-o" size={24} color="#4CAF50" />
                        )}
                      </View>
                      <View style={styles.fileDetails}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {formData.cancelledCheque.name}
                        </Text>
                        <Text style={styles.fileSize}>
                          {(formData.cancelledCheque.size / 1024).toFixed(1)} KB
                        </Text>
                      </View>
                      <View style={styles.fileActions}>
                        <TouchableOpacity 
                          onPress={() => handleShareDocument(formData.cancelledCheque)}
                          style={styles.fileActionButton}
                        >
                          <Icon name="share" size={20} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={handleRemoveCheque}
                          style={styles.fileActionButton}
                        >
                          <Icon name="close" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={handleUploadCancelledCheque}
                      disabled={uploadingDocument || loading}
                    >
                      {uploadingDocument ? (
                        <ActivityIndicator color="#007AFF" />
                      ) : (
                        <>
                          <Icon name="cloud-upload" size={24} color="#007AFF" />
                          <Text style={styles.uploadButtonText}>
                            Upload Cancelled Cheque
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <Text style={styles.hintText}>
                    Upload a cancelled cheque or bank statement (PDF or Image, max 5MB)
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Icon 
                    name={formData.isDefault ? "check-box" : "check-box-outline-blank"} 
                    size={24} 
                    color="#007AFF" 
                  />
                  <Text style={styles.checkboxLabel}>Set as default payment method</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, (loading || uploadingDocument) && styles.disabledButton]}
                  onPress={handleAddBank}
                  disabled={loading || uploadingDocument}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add Bank Account</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.noteContainer}>
                  <Icon name="info" size={16} color="#007AFF" />
                  <Text style={styles.noteText}>
                    Your bank account details will be verified within 24-48 hours. 
                    You'll receive a notification once verified.
                  </Text>
                </View>

                <View style={styles.securityNote}>
                  <Icon name="lock" size={14} color="#4CAF50" />
                  <Text style={styles.securityNoteText}>
                    All information is encrypted and securely stored
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a2a6c',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
  },
  addButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#1a2a6c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  emptyAddBtn: {
    marginTop: 25,
    backgroundColor: '#1a2a6c',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  bankCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  bankHeader: {
    flexDirection: 'row',
  },
  bankIconBg: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  bankInfo: {
    flex: 1,
  },
  bankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  accountNumberText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 2,
    letterSpacing: 1,
  },
  accountHolderText: {
    fontSize: 13,
    color: '#777',
    marginBottom: 4,
    fontWeight: '500',
  },
  bankDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ifscCodeText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  branchNameText: {
    fontSize: 11,
    color: '#999',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 5,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedText: {
    color: '#2e7d32',
    fontSize: 11,
    marginLeft: 5,
    fontWeight: '700',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pendingText: {
    color: '#f57c00',
    fontSize: 11,
    marginLeft: 5,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  bankActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  deleteText: {
    color: '#EF5350',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  scrollModalContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: '80%',
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
    color: '#1a2a6c',
  },
  modalBody: {
    paddingBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  required: {
    color: '#EF5350',
  },
  input: {
    backgroundColor: '#f1f3f5',
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputError: {
    borderColor: '#EF5350',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#EF5350',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  hintText: {
    color: '#888',
    fontSize: 11,
    marginTop: 5,
    marginLeft: 5,
  },
  pickerContainer: {
    backgroundColor: '#f1f3f5',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  picker: {
    height: 55,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  fileActions: {
    flexDirection: 'row',
  },
  fileActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  uploadButton: {
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#1a2a6c',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    marginLeft: 5,
  },
  checkboxLabel: {
    fontSize: 15,
    marginLeft: 10,
    color: '#555',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1a2a6c',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#1a2a6c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#1976d2',
    marginLeft: 10,
    lineHeight: 18,
    fontWeight: '500',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  securityNoteText: {
    fontSize: 11,
    color: '#2e7d32',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default BankTab;