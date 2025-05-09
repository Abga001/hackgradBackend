import { db } from "./firebaseConfig";
import { 
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  deleteDoc  // Add this import
} from "firebase/firestore";

export const messageService = {
  // Create a new conversation between two users
  createConversation: async (currentUserId, otherUserId) => {
    try {
      console.log(`Attempting to create conversation between ${currentUserId} and ${otherUserId}`);
      
      // Check if users exist
      if (!currentUserId || !otherUserId) {
        throw new Error("Invalid user IDs provided");
      }
      
      // Sort participants IDs to ensure consistent ordering
      const sortedParticipants = [currentUserId, otherUserId].sort();
      
      // Check if a conversation already exists with either order of participants
      const q1 = query(
        collection(db, "conversations"),
        where("participants", "==", sortedParticipants)
      );
      
      const querySnapshot = await getDocs(q1);
      
      if (!querySnapshot.empty) {
        console.log("Existing conversation found");
        const existingConvo = querySnapshot.docs[0];
        return { id: existingConvo.id, ...existingConvo.data() };
      }
      
      // Create a new conversation with sorted participants
      console.log("Creating new conversation");
      const convoRef = await addDoc(collection(db, "conversations"), {
        participants: sortedParticipants,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: "Start a conversation",
          senderId: "system",
          timestamp: serverTimestamp(),
        }
      });
      
      console.log("Conversation created successfully:", convoRef.id);
      
      // Create userConversation entries for both users
      try {
        console.log("Creating user conversation entry for current user");
        await addDoc(collection(db, "userConversations"), {
          userId: currentUserId,
          conversationId: convoRef.id,
          unreadCount: 0,
          lastReadTimestamp: serverTimestamp()
        });
        
        console.log("Creating user conversation entry for other user");
        await addDoc(collection(db, "userConversations"), {
          userId: otherUserId,
          conversationId: convoRef.id,
          unreadCount: 0,
          lastReadTimestamp: serverTimestamp()
        });
        
        console.log("User conversation entries created successfully");
      } catch (userConvoError) {
        console.error("Error creating user conversation entries:", userConvoError);
        throw new Error(`Failed to create user conversation entries: ${userConvoError.message}`);
      }
  
      return { id: convoRef.id };
    } catch (error) {
      console.error("Conversation creation failed:", error);
      throw error;
    }
  },

  // Get a conversation by its ID
  getConversationById: async (conversationId) => {
    try {
      console.log("Getting conversation by ID:", conversationId);
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      
      const convoRef = doc(db, "conversations", conversationId);
      const convoSnap = await getDoc(convoRef);
      
      if (convoSnap.exists()) {
        console.log("Conversation found");
        return { id: convoSnap.id, ...convoSnap.data() };
      } else {
        console.log("No conversation found with ID:", conversationId);
        return null;
      }
    } catch (error) {
      console.error("Error getting conversation by ID:", error);
      throw error;
    }
  },

  getAllConversationUnreadCounts: async (userId) => {
    try {
      const userConvoQuery = query(
        collection(db, "userConversations"),
        where("userId", "==", userId)
      );
      
      const userConvoSnap = await getDocs(userConvoQuery);
      const unreadCounts = {};
      
      userConvoSnap.forEach((doc) => {
        const data = doc.data();
        unreadCounts[data.conversationId] = data.unreadCount || 0;
      });
      
      return unreadCounts;
    } catch (error) {
      console.error("Error getting all conversation unread counts:", error);
      return {};
    }
  },

  // Cleanup duplicate convos
  cleanupDuplicateConversations: async () => {
    try {
      const conversationsRef = collection(db, "conversations");
      const querySnapshot = await getDocs(conversationsRef);
      
      const conversationMap = new Map();
      
      // Group conversations by participants
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const sortedParticipants = [...data.participants].sort().join(',');
        
        if (!conversationMap.has(sortedParticipants)) {
          conversationMap.set(sortedParticipants, []);
        }
        
        conversationMap.get(sortedParticipants).push({
          id: doc.id,
          data: data
        });
      });
      
      // Delete duplicates, keeping the oldest one
      for (const [participants, conversations] of conversationMap) {
        if (conversations.length > 1) {
          // Sort by creation date
          conversations.sort((a, b) => {
            const aTime = a.data.createdAt?.seconds || 0;
            const bTime = b.data.createdAt?.seconds || 0;
            return aTime - bTime;
          });
          
          // Keep the first one, delete the rest
          for (let i = 1; i < conversations.length; i++) {
            await deleteDoc(doc(db, "conversations", conversations[i].id));
            console.log(`Deleted duplicate conversation: ${conversations[i].id}`);
          }
        }
      }
      
      console.log("Cleanup completed");
    } catch (error) {
      console.error("Error cleaning up duplicate conversations:", error);
    }
  },

  // Get a conversation by participants
  getConversationByParticipants: async (userId1, userId2) => {
    try {
      console.log("Searching for conversation between users:", userId1, userId2);
      if (!userId1 || !userId2) {
        throw new Error("Both user IDs are required");
      }
      
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId1)
      );
      
      const querySnapshot = await getDocs(q);
      let conversation = null;
      
      console.log(`Found ${querySnapshot.size} conversations for user ${userId1}`);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(userId2)) {
          console.log("Found matching conversation:", doc.id);
          conversation = { id: doc.id, ...data };
        }
      });
      
      return conversation;
    } catch (error) {
      console.error("Error getting conversation by participants:", error);
      throw error;
    }
  },

  // Get all conversations for a user
  getUserConversations: async (userId) => {
    try {
      console.log("Getting all conversations for user:", userId);
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId),
        orderBy("updatedAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const conversations = [];
      
      console.log(`Found ${querySnapshot.size} conversations for user ${userId}`);
      
      querySnapshot.forEach((doc) => {
        conversations.push({ id: doc.id, ...doc.data() });
      });
      
      return conversations;
    } catch (error) {
      console.error("Error getting user conversations:", error);
      throw error;
    }
  },

  // Subscribe to user conversations (real-time updates)
  subscribeToUserConversations: (userId, callback) => {
    try {
      console.log("Setting up real-time listener for user conversations:", userId);
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      // Create a query that doesn't require composite index
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log(`Real-time update: ${querySnapshot.size} conversations for user ${userId}`);
        const conversations = [];
        querySnapshot.forEach((doc) => {
          conversations.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort conversations by updatedAt timestamp on the client side
        conversations.sort((a, b) => {
          const timeA = a.updatedAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || 0;
          return timeB - timeA;
        });
        
        callback(conversations);
      }, (error) => {
        console.error("Error in conversation subscription:", error);
        callback([]);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up conversation subscription:", error);
      throw error;
    }
  },

  // Send a message to a conversation
  sendMessage: async (conversationId, senderId, text, media = null) => {
    try {
      console.log(`Sending message in conversation ${conversationId} from user ${senderId}`);
      
      // Add the message to the messages collection
      const messageData = {
        conversationId,
        senderId,
        text,
        timestamp: serverTimestamp(),
        read: false
      };
      
      const messageRef = await addDoc(collection(db, "messages"), messageData);
      console.log("Message created with ID:", messageRef.id);
  
      // Get conversation reference
      const convoRef = doc(db, "conversations", conversationId);
  
      // Update the conversation's lastMessage and updatedAt
      try {
        await updateDoc(convoRef, {
          lastMessage: {
            text,
            senderId,
            timestamp: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
      } catch (updateError) {
        console.warn("Failed to update conversation metadata:", updateError);
      }
  
      // Update unreadCount for all participants except sender
      try {
        const convoSnap = await getDoc(convoRef);
        if (convoSnap.exists()) {
          const convoData = convoSnap.data();
          const otherParticipants = convoData.participants.filter(id => id !== senderId);
  
          for (const participantId of otherParticipants) {
            // Find the userConversation document for this participant
            const userConvoQuery = query(
              collection(db, "userConversations"),
              where("userId", "==", participantId),
              where("conversationId", "==", conversationId)
            );
            
            const userConvoSnap = await getDocs(userConvoQuery);
            
            if (!userConvoSnap.empty) {
              userConvoSnap.forEach(async (userConvoDoc) => {
                const currentUnreadCount = userConvoDoc.data().unreadCount || 0;
                console.log(`Updating unread count for user ${participantId} from ${currentUnreadCount} to ${currentUnreadCount + 1}`);
                
                await updateDoc(doc(db, "userConversations", userConvoDoc.id), {
                  unreadCount: currentUnreadCount + 1
                });
              });
            } else {
              console.log(`No userConversation found for user ${participantId} in conversation ${conversationId}`);
            }
          }
        }
      } catch (unreadError) {
        console.error("Failed to update unread counts:", unreadError);
      }
  
      return { id: messageRef.id };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId) => {
    try {
      console.log("Getting messages for conversation:", conversationId);
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      const messages = [];
      
      console.log(`Found ${querySnapshot.size} messages in conversation ${conversationId}`);
      
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      
      return messages;
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  },

  // Subscribe to messages for a conversation (real-time updates)
  subscribeToMessages: (conversationId, callback) => {
    try {
      console.log("Setting up real-time listener for messages in conversation:", conversationId);
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      
      // Simplified query without orderBy
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log(`Real-time update: ${querySnapshot.size} messages in conversation ${conversationId}`);
        const messages = [];
        querySnapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort messages by timestamp on the client side
        messages.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeA - timeB;
        });
        
        callback(messages);
      }, (error) => {
        console.error("Error in messages subscription:", error);
        callback([]);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up messages subscription:", error);
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId, userId) => {
  try {
    console.log(`Marking messages as read in conversation ${conversationId} for user ${userId}`);
    
    // Find the userConversation document for this user and conversation
    const userConvoQuery = query(
      collection(db, "userConversations"),
      where("userId", "==", userId),
      where("conversationId", "==", conversationId)
    );
    
    const userConvoSnap = await getDocs(userConvoQuery);
    
    if (!userConvoSnap.empty) {
      userConvoSnap.forEach(async (userConvoDoc) => {
        console.log(`Resetting unread count to 0 for document ${userConvoDoc.id}`);
        
        await updateDoc(doc(db, "userConversations", userConvoDoc.id), {
          unreadCount: 0,
          lastReadTimestamp: serverTimestamp()
        });
      });
    } else {
      console.log(`No userConversation found for user ${userId} in conversation ${conversationId}`);
    }
    
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
},

resetAllUnreadCounts: async () => {
  try {
    const userConvosQuery = collection(db, "userConversations");
    const userConvosSnapshot = await getDocs(userConvosQuery);
    
    userConvosSnapshot.forEach(async (docSnapshot) => {
      await updateDoc(doc(db, "userConversations", docSnapshot.id), {
        unreadCount: 0
      });
    });
    
    console.log("Reset all unread counts to 0");
  } catch (error) {
    console.error("Error resetting unread counts:", error);
  }
},

  // Get total unread message count for a user
  getTotalUnreadCount: async (userId) => {
    try {
      console.log("Getting total unread count for user:", userId);
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      const q = query(
        collection(db, "userConversations"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      let totalUnread = 0;
      
      console.log(`Found ${querySnapshot.size} userConversation documents for user ${userId}`);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Document ${doc.id} has unreadCount: ${data.unreadCount}`);
        totalUnread += data.unreadCount || 0;
      });
      
      console.log(`Total unread messages for user ${userId}: ${totalUnread}`);
      return totalUnread;
    } catch (error) {
      console.error("Error getting total unread count:", error);
      throw error;
    }
  }

  
};

// Fetch conversations where the user is a participant
export const fetchUserConversations = async (userId) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participants', 'array-contains', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Fetch all messages in a specific conversation
export const fetchMessages = async (conversationId) => {
  const messagesRef = collection(db, 'messages');
  const q = query(messagesRef, where('conversationId', '==', conversationId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Fetch unread messages count for a specific user across all conversations
export const fetchUnreadMessagesCount = async (userId) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('read', '==', false),
    where('participants', 'array-contains', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};