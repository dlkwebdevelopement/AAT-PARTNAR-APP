import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/constants';
import AxiosService from '../../utils/AxioService';
import * as Contacts from 'expo-contacts';

const EmergencyContactsScreen = () => {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relation, setRelation] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      const vendorId = userStr ? JSON.parse(userStr)._id : null;
      if (!vendorId) return;
      const res = await AxiosService.get(`vendor/get-emergency-contacts/${vendorId}`);
      if (res.status === 200) {
        setContacts(res.data.contacts || []);
      }
    } catch (error) {
      console.log('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const contact = await Contacts.presentContactPickerAsync();
        if (contact) {
          setName(contact.name || '');
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            let phone = contact.phoneNumbers[0].number.replace(/[^0-9]/g, '');
            if (phone.length > 10) phone = phone.slice(-10);
            setPhoneNumber(phone);
          } else {
            Alert.alert('No Phone Number', 'The selected contact does not have a phone number.');
          }
        }
      } else {
        Alert.alert('Permission Denied', 'You need to grant permission to access contacts.');
      }
    } catch (error) {
      console.log('Error picking contact:', error);
    }
  };

  const handleAddContact = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a name and phone number.');
      return;
    }
    if (contacts.length >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 emergency contacts.');
      return;
    }

    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      const vendorId = userStr ? JSON.parse(userStr)._id : null;
      if (!vendorId) {
        Alert.alert('Error', 'Vendor ID not found.');
        return;
      }
      
      const res = await AxiosService.post('vendor/add-emergency-contact', {
        vendorId,
        name,
        phoneNumber,
        relation,
      });

      if (res.status === 201) {
        Alert.alert('Success', 'Emergency contact added.');
        setName('');
        setPhoneNumber('');
        setRelation('');
        fetchContacts();
      }
    } catch (error) {
      console.log('Error adding contact:', error);
      Alert.alert('Error', 'An error occurred while adding the contact.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.infoBox}>
            <Icon name="information" size={20} color={colors.deep_blue} />
            <Text style={styles.infoText}>
              Add up to 3 trusted contacts. We will notify them via SMS if you trigger the SOS Panic Button.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Icon name="account-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contact Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Icon name="phone-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (10 digits)"
                placeholderTextColor="#999"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.radioGroupWrapper}>
              <Text style={styles.radioGroupLabel}>Relation:</Text>
              <View style={styles.radioGroup}>
                {['Family', 'Friend', 'Other'].map((relOption) => (
                  <TouchableOpacity
                    key={relOption}
                    style={styles.radioButton}
                    onPress={() => setRelation(relOption)}
                  >
                    <Icon 
                      name={relation === relOption ? "radiobox-marked" : "radiobox-blank"} 
                      size={22} 
                      color={relation === relOption ? colors.deep_blue : "#888"} 
                    />
                    <Text style={[
                      styles.radioText,
                      relation === relOption && styles.radioTextSelected
                    ]}>
                      {relOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.pickButton} 
              onPress={handlePickContact}
            >
              <Icon name="contacts" size={20} color={colors.deep_blue} style={{ marginRight: 8 }} />
              <Text style={styles.pickButtonText}>Select from Phonebook</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.addButton, (loading || contacts.length >= 3) && styles.disabledButton]} 
              onPress={handleAddContact} 
              disabled={loading || contacts.length >= 3}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Icon name="plus-circle-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
                  <Text style={styles.addButtonText}>Add Contact</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Contacts</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{contacts.length}/3</Text>
            </View>
          </View>
          
          <FlatList
            data={contacts}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.contactCard}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : '?'}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
                  <Text style={styles.contactRelation}>{item.relation || 'Contact'}</Text>
                </View>
                <View style={styles.shieldIcon}>
                  <Icon name="shield-check" size={24} color={colors.deep_blue} />
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="account-group-outline" size={40} color="#ccc" />
                <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
              </View>
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA' 
  },
  content: { 
    paddingHorizontal: 20,
    paddingTop: 10,
    flex: 1 
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoText: { 
    flex: 1,
    fontSize: 13, 
    color: colors.deep_blue, 
    marginLeft: 10,
    lineHeight: 18,
  },
  formContainer: {
    marginBottom: 25,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  radioGroupWrapper: {
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  radioGroupLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
  },
  radioText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  radioTextSelected: {
    color: colors.deep_blue,
    fontWeight: '700',
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 30,
    marginBottom: 12,
    alignSelf: 'center',
    width: '80%',
  },
  pickButtonText: { 
    color: colors.deep_blue, 
    fontSize: 15, 
    fontWeight: '700' 
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: colors.deep_blue,
    borderRadius: 30,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    alignSelf: 'center',
    width: '80%',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
    elevation: 0,
    shadowOpacity: 0,
  },
  addButtonText: { 
    color: colors.white, 
    fontSize: 15, 
    fontWeight: 'bold' 
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: colors.deep_blue 
  },
  countBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.deep_blue,
  },
  contactCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  contactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8EAF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.deep_blue,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: colors.deep_blue,
    marginBottom: 4,
  },
  contactPhone: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 2,
  },
  contactRelation: { 
    fontSize: 12, 
    color: '#999',
    fontWeight: '500',
  },
  shieldIcon: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#999', 
    marginTop: 10,
    fontSize: 14,
  },
});

export default EmergencyContactsScreen;
