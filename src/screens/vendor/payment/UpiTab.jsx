import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

// Conditionally import Expo modules
let ImagePicker, FileSystem, Sharing;

try {
  // Try to import Expo modules
  ImagePicker = require('expo-image-picker');
  FileSystem = require('expo-file-system');
  Sharing = require('expo-sharing');
} catch (error) {
  console.log('Expo modules not available, using fallbacks');
  // You could add fallback implementations here if needed
}

import {
  addUpiId,
  deleteUpiId,
  setDefaultUpi,
  generateUpiQrCode
} from '../../../services/vendorPaymentService';

const UpiTab = ({ profile, vendorId, onUpdate, navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedUpi, setSelectedUpi] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    upiId: '',
    accountHolderName: '',
    isDefault: false
  });

  const handleAddUpi = async () => {
    if (!formData.upiId || !formData.accountHolderName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Validate UPI ID format
    const upiRegex = /^[\w\.\-]+@[\w\.\-]+$/;
    if (!upiRegex.test(formData.upiId)) {
      Alert.alert('Error', 'Invalid UPI ID format. Example: name@okhdfcbank');
      return;
    }

    setLoading(true);
    try {
      const response = await addUpiId(vendorId, formData);
      if (response.success) {
        Alert.alert('Success', 'UPI ID added successfully');
        setModalVisible(false);
        setFormData({ upiId: '', accountHolderName: '', isDefault: false });
        onUpdate();
      } else {
        Alert.alert('Error', response.message || 'Failed to add UPI ID');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add UPI ID');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUpi = (upiId) => {
    Alert.alert(
      'Delete UPI ID',
      'Are you sure you want to delete this UPI ID?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteUpiId(vendorId, upiId);
              if (response.success) {
                Alert.alert('Success', 'UPI ID deleted successfully');
                onUpdate();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete UPI ID');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete UPI ID');
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (upiId) => {
    try {
      const response = await setDefaultUpi(vendorId, upiId);
      if (response.success) {
        Alert.alert('Success', 'Default UPI set successfully');
        onUpdate();
      } else {
        Alert.alert('Error', response.message || 'Failed to set default UPI');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to set default UPI');
    }
  };

  const handleViewQr = (upi) => {
    setSelectedUpi(upi);
    setQrModalVisible(true);
  };

  const handleDownloadQr = async () => {
    if (!selectedUpi?.qrCodeUrl) {
      Alert.alert('Error', 'No QR code available');
      return;
    }

    // Check if sharing is available
    if (!Sharing) {
      Alert.alert(
        'Not Available',
        'QR code download is not available on this device. You can take a screenshot of the QR code instead.',
        [
          { text: 'OK' }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      
      // For web/platforms without file system
      if (Platform.OS === 'web') {
        // Open QR code in new tab for web
        window.open(selectedUpi.qrCodeUrl, '_blank');
        Alert.alert('Success', 'QR code opened in new tab');
        return;
      }

      // For native platforms with expo-file-system
      if (FileSystem && Sharing) {
        const filename = selectedUpi.qrCodeUrl.split('/').pop() || 'qr_code.png';
        const fileUri = FileSystem.documentDirectory + filename;
        
        // Download the file
        const downloadResult = await FileSystem.downloadAsync(
          selectedUpi.qrCodeUrl,
          fileUri
        );

        if (downloadResult.status === 200) {
          // Check if sharing is available
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(downloadResult.uri, {
              mimeType: 'image/png',
              dialogTitle: 'Save QR Code',
              UTI: 'public.png'
            });
          } else {
            Alert.alert('Success', 'QR code downloaded to: ' + downloadResult.uri);
          }
        } else {
          Alert.alert('Error', 'Failed to download QR code');
        }
      } else {
        // Fallback for platforms without file system
        Alert.alert(
          'Download',
          'To save this QR code, please take a screenshot.',
          [
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download QR code. You can take a screenshot instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQr = async () => {
    if (!selectedUpi) return;

    setLoading(true);
    try {
      const response = await generateUpiQrCode(vendorId, selectedUpi._id);
      if (response.success) {
        Alert.alert('Success', 'QR code regenerated successfully');
        onUpdate();
        // Update selected UPI with new QR code
        setSelectedUpi({
          ...selectedUpi,
          qrCodeUrl: response.qrCodeUrl
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to regenerate QR code');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to regenerate QR code');
    } finally {
      setLoading(false);
    }
  };

  const upiDetails = profile?.paymentProfile?.upiDetails || [];

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>UPI Payments</Text>
          <Text style={styles.headerSubtitle}>Manage your virtual payment addresses</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
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

      {/* UPI List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {upiDetails.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Icon name="account-balance-wallet" size={48} color="#ccc" />
            </View>
            <Text style={styles.emptyStateText}>No UPI IDs Found</Text>
            <Text style={styles.emptyStateSubText}>
              Add a UPI ID to receive payments directly to your bank account.
            </Text>
            <TouchableOpacity 
              style={styles.emptyAddBtn}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyAddBtnText}>Add UPI ID</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upiDetails.map((upi) => (
            <LinearGradient
              key={upi._id}
              colors={['#fff', '#f8f9fa']}
              style={styles.upiCard}
            >
              <View style={styles.upiCardContent}>
                <View style={styles.upiIconContainer}>
                  <LinearGradient
                    colors={['#E3F2FD', '#BBDEFB']}
                    style={styles.upiIconBg}
                  >
                    <Icon name="smartphone" size={24} color="#1976D2" />
                  </LinearGradient>
                </View>
                
                <View style={styles.upiInfo}>
                  <View style={styles.upiIdRow}>
                    <Text style={styles.upiIdText}>{upi.upiId}</Text>
                    {upi.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Primary</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.upiNameText}>{upi.accountHolderName}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.upiActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleViewQr(upi)}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: '#E1F5FE' }]}>
                    <Icon name="qr-code" size={18} color="#03A9F4" />
                  </View>
                  <Text style={styles.actionButtonText}>QR Code</Text>
                </TouchableOpacity>

                {!upi.isDefault && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(upi._id)}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: '#EFF6FF' }]}>
                      <Icon name="check-circle" size={18} color="#4CAF50" />
                    </View>
                    <Text style={styles.actionButtonText}>Make Primary</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleDeleteUpi(upi._id)}
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

      {/* Add UPI Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add UPI ID</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="UPI ID (e.g., name@okhdfcbank)"
                value={formData.upiId}
                onChangeText={(text) => setFormData({ ...formData, upiId: text })}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Account Holder Name"
                value={formData.accountHolderName}
                onChangeText={(text) => setFormData({ ...formData, accountHolderName: text })}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
              >
                <Icon 
                  name={formData.isDefault ? "check-box" : "check-box-outline-blank"} 
                  size={24} 
                  color="#007AFF" 
                />
                <Text style={styles.checkboxLabel}>Set as default payment method</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleAddUpi}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add UPI ID</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>UPI QR Code</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedUpi?.qrCodeUrl ? (
                <>
                  <Image 
                    source={{ uri: selectedUpi.qrCodeUrl }} 
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  
                  <Text style={styles.qrUpiId}>{selectedUpi.upiId}</Text>
                  <Text style={styles.qrName}>{selectedUpi.accountHolderName}</Text>

                  <View style={styles.qrActions}>
                    <TouchableOpacity 
                      style={styles.qrActionButton}
                      onPress={handleDownloadQr}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Icon name="download" size={20} color="#fff" />
                          <Text style={styles.qrActionText}>Save</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.qrActionButton, styles.regenerateButton]}
                      onPress={handleRegenerateQr}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Icon name="refresh" size={20} color="#fff" />
                          <Text style={styles.qrActionText}>Regenerate</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.qrNote}>
                    {!Sharing ? 'Take a screenshot to save this QR code' : 'Tap Save to download QR code'}
                  </Text>
                </>
              ) : (
                <Text style={styles.noQrText}>No QR code available</Text>
              )}
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 10,
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
  upiCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  upiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upiIconContainer: {
    marginRight: 15,
  },
  upiIconBg: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upiInfo: {
    flex: 1,
  },
  upiIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upiIdText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  upiNameText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  upiActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '80%',
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
    paddingBottom: 20,
  },
  input: {
    backgroundColor: '#f1f3f5',
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
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
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  qrImage: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 15,
  },
  qrUpiId: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a2a6c',
  },
  qrName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 25,
    fontWeight: '500',
  },
  qrActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  qrActionButton: {
    backgroundColor: '#1a2a6c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    flex: 0.47,
    justifyContent: 'center',
    shadowColor: '#1a2a6c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  regenerateButton: {
    backgroundColor: '#ff9800',
    shadowColor: '#ff9800',
  },
  qrActionText: {
    color: '#fff',
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '700',
  },
  qrNote: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 15,
    fontStyle: 'italic',
  },
  noQrText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 16,
    padding: 30,
    fontStyle: 'italic',
  },
});

export default UpiTab;