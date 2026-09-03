import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MessageIcon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../utils/constants';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AxiosService from '../../utils/AxioService';
import { API_URL, API_BASE_URL } from '@env';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const C = {
  bg: colors.white,
};

const SupportScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [content, setContent] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    let activeSocket = null;
    if (sender && receiver) {
      const SOCKET_SERVER_URL = API_BASE_URL || (API_URL ? API_URL.replace(/\/api$/, '') : 'http://localhost:4000');
      console.log('Connecting socket to:', SOCKET_SERVER_URL);
      activeSocket = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      setSocket(activeSocket);

      activeSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        activeSocket.emit('join_room', sender);
      });

      activeSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      activeSocket.on('receive_message', (data) => {
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (msg) =>
              msg.content === data.content &&
              msg.sender === data.sender &&
              Math.abs(new Date(msg.timestamp).getTime() - new Date(data.timestamp).getTime()) < 10000
          );
          if (isDuplicate) return prev;
          return [...prev, { ...data, isNew: true }];
        });
      });

      fetchMessages();
    }
    return () => {
      if (activeSocket) activeSocket.disconnect();
    };
  }, [sender, receiver]);

  useEffect(() => {
    scrollToEnd();
  }, [messages]);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', (e) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(scrollToEnd, 150);
    });
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const initializeChat = async () => {
    setIsLoading(true);
    await Promise.all([getUserData(), getReceiverData()]);
    setIsLoading(false);
  };

  const getUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const user = JSON.parse(userData);
      setSender(user._id);
    } catch (err) {
      console.log('Error fetching user data:', err);
    }
  };

  const getReceiverData = async () => {
    try {
      const res = await AxiosService.get('customer/getSupportAdmin');
      setReceiver(res.data.admin._id);
    } catch (err) {
      console.log('Error fetching receiver data:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await AxiosService.post('vendor/getParticularVendorChat', {
        sender,
        receiver,
      });
      if (res.status === 200) setMessages(res.data.messages || []);
    } catch (err) {
      console.log('Error fetching messages:', err);
    }
  };

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [messages.length]);

  const sendMessage = async () => {
    if (!content.trim() || !socket || !isConnected) return;

    setIsSending(true);
    const messageData = {
      sender,
      receiver,
      content: content.trim(),
      senderModel: 'vendors',
      receiverModel: 'admin',
      timestamp: Date.now(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, { ...messageData, isNew: true }]);
    setContent('');
    scrollToEnd();

    try {
      socket.emit('send_message', messageData);
      setMessages((prev) =>
        prev.map(msg =>
          msg.timestamp === messageData.timestamp && msg.content === messageData.content
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map(msg =>
          msg.timestamp === messageData.timestamp && msg.content === messageData.content
            ? { ...msg, status: 'error' }
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageStatus = (status) => {
    if (status === 'sending') {
      return <ActivityIndicator size="small" color={colors.gray} style={styles.messageStatus} />;
    }
    if (status === 'error') {
      return <Icon name="alert-circle-outline" size={14} color={colors.error} style={styles.messageStatus} />;
    }
    return <Icon name="check-all" size={14} color={colors.gray} style={styles.messageStatus} />;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const isToday = diff < 24 * 60 * 60 * 1000;

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item, index }) => {
    const isSent = item.sender === sender;
    const showAvatar = !isSent && (index === 0 || messages[index - 1]?.sender !== item.sender);
    const showTime = index === messages.length - 1 ||
      formatTime(item.timestamp) !== formatTime(messages[index + 1]?.timestamp);

    return (
      <View style={styles.messageRow}>
        {!isSent && showAvatar && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Icon name="headset" size={20} color={colors.white} />
            </View>
          </View>
        )}
        {!isSent && !showAvatar && <View style={styles.avatarPlaceholder} />}

        <View style={[
          styles.messageContainer,
          isSent ? styles.sentMessage : styles.receivedMessage,
          !showAvatar && !isSent && styles.receivedMessageNoAvatar
        ]}>
          <Text style={isSent ? styles.sentMessageText : styles.receivedMessageText}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            {showTime && (
              <Text style={isSent ? styles.sentTime : styles.receivedTime}>
                {formatTime(item.timestamp)}
              </Text>
            )}
            {isSent && renderMessageStatus(item.status)}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.deep_blue} />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={styles.mainContainer}>
        {messages.length === 0 ? (
          <View style={styles.noMessagesContainer}>
            <Icon name="chat-processing-outline" size={100} color={colors.deep_blue} style={styles.noMessagesIcon} />
            <Text style={styles.welcomeTitle}>Hello, How can we{'\n'}Help you?</Text>
            <Text style={styles.welcomeSubtitle}>
              Send us a message and our support team will assist you
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => `${item.timestamp}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={scrollToEnd}
            onLayout={scrollToEnd}
            style={styles.flatList}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Fixed Input Section with Bottom Safe Area */}
        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={[
            styles.inputSection,
            isKeyboardVisible && { marginBottom: keyboardHeight }
          ]}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor={colors.gray}
                value={content}
                onChangeText={setContent}
                onFocus={scrollToEnd}
                multiline
                returnKeyType="send"
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!content.trim() || !isConnected || isSending) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!content.trim() || !isConnected || isSending}
                activeOpacity={0.8}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Icon name="send" size={22} color={colors.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray,
  },

  // Main Container
  mainContainer: {
    flex: 1,
    position: 'relative',
  },

  // Messages Styles
  flatList: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.deep_blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    marginRight: 8,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  sentMessage: {
    backgroundColor: colors.deep_blue,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  receivedMessage: {
    backgroundColor: colors.lightGray,
    borderBottomLeftRadius: 4,
  },
  receivedMessageNoAvatar: {
    marginLeft: 40,
  },
  sentMessageText: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 20,
  },
  receivedMessageText: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  sentTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  receivedTime: {
    fontSize: 10,
    color: colors.gray,
  },
  messageStatus: {
    marginLeft: 4,
  },

  // Fixed Input Section Styles
  inputSafeArea: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  inputSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.babyGray,
    fontSize: 15,
    color: colors.black,
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.deep_blue,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },

  // Empty State Styles
  noMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noMessagesIcon: {
    marginBottom: 24,
    opacity: 0.9,
  },
  welcomeTitle: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.deep_blue,
    lineHeight: 32,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },
});

export default SupportScreen;