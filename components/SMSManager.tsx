
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../styles/commonStyles';
import * as SMS from 'expo-sms';
import * as SecureStore from 'expo-secure-store';
import * as Contacts from 'expo-contacts';

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  type: 'incoming' | 'outgoing';
  isDeleted?: boolean;
  deletedAt?: Date;
  contactName?: string; // Added contact name field
}

interface DeletionNotification {
  id: string;
  messageId: string;
  messagePreview: string;
  deletedAt: Date;
  from: string;
  to: string;
  contactName?: string; // Added contact name field
}

interface SMSManagerProps {
  onBack: () => void;
}

export default function SMSManager({ onBack }: SMSManagerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [deletionNotifications, setDeletionNotifications] = useState<DeletionNotification[]>([]);
  const [targetPhone, setTargetPhone] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [secretCode, setSecretCode] = useState('1978');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [showDeletions, setShowDeletions] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [contactsPermission, setContactsPermission] = useState(false);

  const checkForDeletedMessages = async () => {
    try {
      // This simulates checking for deleted messages
      // In a real implementation, you would compare current SMS database with stored messages
      console.log('Checking for deleted messages...');
      
      // For demonstration, we'll randomly mark some messages as deleted
      const updatedMessages = messages.map(msg => {
        if (!msg.isDeleted && Math.random() < 0.01) { // 1% chance of deletion simulation
          return {
            ...msg,
            isDeleted: true,
            deletedAt: new Date()
          };
        }
        return msg;
      });

      // Find newly deleted messages
      const newlyDeleted = updatedMessages.filter((msg, index) => 
        msg.isDeleted && !messages[index]?.isDeleted
      );

      if (newlyDeleted.length > 0) {
        // Create deletion notifications with contact names
        const newNotifications: DeletionNotification[] = [];
        
        for (const msg of newlyDeleted) {
          const contactName = await getContactName(msg.from);
          newNotifications.push({
            id: Date.now().toString() + Math.random().toString(),
            messageId: msg.id,
            messagePreview: msg.body.substring(0, 50) + (msg.body.length > 50 ? '...' : ''),
            deletedAt: msg.deletedAt!,
            from: msg.from,
            to: msg.to,
            contactName: contactName !== msg.from ? contactName : undefined
          });
        }

        const allNotifications = [...deletionNotifications, ...newNotifications];
        setDeletionNotifications(allNotifications);
        await saveDeletionNotifications(allNotifications);

        // Send deletion notification to target phone
        if (targetPhone && newNotifications.length > 0) {
          await sendDeletionNotification(newNotifications);
        }

        setMessages(updatedMessages);
        await saveMessages(updatedMessages);
        
        console.log(`${newlyDeleted.length} messages marked as deleted`);
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.log('Error checking for deleted messages:', error);
    }
  };

  useEffect(() => {
    requestContactsPermission();
    loadSettings();
    loadMessages();
    loadDeletionNotifications();
    
    // Start monitoring for deletions every 30 seconds
    const deletionMonitor = setInterval(() => {
      checkForDeletedMessages();
    }, 30000);

    return () => clearInterval(deletionMonitor);
  }, [checkForDeletedMessages]);

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setContactsPermission(status === 'granted');
      console.log('Contacts permission status:', status);
    } catch (error) {
      console.log('Error requesting contacts permission:', error);
    }
  };

  const getContactName = async (phoneNumber: string): Promise<string> => {
    if (!contactsPermission) {
      console.log('Contacts permission not granted');
      return phoneNumber;
    }

    try {
      // Clean the phone number for better matching
      const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');
      
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      // Search for contact with matching phone number
      for (const contact of data) {
        if (contact.phoneNumbers) {
          for (const phone of contact.phoneNumbers) {
            const cleanContactNumber = phone.number?.replace(/[\s\-()]/g, '') || '';
            
            // Check if numbers match (considering different formats)
            if (cleanContactNumber.includes(cleanNumber.slice(-10)) || 
                cleanNumber.includes(cleanContactNumber.slice(-10))) {
              console.log(`Found contact: ${contact.name} for number: ${phoneNumber}`);
              return contact.name || phoneNumber;
            }
          }
        }
      }
      
      console.log(`No contact found for number: ${phoneNumber}`);
      return phoneNumber;
    } catch (error) {
      console.log('Error getting contact name:', error);
      return phoneNumber;
    }
  };

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
          timestamp: new Date(msg.timestamp),
          deletedAt: msg.deletedAt ? new Date(msg.deletedAt) : undefined
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

  const loadDeletionNotifications = async () => {
    try {
      const savedNotifications = await SecureStore.getItemAsync('deletionNotifications');
      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications);
        setDeletionNotifications(parsedNotifications.map((notif: any) => ({
          ...notif,
          deletedAt: new Date(notif.deletedAt)
        })));
      }
      console.log('Deletion notifications loaded');
    } catch (error) {
      console.log('Error loading deletion notifications:', error);
    }
  };

  const saveDeletionNotifications = async (notifications: DeletionNotification[]) => {
    try {
      await SecureStore.setItemAsync('deletionNotifications', JSON.stringify(notifications));
      console.log('Deletion notifications saved');
    } catch (error) {
      console.log('Error saving deletion notifications:', error);
    }
  };

  const sendDeletionNotification = async (notifications: DeletionNotification[]) => {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        console.log('SMS not available for deletion notification');
        return;
      }

      for (const notification of notifications) {
        const displayName = notification.contactName || notification.from;
        const deletionMessage = `🗑️ پیام حذف شده:\nاز: ${displayName}\nمتن: ${notification.messagePreview}\nزمان حذف: ${notification.deletedAt.toLocaleString('fa-IR')}`;
        
        await SMS.sendSMSAsync([targetPhone], deletionMessage);
        console.log('Deletion notification sent to target phone with contact name');
      }
    } catch (error) {
      console.log('Error sending deletion notification:', error);
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

      // Get contact name for target phone
      const targetContactName = await getContactName(targetPhone);

      // Create message object
      const message: Message = {
        id: Date.now().toString(),
        from: 'Me',
        to: targetPhone,
        body: newMessage,
        timestamp: new Date(),
        type: 'outgoing',
        contactName: targetContactName !== targetPhone ? targetContactName : undefined
      };

      // Add to messages list
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      await saveMessages(updatedMessages);

      // Send SMS with contact name if available
      const displayName = targetContactName !== targetPhone ? targetContactName : targetPhone;
      await SMS.sendSMSAsync([targetPhone], `📱 پیام ارسالی به ${displayName}:\n${newMessage}`);
      
      setNewMessage('');
      console.log('Message forwarded to target phone with contact name');
      
    } catch (error) {
      console.log('Error sending message:', error);
      Alert.alert('خطا', 'خطا در ارسال پیام');
    }
  };

  const simulateIncomingMessage = async () => {
    const fromNumber = targetPhone || '+989123456789';
    const contactName = await getContactName(fromNumber);
    
    const message: Message = {
      id: Date.now().toString(),
      from: fromNumber,
      to: 'Me',
      body: 'پیام تست دریافتی',
      timestamp: new Date(),
      type: 'incoming',
      contactName: contactName !== fromNumber ? contactName : undefined
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    await saveMessages(updatedMessages);
    
    // Send notification to target phone with contact name
    if (targetPhone) {
      const displayName = contactName !== fromNumber ? contactName : fromNumber;
      const forwardMessage = `📨 پیام دریافتی از ${displayName}:\n${message.body}`;
      
      try {
        const isAvailable = await SMS.isAvailableAsync();
        if (isAvailable) {
          await SMS.sendSMSAsync([targetPhone], forwardMessage);
          console.log('Incoming message forwarded with contact name');
        }
      } catch (error) {
        console.log('Error forwarding incoming message:', error);
      }
    }
    
    console.log('Simulated incoming message with contact resolution');
  };

  const simulateMessageDeletion = async () => {
    if (messages.length === 0) {
      Alert.alert('خطا', 'هیچ پیامی برای حذف وجود ندارد');
      return;
    }

    const randomIndex = Math.floor(Math.random() * messages.length);
    const messageToDelete = messages[randomIndex];

    if (messageToDelete.isDeleted) {
      Alert.alert('خطا', 'این پیام قبلاً حذف شده است');
      return;
    }

    const updatedMessages = [...messages];
    updatedMessages[randomIndex] = {
      ...messageToDelete,
      isDeleted: true,
      deletedAt: new Date()
    };

    // Get contact name for the message sender
    const contactName = await getContactName(messageToDelete.from);

    // Create deletion notification with contact name
    const deletionNotification: DeletionNotification = {
      id: Date.now().toString(),
      messageId: messageToDelete.id,
      messagePreview: messageToDelete.body.substring(0, 50) + (messageToDelete.body.length > 50 ? '...' : ''),
      deletedAt: new Date(),
      from: messageToDelete.from,
      to: messageToDelete.to,
      contactName: contactName !== messageToDelete.from ? contactName : undefined
    };

    const allNotifications = [...deletionNotifications, deletionNotification];
    setDeletionNotifications(allNotifications);
    await saveDeletionNotifications(allNotifications);

    setMessages(updatedMessages);
    await saveMessages(updatedMessages);

    // Send deletion notification with contact name
    if (targetPhone) {
      await sendDeletionNotification([deletionNotification]);
    }

    console.log('Message deletion simulated with contact name resolution');
    Alert.alert('شبیه‌سازی', 'حذف پیام شبیه‌سازی شد');
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

  const clearDeletionNotifications = () => {
    Alert.alert(
      'پاک کردن اعلان‌های حذف',
      'آیا مطمئن هستید که می‌خواهید همه اعلان‌های حذف را پاک کنید؟',
      [
        { text: 'لغو', style: 'cancel' },
        {
          text: 'پاک کردن',
          style: 'destructive',
          onPress: async () => {
            setDeletionNotifications([]);
            await saveDeletionNotifications([]);
            console.log('Deletion notifications cleared');
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

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>دسترسی به مخاطبین:</Text>
            <Text style={[styles.settingValue, { color: contactsPermission ? colors.success : colors.error }]}>
              {contactsPermission ? 'مجاز ✓' : 'غیرمجاز ✗'}
            </Text>
            {!contactsPermission && (
              <TouchableOpacity style={styles.permissionButton} onPress={requestContactsPermission}>
                <Text style={styles.permissionButtonText}>درخواست دسترسی</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>آخرین بررسی حذف:</Text>
            <Text style={styles.settingValue}>{formatDateTime(lastSyncTime)}</Text>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>ذخیره تنظیمات</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={clearMessages}>
            <Text style={styles.clearButtonText}>پاک کردن همه پیام‌ها</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={clearDeletionNotifications}>
            <Text style={styles.clearButtonText}>پاک کردن اعلان‌های حذف</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (showDeletions) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDeletions(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>بازگشت</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>پیام‌های حذف شده ({deletionNotifications.length})</Text>
        </View>

        <ScrollView style={styles.messagesContainer}>
          {deletionNotifications.length === 0 ? (
            <Text style={styles.noMessagesText}>هیچ پیام حذف شده‌ای موجود نیست</Text>
          ) : (
            deletionNotifications.map((notification) => (
              <View key={notification.id} style={styles.deletionNotification}>
                <View style={styles.deletionHeader}>
                  <Text style={styles.deletionIcon}>🗑️</Text>
                  <Text style={styles.deletionTitle}>پیام حذف شده</Text>
                </View>
                <Text style={styles.deletionFrom}>
                  از: {notification.contactName || notification.from}
                  {notification.contactName && (
                    <Text style={styles.phoneNumber}> ({notification.from})</Text>
                  )}
                </Text>
                <Text style={styles.deletionPreview}>{notification.messagePreview}</Text>
                <Text style={styles.deletionTime}>زمان حذف: {formatDateTime(notification.deletedAt)}</Text>
              </View>
            ))
          )}
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

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, !showDeletions && styles.activeTab]} 
          onPress={() => setShowDeletions(false)}
        >
          <Text style={[styles.tabText, !showDeletions && styles.activeTabText]}>
            پیام‌ها ({messages.filter(m => !m.isDeleted).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, showDeletions && styles.activeTab]} 
          onPress={() => setShowDeletions(true)}
        >
          <Text style={[styles.tabText, showDeletions && styles.activeTabText]}>
            حذف شده ({deletionNotifications.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.filter(m => !m.isDeleted).length === 0 ? (
          <Text style={styles.noMessagesText}>هیچ پیامی موجود نیست</Text>
        ) : (
          messages
            .filter(message => !message.isDeleted)
            .map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageItem,
                  message.type === 'outgoing' ? styles.outgoingMessage : styles.incomingMessage
                ]}
              >
                <Text style={styles.messageFrom}>
                  {message.type === 'outgoing' ? (
                    <>
                      به: {message.contactName || message.to}
                      {message.contactName && (
                        <Text style={styles.phoneNumber}> ({message.to})</Text>
                      )}
                    </>
                  ) : (
                    <>
                      از: {message.contactName || message.from}
                      {message.contactName && (
                        <Text style={styles.phoneNumber}> ({message.from})</Text>
                      )}
                    </>
                  )}
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
          placeholder="پیام برای ارسال به گوشی هدف..."
          multiline
          maxLength={160}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>ارسال</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.testButtonsContainer}>
        <TouchableOpacity style={styles.testButton} onPress={simulateIncomingMessage}>
          <Text style={styles.testButtonText}>شبیه‌سازی پیام دریافتی</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteTestButton} onPress={simulateMessageDeletion}>
          <Text style={styles.testButtonText}>شبیه‌سازی حذف پیام</Text>
        </TouchableOpacity>
      </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: colors.grey,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.backgroundAlt,
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
  phoneNumber: {
    fontSize: 10,
    fontWeight: 'normal',
    opacity: 0.7,
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
  deletionNotification: {
    backgroundColor: colors.error,
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  deletionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deletionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  deletionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.backgroundAlt,
  },
  deletionFrom: {
    fontSize: 12,
    color: colors.backgroundAlt,
    marginBottom: 4,
    opacity: 0.9,
  },
  deletionPreview: {
    fontSize: 14,
    color: colors.backgroundAlt,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  deletionTime: {
    fontSize: 10,
    color: colors.backgroundAlt,
    opacity: 0.8,
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
  testButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  testButton: {
    backgroundColor: colors.secondary,
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteTestButton: {
    backgroundColor: colors.error,
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: colors.backgroundAlt,
    fontWeight: '600',
    fontSize: 12,
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
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
    backgroundColor: colors.grey,
    padding: 12,
    borderRadius: 8,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: colors.grey,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.backgroundAlt,
  },
  permissionButton: {
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  permissionButtonText: {
    color: colors.backgroundAlt,
    fontSize: 14,
    fontWeight: '600',
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
