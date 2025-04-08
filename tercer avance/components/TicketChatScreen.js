import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  query,
  getDoc,
} from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";

const TicketChatScreen = ({ route, navigation }) => {
  const { ticket: initialTicket } = route.params;
  const [ticket, setTicket] = useState(initialTicket);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isChatClosed, setIsChatClosed] = useState(
    initialTicket.status?.trim().toLowerCase() === "resolved",
  );
  const [isModalVisible, setIsModalVisible] = useState(
    initialTicket.status?.trim().toLowerCase() === "resolved",
  );
  const db = getFirestore();
  const { userType, userEmail } = useContext(AuthContext);
  const isTechnician = userType === 1;
  const flatListRef = React.useRef();

  // Escuchar cambios en el ticket
  useEffect(() => {
    const ticketRef = doc(db, "Ticket", initialTicket.id);
    const unsubscribeTicket = onSnapshot(ticketRef, (doc) => {
      if (doc.exists()) {
        const updatedTicket = { id: doc.id, ...doc.data() };
        setTicket(updatedTicket);
        const isClosed =
          updatedTicket.status?.trim().toLowerCase() === "resolved";
        setIsChatClosed(isClosed);
        // Mostrar modal solo si acaba de cambiar a Resolved
        if (isClosed && !isChatClosed) {
          setIsModalVisible(true);
        }
      }
    });

    return () => unsubscribeTicket();
  }, [initialTicket.id]);

  useEffect(() => {
    navigation.setOptions({
      title: `Ticket #${ticket.ticketId} Chat`,
    });

    const chatRef = collection(db, "Tickets", ticket.id, "Chat");
    const q = query(chatRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = [];
      snapshot.forEach((doc) => {
        loadedMessages.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setMessages(loadedMessages);

      // Desplazarse al final cuando llegan nuevos mensajes
      if (loadedMessages.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    // Configurar listeners del teclado
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      unsubscribe();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [ticket.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      console.log("Message is empty");
      return;
    }
    if (isChatClosed) {
      console.log("Chat is closed - cannot send messages");
      return;
    }

    try {
      const chatRef = collection(db, "Tickets", ticket.id, "Chat");
      const newMessageRef = doc(chatRef);

      await setDoc(newMessageRef, {
        text: newMessage,
        sender: userEmail,
        timestamp: serverTimestamp(),
        senderName: isTechnician ? ticket.technicalName : ticket.employeeName,
      });

      setNewMessage("");

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isCurrentUser = item.sender === userEmail;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        <Text style={styles.messageSender}>{item.senderName}</Text>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.messageTime}>
          {item.timestamp?.toDate
            ? item.timestamp.toDate().toLocaleTimeString()
            : "Sending..."}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Este chat ha finalizado</Text>
            <Text style={styles.modalSubtext}>
              El ticket ha sido marcado como resuelto.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={styles.contentContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={true}
            style={styles.chatList}
          />
          {isChatClosed && (
            <Text style={styles.closedChatText}>
              Este chat está cerrado porque el ticket fue marcado como resuelto
            </Text>
          )}
          {/* Área de entrada de mensajes */}
          <View
            style={[
              styles.messageInputWrapper,
              isChatClosed && styles.closedInputWrapper,
            ]}
          >
            <View style={styles.messageInputContainer}>
              <TextInput
                style={[
                  styles.messageInput,
                  isChatClosed && styles.disabledInput,
                ]}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder={
                  isChatClosed
                    ? "Chat finalizado - No se pueden enviar mensajes"
                    : "Escribe tu mensaje..."
                }
                placeholderTextColor={isChatClosed ? "#95A5A6" : "#95A5A6"}
                multiline
                editable={!isChatClosed}
                pointerEvents={isChatClosed ? "none" : "auto"}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={isChatClosed}
              >
                <Icon
                  name="send"
                  size={20}
                  color={isChatClosed ? "#95A5A6" : "#1E3A8A"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  closedInputWrapper: {
    backgroundColor: "#F1F5F9",
    paddingTop: 8,
  },
  disabledInput: {
    backgroundColor: "#F1F5F9",
    color: "#95A5A6",
  },
  closedChatText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 6, // Reducido porque el margen ya está en el chatList
  },
  messageContainer: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  currentUserMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#EFF6FF",
    borderTopRightRadius: 0,
  },
  otherUserMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderTopLeftRadius: 0,
  },
  messageSender: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#1E3A8A",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#1E293B",
  },
  messageTime: {
    fontSize: 10,
    color: "#64748B",
    textAlign: "right",
    marginTop: 4,
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 90,
    backgroundColor: "#fff",
  },
  sendButton: {
    marginLeft: 8,
    padding: 8,
  },
  chatList: {
    flex: 1,
    marginBottom: 10, // Espacio para el input
  },
  messageInputWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 1,
    backgroundColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
    color: "#1E3A8A",
    fontWeight: "bold",
  },
  modalSubtext: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    color: "#64748B",
  },
  modalButton: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  closedChatNotice: {
    padding: 16,
    backgroundColor: "#F1F5F9",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    alignItems: "center",
  },
  closedChatText: {
    color: "#64748B",
    fontWeight: "bold",
  },
});

export default TicketChatScreen;
