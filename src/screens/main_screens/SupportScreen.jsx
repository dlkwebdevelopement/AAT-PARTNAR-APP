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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MessageIcon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../utils/constants';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AxiosService from '../../utils/AxioService';
import { API_URL } from '@env';

const SupportScreen = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [content, setContent] = useState('');
  const flatListRef = useRef(null);

  const SOCKET_SERVER_URL = API_URL;

  // Fetch sender & receiver on mount
  useEffect(() => {
    getUserData();
    getReceiverData();
  }, []);

  // Initialize socket when sender & receiver are ready
  useEffect(() => {
    if (sender && receiver) {
      initializeSocket();
      fetchMessages();
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [sender, receiver]);

  // Scroll to bottom whenever messages change
  useEffect(() => scrollToEnd(), [messages]);

  // Listen for keyboard show/hide
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', scrollToEnd);
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {});
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
      const res = await AxiosService.get('admin/GetAdmin');
      setReceiver(res.data.admin[0]._id);
    } catch (err) {
      console.log('Error fetching receiver data:', err);
    }
  };

  const initializeSocket = () => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.emit('join_room', sender);

    newSocket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });
  };

  const fetchMessages = async () => {
    try {
      const res = await AxiosService.post('customer/GetParticularChat', {
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
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 50);
  }, []);

  const sendMessage = () => {
    if (!content.trim()) return;

    const messageData = {
      sender,
      receiver,
      content,
      senderModel: 'vendors',
      receiverModel: 'admin',
      timestamp: Date.now(),
    };

    socket.emit('send_message', messageData);
    setMessages((prev) => [...prev, messageData]);
    setContent('');
    scrollToEnd();
  };

  const renderItem = ({ item }) => (
    <View style={{ marginBottom: 15 }}>
      <View style={{ flexDirection: item.sender === sender ? 'row-reverse' : 'row' }}>
        <MessageIcon
          name="chatbubble-ellipses"
          size={20}
          color={colors.dark_green}
          style={{ marginRight: 5 }}
        />
        <View
          style={[
            styles.messageContainer,
            item.sender === sender ? styles.sentMessage : styles.receivedMessage,
          ]}
        >
          <Text
            style={item.sender === sender ? styles.sentMessageText : styles.receivedMessageText}
          >
            {item.content}
          </Text>
        </View>
      </View>
      <Text style={item.sender === sender ? styles.sentTime : styles.receivedTime}>
        {new Date(item.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {messages.length === 0 && (
        <View style={styles.noMessagesContainer}>
          <Image
            source={require('../../assets/Images/chat.jpg')}
            style={styles.noMessagesImage}
          />
          <Text style={styles.headingText}>Hello, How can we{"\n"}Help you?</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToEnd}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={content}
          onChangeText={setContent}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Icon name="send" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  messagesList: { padding: 10 },
  messageContainer: { padding: 10, borderRadius: 8, maxWidth: '70%' },
  sentMessage: { backgroundColor: colors.dark_green, alignSelf: 'flex-end', marginRight: 5 },
  receivedMessage: { backgroundColor: colors.lightGray, alignSelf: 'flex-start' },
  sentMessageText: { color: colors.white, fontSize: 15 },
  receivedMessageText: { color: colors.black, fontSize: 15 },
  sentTime: { fontSize: 12, color: colors.black, alignSelf: 'flex-end' },
  receivedTime: { fontSize: 12, color: colors.black, alignSelf: 'flex-start', marginLeft: 30 },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 0.7,
    borderTopColor: colors.gray,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 0.7,
    borderColor: colors.gray,
    backgroundColor: colors.babyGray,
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 25,
    backgroundColor: colors.dark_green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMessagesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noMessagesImage: { width: 130, height: 130, opacity: 0.9, marginTop: 20 },
  headingText: { textAlign: 'center', fontSize: 22, fontWeight: '700', marginTop: 5, marginBottom: 20, color: colors.dark_gray },
});

export default SupportScreen;
