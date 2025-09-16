
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../styles/commonStyles';
import * as SMS from 'expo-sms';
import * as SecureStore from 'expo-secure-store';

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  type: 'incoming' | 'outgoing';
}

interface SMSManagerProps {
  onBack: () => void;
}

export default function SMSManager({ onBack }: SMSManagerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [targetPhone, setTargetPhone] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [secretCode, setSecretCode] = useState('1978');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  useEffect(() => {
    loadSettings();
    loadMessages();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTargetPhone = await SecureStore.getItemAsync('targetPhone');
      const savedSecretCode = await SecureStore.getItemAsync('secretCode');
      
      if (savedTargetPhone) setTargetPhone(savedTargetPhone);
      if (savedSecretCode) setSecretCode(savedSecretCode);
      
      console.log('Settings loaded');
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await SecureStore.setItemAsync('targetPhone', targetPhone);
      await SecureStore.setItemAsync('secretCode', secretCode);
      console.log('Settings saved');
      Alert.alert('تنظیمات', 'تنظیمات با موفقیت ذخیره شد');
    } catch (error) {
      console.log('Error saving settings:', error);
      Alert.alert('خطا', 'خطا در ذخیره تنظیمات');
    }
  };

  const loadMessages = async () => {
    try {
      const savedMessages = await SecureStore.getItemAsync('messages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
      console.log('Messages loaded');
    } catch (error) {
      console.log('Error loading messages:', error);
    }
  };

  const saveMessages = async (newMessages: Message[]) => {
    try {
      await SecureStore.setItemAsync('messages', JSON.stringify(newMessages));
      console.log('Messages saved');
    } catch (error) {
      console.log('Error saving messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !targetPhone.trim()) {
      Alert.alert('خطا', 'لطفا پیام و شماره هدف را وارد کنید');
      return;
    }

    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('خطا', 'SMS در این دستگاه پشتیبانی نمی‌شود');
        return;
      }

      // Create message object
      const message: Message = {
        id: Date.now().toString(),
        from: 'Me',
        to: targetPhone,
        body: newMessage,
        timestamp: new Date(),
        type: 'outgoing'
      };

      // Add to messages list
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      await saveMessages(updatedMessages);

      // Send SMS
      await SMS.sendSMSAsync([targetPhone], newMessage);
      
      setNewMessage('');
      console.log('Message sent successfully');
      
    } catch (error) {
      console.log('Error sending message:', error);
      Alert.alert('خطا', 'خطا در ارسال پیام');
    }
  };

  const simulateIncomingMessage = () => {
    const message: Message = {
      id: Date.now().toString(),
      from: targetPhone || 'Unknown',
      to: 'Me',
      body: 'پیام تست دریافتی',
      timestamp: new Date(),
      type: 'incoming'
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    console.log('Simulated incoming message');
  };

  const clearMessages = () => {
    Alert.alert(
      'پاک کردن پیام‌ها',
      'آیا مطمئن هستید که می‌خواهید همه پیام‌ها را پاک کنید؟',
      [
        { text: 'لغو', style: 'cancel' },
        {
          text: 'پاک کردن',
          style: 'destructive',
          onPress: async () => {
            setMessages([]);
            await saveMessages([]);
            console.log('Messages cleared');
          }
        }
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isSettingsVisible) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsSettingsVisible(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>بازگشت</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تنظیمات</Text>
        </View>

        <ScrollView style={styles.settingsContainer}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>شماره هدف:</Text>
            <TextInput
              style={styles.settingInput}
              value={targetPhone}
              onChangeText={setTargetPhone}
              placeholder="شماره تلفن هدف را وارد کنید"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>رمز مخفی:</Text>
            <TextInput
              style={styles.settingInput}
              value={secretCode}
              onChangeText={setSecretCode}
              placeholder="رمز مخفی جدید"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>ذخیره تنظیمات</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={clearMessages}>
            <Text style={styles.clearButtonText}>پاک کردن همه پیام‌ها</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>بازگشت</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مدیریت پیامک</Text>
        <TouchableOpacity onPress={() => setIsSettingsVisible(true)} style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>تنظیمات</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <Text style={styles.noMessagesText}>هیچ پیامی موجود نیست</Text>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageItem,
                message.type === 'outgoing' ? styles.outgoingMessage : styles.incomingMessage
              ]}
            >
              <Text style={styles.messageFrom}>
                {message.type === 'outgoing' ? `به: ${message.to}` : `از: ${message.from}`}
              </Text>
              <Text style={styles.messageBody}>{message.body}</Text>
              <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="پیام خود را بنویسید..."
          multiline
          maxLength={160}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>ارسال</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.testButton} onPress={simulateIncomingMessage}>
        <Text style={styles.testButtonText}>شبیه‌سازی پیام دریافتی</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary,
    elevation: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.backgroundAlt,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 6,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 6,
  },
  settingsButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  noMessagesText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 50,
  },
  messageItem: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    maxWidth: '80%',
  },
  incomingMessage: {
    backgroundColor: colors.grey,
    alignSelf: 'flex-start',
  },
  outgoingMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  messageFrom: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  messageBody: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.grey,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: colors.background,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: colors.backgroundAlt,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: colors.secondary,
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: colors.backgroundAlt,
    fontWeight: '600',
  },
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: colors.grey,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.backgroundAlt,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: colors.backgroundAlt,
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: colors.error,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  clearButtonText: {
    color: colors.backgroundAlt,
    fontSize: 16,
    fontWeight: '600',
  },
});
