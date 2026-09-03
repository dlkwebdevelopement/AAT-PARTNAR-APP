import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/constants';
import AxiosService from '../../utils/AxioService';

const ReportScreen = ({ route }) => {
  const navigation = useNavigation();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const bookingId = route.params?.bookingId || null;

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description.');
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
      
      const res = await AxiosService.post('vendor/submit-report', {
        vendorId,
        subject,
        description,
        bookingId,
      });

      if (res.status === 201) {
        Alert.alert('Success', 'Your report has been submitted to the admin.');
        setSubject('');
        setDescription('');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to submit report. Please try again later.');
      }
    } catch (error) {
      console.log('Error submitting report:', error);
      Alert.alert('Error', 'An error occurred while submitting your report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.infoText}>
            Describe the issue you are facing or provide feedback. Our support team will look into it.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Subject</Text>
            <View style={styles.inputWrapper}>
              <Icon name="format-title" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E.g., App crashing on ride start"
                placeholderTextColor="#9CA3AF"
                value={subject}
                onChangeText={setSubject}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Icon name="text-box-outline" size={20} color="#9CA3AF" style={styles.textAreaIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Please provide details..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="send" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    backgroundColor: '#FAFAFA',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
  headerTitle: {
    color: colors.deep_blue,
    fontSize: 22,
    fontWeight: '800',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  infoText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.deep_blue,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  textAreaWrapper: {
    height: 'auto',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textAreaIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 120,
    lineHeight: 24,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.deep_blue,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '60%',
    alignSelf: 'center',
    gap: 8,
    shadowColor: colors.deep_blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default ReportScreen;
