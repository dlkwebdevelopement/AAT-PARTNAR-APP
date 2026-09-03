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
  Platform,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

// Expo modules
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  addCard,
  deleteCard,
  setDefaultCard
} from '../../../services/vendorPaymentService';

const CardTab = ({ profile, vendorId, onUpdate, navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardType: 'debit',
    cardNetwork: 'visa',
    isDefault: false,
    cardImage: null
  });

  const [errors, setErrors] = useState({});
  const [showCvv, setShowCvv] = useState(false);

  const cardNetworks = [
    { 
      label: 'Visa', 
      value: 'visa', 
      pattern: /^4/, 
      icon: 'credit-card',
      color: '#1A1F71',
      cvvLength: 3
    },
    { 
      label: 'Mastercard', 
      value: 'mastercard', 
      pattern: /^5[1-5]/, 
      icon: 'credit-card-multiple',
      color: '#EB001B',
      cvvLength: 3
    },
    { 
      label: 'RuPay', 
      value: 'rupay', 
      pattern: /^[6-8]/, 
      icon: 'credit-card-outline',
      color: '#2E8B57',
      cvvLength: 3
    },
    { 
      label: 'American Express', 
      value: 'amex', 
      pattern: /^3[47]/, 
      icon: 'credit-card-settings',
      color: '#006FCF',
      cvvLength: 4
    },
    { 
      label: 'Other', 
      value: 'other', 
      pattern: /.*/, 
      icon: 'credit-card',
      color: '#666',
      cvvLength: 3
    }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else {
      const cleanedNumber = formData.cardNumber.replace(/\s/g, '');
      if (cleanedNumber.length < 13 || cleanedNumber.length > 19) {
        newErrors.cardNumber = 'Card number should be 13-19 digits';
      } else if (!luhnCheck(cleanedNumber)) {
        newErrors.cardNumber = 'Invalid card number';
      }
    }

    if (!formData.cardHolderName.trim()) {
      newErrors.cardHolderName = 'Card holder name is required';
    } else if (formData.cardHolderName.length < 3) {
      newErrors.cardHolderName = 'Enter full name as shown on card';
    }

    if (!formData.expiryMonth) {
      newErrors.expiryMonth = 'Expiry month is required';
    } else {
      const month = parseInt(formData.expiryMonth);
      if (month < 1 || month > 12) {
        newErrors.expiryMonth = 'Invalid month (01-12)';
      }
    }

    if (!formData.expiryYear) {
      newErrors.expiryYear = 'Expiry year is required';
    } else {
      const year = parseInt(formData.expiryYear);
      const currentYear = new Date().getFullYear() % 100;
      if (year < currentYear || year > currentYear + 20) {
        newErrors.expiryYear = 'Invalid expiry year';
      }
    }

    if (formData.expiryMonth && formData.expiryYear) {
      const month = parseInt(formData.expiryMonth);
      const year = parseInt(formData.expiryYear);
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;

      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    const currentNetwork = cardNetworks.find(n => n.value === formData.cardNetwork);
    const cvvLength = currentNetwork?.cvvLength || 3;

    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else {
      if (formData.cvv.length !== cvvLength) {
        newErrors.cvv = `CVV should be ${cvvLength} digits`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const luhnCheck = (cardNumber) => {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const detectCardNetwork = (number) => {
    const cleaned = number.replace(/\s/g, '');
    for (const network of cardNetworks) {
      if (network.pattern.test(cleaned)) {
        return network.value;
      }
    }
    return 'other';
  };

  const handleAddCard = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check all fields and try again');
      return;
    }

    setLoading(true);
    try {
      const response = await addCard(vendorId, {
        ...formData,
        cardNumber: formData.cardNumber.replace(/\s/g, '')
      });
      
      if (response.success) {
        Alert.alert('Success', 'Card added successfully');
        setModalVisible(false);
        resetForm();
        onUpdate();
      } else {
        Alert.alert('Error', response.message || 'Failed to add card');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add card');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = (cardId) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteCard(vendorId, cardId);
              if (response.success) {
                Alert.alert('Success', 'Card deleted successfully');
                onUpdate();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete card');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete card');
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (cardId) => {
    try {
      const response = await setDefaultCard(vendorId, cardId);
      if (response.success) {
        Alert.alert('Success', 'Default card set successfully');
        onUpdate();
      } else {
        Alert.alert('Error', response.message || 'Failed to set default card');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to set default card');
    }
  };

  const handleUploadCardImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images');
        return;
      }

      setUploadingImage(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        setFormData({
          ...formData,
          cardImage: {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            type: 'image/jpeg',
            base64: asset.base64,
            fileName: asset.fileName || 'card_image.jpg'
          }
        });

        Alert.alert('Success', 'Card image uploaded successfully');
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleShareCardImage = async () => {
    if (!formData.cardImage) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(formData.cardImage.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Card Image',
          UTI: 'public.jpeg'
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this card image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFormData({
              ...formData,
              cardImage: null
            });
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      cardNumber: '',
      cardHolderName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardType: 'debit',
      cardNetwork: 'visa',
      isDefault: false,
      cardImage: null
    });
    setErrors({});
    setShowCvv(false);
  };

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '').replace(/[^0-9]/g, '');
    let formatted = '';
    
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += cleaned[i];
    }

    const network = detectCardNetwork(cleaned);
    
    setFormData({ 
      ...formData, 
      cardNumber: formatted,
      cardNetwork: network 
    });
  };

  const formatExpiry = (text, field) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    
    if (field === 'month') {
      if (cleaned.length <= 2) {
        setFormData({ ...formData, expiryMonth: cleaned });
      }
    } else {
      if (cleaned.length <= 2) {
        setFormData({ ...formData, expiryYear: cleaned });
      }
    }
  };

  const getCardNetworkDetails = (network) => {
    return cardNetworks.find(n => n.value === network) || cardNetworks[4];
  };

  const cards = profile?.paymentProfile?.cards || [];

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Card Manager</Text>
          <Text style={styles.headerSubtitle}>Manage your debit and credit cards</Text>
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
        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="credit-card-off-outline" size={48} color="#ccc" />
            </View>
            <Text style={styles.emptyStateText}>No Cards Linked</Text>
            <Text style={styles.emptyStateSubText}>
              Add your debit or credit cards for faster payouts and transactions.
            </Text>
            <TouchableOpacity 
              style={styles.emptyAddBtn}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyAddBtnText}>Add New Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cards.map((card) => {
            const networkDetails = getCardNetworkDetails(card.cardNetwork);
            return (
              <View key={card._id} style={styles.cardItem}>
                <LinearGradient
                  colors={[networkDetails.color, '#2c3e50']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardPreview}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <MaterialCommunityIcons 
                        name={networkDetails.icon} 
                        size={32} 
                        color="#fff" 
                      />
                      <Text style={styles.cardNetworkText}>{card.cardNetwork.toUpperCase()}</Text>
                    </View>
                    {card.cardType === 'credit' && (
                      <View style={styles.creditBadge}>
                        <Text style={styles.creditBadgeText}>CREDIT</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.cardChipContainer}>
                    <LinearGradient
                      colors={['#ffd700', '#f1c40f']}
                      style={styles.cardChip}
                    >
                      <View style={styles.chipLine} />
                      <View style={styles.chipLine} />
                    </LinearGradient>
                  </View>
                  
                  <Text style={styles.cardNumberText}>
                    •••• •••• •••• {card.lastFourDigits}
                  </Text>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.cardHolderSection}>
                      <Text style={styles.cardLabel}>CARD HOLDER</Text>
                      <Text style={styles.cardHolderText}>{card.cardHolderName}</Text>
                    </View>
                    <View style={styles.expirySection}>
                      <Text style={styles.cardLabel}>EXPIRES</Text>
                      <Text style={styles.cardExpiryText}>{card.expiryMonth}/{card.expiryYear}</Text>
                    </View>
                  </View>

                  {card.isDefault && (
                    <View style={styles.cardDefaultBadge}>
                      <Icon name="verified" size={14} color="#fff" />
                      <Text style={styles.cardDefaultText}>PRIMARY</Text>
                    </View>
                  )}
                </LinearGradient>

                <View style={styles.cardActions}>
                  {!card.isDefault && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(card._id)}
                    >
                      <View style={[styles.actionIconContainer, { backgroundColor: '#EFF6FF' }]}>
                        <Icon name="check-circle" size={18} color="#4CAF50" />
                      </View>
                      <Text style={styles.actionButtonText}>Set Primary</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteCard(card._id)}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: '#FFEBEE' }]}>
                      <Icon name="delete-outline" size={18} color="#EF5350" />
                    </View>
                    <Text style={[styles.actionButtonText, styles.deleteText]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
                <Text style={styles.modalTitle}>Add New Card</Text>
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
                {(formData.cardNumber || formData.cardHolderName) && (
                  <View style={[styles.livePreview, { backgroundColor: getCardNetworkDetails(formData.cardNetwork).color }]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <MaterialCommunityIcons 
                          name={getCardNetworkDetails(formData.cardNetwork).icon} 
                          size={24} 
                          color="#fff" 
                        />
                        <Text style={styles.cardNetworkText}>{formData.cardNetwork.toUpperCase()}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.cardChip}>
                      <View style={styles.chipLine} />
                      <View style={styles.chipLine} />
                    </View>
                    
                    <Text style={styles.cardNumberText}>
                      {formData.cardNumber || '•••• •••• •••• ••••'}
                    </Text>
                    
                    <View style={styles.cardFooter}>
                      <View style={styles.cardHolderSection}>
                        <Text style={styles.cardLabel}>CARD HOLDER</Text>
                        <Text style={styles.cardHolderText}>
                          {formData.cardHolderName || 'YOUR NAME'}
                        </Text>
                      </View>
                      <View style={styles.expirySection}>
                        <Text style={styles.cardLabel}>EXPIRES</Text>
                        <Text style={styles.cardExpiryText}>
                          {formData.expiryMonth.padStart(2, '0') || 'MM'}/{formData.expiryYear.padStart(2, '0') || 'YY'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Card Number <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, errors.cardNumber && styles.inputError]}>
                    <MaterialCommunityIcons 
                      name={getCardNetworkDetails(formData.cardNetwork).icon} 
                      size={24} 
                      color={getCardNetworkDetails(formData.cardNetwork).color} 
                    />
                    <TextInput
                      style={styles.inputWithIcon}
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChangeText={formatCardNumber}
                      keyboardType="numeric"
                      maxLength={19}
                      editable={!loading}
                    />
                  </View>
                  {errors.cardNumber ? (
                    <Text style={styles.errorText}>{errors.cardNumber}</Text>
                  ) : (
                    <Text style={styles.hintText}>Enter 13-19 digit card number</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Card Holder Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.cardHolderName && styles.inputError]}
                    placeholder="Name as shown on card"
                    value={formData.cardHolderName}
                    onChangeText={(text) => setFormData({ ...formData, cardHolderName: text.toUpperCase() })}
                    autoCapitalize="characters"
                    editable={!loading}
                  />
                  {errors.cardHolderName && (
                    <Text style={styles.errorText}>{errors.cardHolderName}</Text>
                  )}
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>
                      Month <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, errors.expiryMonth && styles.inputError]}
                      placeholder="MM"
                      value={formData.expiryMonth}
                      onChangeText={(text) => formatExpiry(text, 'month')}
                      keyboardType="numeric"
                      maxLength={2}
                      editable={!loading}
                    />
                    {errors.expiryMonth && (
                      <Text style={styles.errorText}>{errors.expiryMonth}</Text>
                    )}
                  </View>

                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>
                      Year <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, errors.expiryYear && styles.inputError]}
                      placeholder="YY"
                      value={formData.expiryYear}
                      onChangeText={(text) => formatExpiry(text, 'year')}
                      keyboardType="numeric"
                      maxLength={2}
                      editable={!loading}
                    />
                    {errors.expiryYear && (
                      <Text style={styles.errorText}>{errors.expiryYear}</Text>
                    )}
                  </View>
                </View>

                {errors.expiryDate && (
                  <Text style={[styles.errorText, styles.expiryError]}>{errors.expiryDate}</Text>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    CVV <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, errors.cvv && styles.inputError]}>
                    <TextInput
                      style={styles.inputWithIcon}
                      placeholder={getCardNetworkDetails(formData.cardNetwork).cvvLength === 4 ? '1234' : '123'}
                      value={formData.cvv}
                      onChangeText={(text) => setFormData({ 
                        ...formData, 
                        cvv: text.replace(/[^0-9]/g, '')
                      })}
                      keyboardType="numeric"
                      maxLength={getCardNetworkDetails(formData.cardNetwork).cvvLength}
                      secureTextEntry={!showCvv}
                      editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowCvv(!showCvv)}>
                      <Icon 
                        name={showCvv ? "visibility-off" : "visibility"} 
                        size={24} 
                        color="#999" 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.cvv ? (
                    <Text style={styles.errorText}>{errors.cvv}</Text>
                  ) : (
                    <Text style={styles.hintText}>
                      {getCardNetworkDetails(formData.cardNetwork).cvvLength === 4 
                        ? '4-digit CVV on front of card' 
                        : '3-digit CVV on back of card'}
                    </Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Card Type</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.cardType}
                      onValueChange={(value) => setFormData({ ...formData, cardType: value })}
                      style={styles.picker}
                      enabled={!loading}
                      dropdownIconColor="#007AFF"
                    >
                      <Picker.Item label="Debit Card" value="debit" />
                      <Picker.Item label="Credit Card" value="credit" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Card Image (Optional)</Text>
                  {formData.cardImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image 
                        source={{ uri: formData.cardImage.uri }} 
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlay}>
                        <TouchableOpacity 
                          style={styles.imageActionButton}
                          onPress={handleShareCardImage}
                        >
                          <Icon name="share" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.imageActionButton, styles.removeImageButton]}
                          onPress={handleRemoveImage}
                        >
                          <Icon name="delete" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.imageFileName} numberOfLines={1}>
                        {formData.cardImage.fileName || 'Card Image'}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={handleUploadCardImage}
                      disabled={uploadingImage || loading}
                    >
                      {uploadingImage ? (
                        <ActivityIndicator color="#007AFF" />
                      ) : (
                        <>
                          <Icon name="cloud-upload" size={24} color="#007AFF" />
                          <Text style={styles.uploadButtonText}>
                            Upload Card Image
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <Text style={styles.hintText}>
                    Upload a clear image of your card (front side)
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
                  style={[styles.submitButton, (loading || uploadingImage) && styles.disabledButton]}
                  onPress={handleAddCard}
                  disabled={loading || uploadingImage}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add Card</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.securityNote}>
                  <Icon name="lock" size={16} color="#4CAF50" />
                  <Text style={styles.securityNoteText}>
                    Your card details are encrypted and securely stored
                  </Text>
                </View>

                <Text style={styles.disclaimerText}>
                  We do not store your full card number. Only the last 4 digits are saved for identification.
                </Text>
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
  cardItem: {
    marginBottom: 25,
  },
  cardPreview: {
    height: 200,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardNetworkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 1,
  },
  creditBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  creditBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  cardChipContainer: {
    marginTop: 10,
  },
  cardChip: {
    width: 45,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    padding: 6,
  },
  chipLine: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginVertical: 4,
  },
  cardNumberText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
    marginVertical: 15,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardHolderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  expirySection: {
    alignItems: 'flex-end',
  },
  cardExpiryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardDefaultBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardDefaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    paddingRight: 5,
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
  livePreview: {
    height: 180,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
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
  halfWidth: {
    width: '48%',
  },
  expiryError: {
    marginTop: -15,
    marginBottom: 15,
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
  imagePreviewContainer: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewImage: {
    width: '100%',
    height: 150,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
  },
  imageActionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
  },
  removeImageButton: {
    backgroundColor: 'rgba(255,59,48,0.8)',
  },
  imageFileName: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    padding: 4,
    fontSize: 12,
    textAlign: 'center',
    borderRadius: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  securityNoteText: {
    color: '#4CAF50',
    fontSize: 13,
    marginLeft: 8,
  },
  disclaimerText: {
    color: '#999',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CardTab;