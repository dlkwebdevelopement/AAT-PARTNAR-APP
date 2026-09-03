import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import AxiosService from '../../utils/AxioService';

const Advance = ({ navigation }) => {
  const [percentage, setPercentage] = useState('30');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [vendorId, setVendorId] = useState(null);

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      setFetching(true);
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        const vId = parsedUser._id || parsedUser.id;
        setVendorId(vId);
        const res = await AxiosService.post('vendor/getVendorById', { vendorId: vId });
        if (res.status === 200 && res.data.vendor) {
          const advPct = res.data.vendor.advancePercentage;
          if (advPct !== undefined && advPct !== null) {
            setPercentage(advPct.toString());
          }
        }
      }
    } catch (e) {
      console.log('Error fetching profile', e);
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    const num = parseFloat(percentage);
    if (isNaN(num) || num < 1 || num > 100) {
      Toast.show({ type: 'error', text1: 'Invalid Percentage', text2: 'Please enter a value between 1 and 100.' });
      return;
    }
    try {
      setLoading(true);
      const res = await AxiosService.post('vendor/updateAdvancePercentage', {
        vendorId,
        advancePercentage: num,
      });
      if (res.status === 200) {
        Toast.show({ type: 'success', text1: 'Updated Successfully', text2: 'Advance percentage updated.' });
        navigation.goBack();
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#0B1A3D', '#132D6B', '#1B3D8F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerActionBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Advance Setting</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        {fetching ? (
          <ActivityIndicator size="large" color="#0B1A3D" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="wallet-outline" size={40} color="#0B1A3D" />
            </View>
            <Text style={styles.title}>Advance Percentage</Text>
            <Text style={styles.desc}>
              Set the advance percentage that customers must pay when booking your passenger vehicles (Auto, Car, Van, Bus). 
              For example, enter 30 for 30%.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={percentage}
                onChangeText={setPercentage}
                maxLength={3}
              />
              <Text style={styles.percentSymbol}>%</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.disabledBtn]}
              onPress={handleUpdate}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9e9e9e', '#9e9e9e'] : ['#3B82F6', '#2563EB']}
                style={styles.saveBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 30,
    width: '60%',
    backgroundColor: '#f9fafb',
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0B1A3D',
    textAlign: 'center',
    paddingVertical: 12,
  },
  percentSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  saveBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Advance;
