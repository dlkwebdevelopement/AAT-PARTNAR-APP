import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { colors } from '../../utils/constants'
import AxiosService from '../../utils/AxioService'
import AsyncStorage from '@react-native-async-storage/async-storage'

const WithdrawalHistory = ({ refreshTrigger }) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchWithdrawHistory()
  }, [refreshTrigger])

  const fetchWithdrawHistory = async () => {
    setLoading(true)
    try {
      const vendorData = await AsyncStorage.getItem('user');
      if (!vendorData) return;
      const vendor = JSON.parse(vendorData);
      const vendorId = vendor._id;
      const response = await AxiosService.get(`/vendor-payment/get-withdraw-history/${vendorId}`);
      if (response.data.success) {
        setHistory(response.data.history);
      }
    } catch (error) {
      console.error('Error fetching withdraw history:', error);
    } finally {
      setLoading(false)
    }
  }

  if (loading && history.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.deep_blue} size="large" />
      </View>
    )
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No withdrawal history yet</Text>
      </View>
    )
  }

  return (
    <View>
      {history.map((item, index) => {
        const statusColors = {
          'PENDING': { text: colors.blue || '#118ab2', label: '⏳ Pending' },
          'PROCESSING': { text: '#f57c00', label: '⚙️ Processing' },
          'SUCCESS': { text: colors.deep_blue || '#2e7d32', label: '✅ Success' },
          'FAILED': { text: colors.red || '#c62828', label: '❌ Failed' },
        };
        const status = statusColors[item.status] || { text: colors.dark_gray, label: item.status };

        return (
          <View key={item._id || index} style={[styles.history_card, { borderLeftColor: status.text }]}>
            <View style={styles.card_row}>
              <View>
                <Text style={styles.date_text}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                <Text style={styles.id_text}>ID: {item._id ? item._id.slice(-8) : ''}</Text>
                <Text style={styles.method_text}>
                  {item.payoutMethod === 'bank' ? '🏦 Bank Payout' : '📱 UPI Payout'}
                </Text>
              </View>
              <View style={styles.amount_col}>
                <Text style={[styles.amount_text, { color: status.text }]}>
                  ₹{item.amount.toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.status_text, { color: status.text }]}>
                  {status.label}
                </Text>
              </View>
            </View>
            {item.remarks && (
              <Text style={styles.remarks_text}>{item.remarks}</Text>
            )}
          </View>
        )
      })}
    </View>
  )
}

export default WithdrawalHistory

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    elevation: 1,
    marginVertical: 10,
  },
  emptyText: {
    color: colors.dark_gray,
    fontSize: 14,
    fontWeight: '500',
  },
  history_card: {
    backgroundColor: colors.white,
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
    elevation: 1.5,
    borderLeftWidth: 4,
  },
  card_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date_text: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  id_text: {
    fontSize: 11,
    color: colors.dark_gray,
    marginTop: 2,
  },
  method_text: {
    fontSize: 12,
    color: colors.dark_gray,
    marginTop: 4,
    fontWeight: '500',
  },
  amount_col: {
    alignItems: 'flex-end',
  },
  amount_text: {
    fontSize: 16,
    fontWeight: '700',
  },
  status_text: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  remarks_text: {
    fontSize: 11,
    color: colors.dark_gray,
    fontStyle: 'italic',
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.light_gray,
    paddingTop: 6,
  }
})
