import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import axiosBase from './src/utils/axiosBase'; // Adjusted path
import { useAuth } from './src/context/AuthContext'; // Adjusted path
import { useSocket } from './src/context/SocketContext'; // Adjusted path

const MessageSeenContext = createContext({
    lastSeenMessagesMap: {},
    setLastSeenMessageForChat: () => {},
    updateConversationLastMessage: () => {},
    unreadCountsMap: {},
    totalUnreadCount: 0,
    failedToFetch: false,
    conversations: [],
    loading: true,
    setLoading: () => {},
});

export const useMessageSeen = () => useContext(MessageSeenContext);

export const MessageSeenProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useSocket();

    // State for conversations
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastSeenMessagesMap, setLastSeenMessagesMap] = useState({});
    const [unreadCountsMap, setUnreadCountsMap] = useState({});
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [failedToFetch, setFailedToFetch] = useState(false);
    
    // Track active chat to handle unread increments correctly
    const [activeChatId, setActiveChatId] = useState(null);

    // 1. Fetch conversations for the logged-in user
    useEffect(() => {
        const fetchConversations = async () => {
            if (!user?._id) return;
            setLoading(true);
            try {
                const { data } = await axiosBase.get('/api/chat/user/conversations');
                if (data.success) {
                    setConversations(data.conversations || []);
                    setFailedToFetch(false)
                }
            } catch (error) {
                setFailedToFetch(true)
                console.error("Failed to fetch conversations:", error);
                
            }
            finally {
                setLoading(false);
            }   
        };

        fetchConversations();
    }, [user?._id]);

    useEffect(()=>{
      console.log("this is what failed to fetch is:", failedToFetch)
    },[failedToFetch])

    // 2. Initial fetch for all last seen messages for the logged-in user
    useEffect(() => {
        const fetchAllLastSeen = async () => {
            if (!user?._id) return;
            try {
                const { data } = await axiosBase.get('/api/chat/user/all-last-seen');
                if (data.success) {
                    setLastSeenMessagesMap(data.lastSeenMap || {});
                }
            } catch (error) {
                console.error("Failed to fetch all last seen messages:", error);
            }
        };

        fetchAllLastSeen();
    }, [user?._id]);

    // 3. Recalculate unread counts whenever conversations or seen messages change
    useEffect(() => {
        if (!conversations || conversations.length === 0 || !user?._id) {
            setUnreadCountsMap({});
            setTotalUnreadCount(0);
            return;
        }

        const newUnreadCounts = {};
        let newTotalUnread = 0;

        conversations.forEach(chat => {
            const lastSeenMessage = lastSeenMessagesMap[chat._id];
            
            // The logic to count messages needs the actual messages, which are not in the conversation object.
            // Let's rely on the unreadCount from the conversation object fetched from the server.
            newUnreadCounts[chat._id] = chat.unreadCount || 0;
            newTotalUnread += chat.unreadCount || 0;
        });

        setUnreadCountsMap(newUnreadCounts);
        setTotalUnreadCount(newTotalUnread);

    }, [conversations, lastSeenMessagesMap, user?._id]);

    // 4. Socket listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleUnreadCountUpdated = ({ chatId, unreadCount }) => {
            setUnreadCountsMap(prevMap => ({
                ...prevMap,
                [chatId]: unreadCount,
            }));
        };

        const handleGlobalUnreadCountUpdated = ({ globalUnreadCount }) => {
            setTotalUnreadCount(globalUnreadCount);
        };

        const handleUserSeenMessage = ({ chatId, userId, messageIds, seenAt }) => {
            // We need to get the message object to update the lastSeenMessagesMap
            // For now, let's refetch the last seen messages for simplicity.
            // A better implementation would be to get the message from the event or another way.
            if (userId === user?._id) {
                 const fetchAllLastSeen = async () => {
                    if (!user?._id) return;
                    try {
                        const { data } = await axiosBase.get('/api/chat/user/all-last-seen');
                        if (data.success) {
                            setLastSeenMessagesMap(data.lastSeenMap || {});
                        }
                    } catch (error) {
                        console.error("Failed to fetch all last seen messages:", error);
                    }
                };
                fetchAllLastSeen();
            }
        };

        /**
         * CRITICAL: When a new message is received, update the conversation's lastMessage
         * AND increment unread count if the message is NOT from the current active chat
         * This ensures the sidebar updates live with unread badges
         */
        const handleReceiveMessage = ({ chatId, message }) => {
            setConversations(prevConversations => 
                prevConversations.map(convo => 
                    convo._id === chatId 
                        ? { ...convo, lastMessage: message }
                        : convo
                )
            );
            
            // If this message is NOT in the active chat, increment unread count
            // This makes the sidebar update live with red badges
            if (chatId !== activeChatId) {
                setUnreadCountsMap(prevMap => ({
                    ...prevMap,
                    [chatId]: (prevMap[chatId] || 0) + 1,
                }));
                
                // Also update total unread count
                setTotalUnreadCount(prevCount => prevCount + 1);
            }
        };

        socket.on('unreadCountUpdated', handleUnreadCountUpdated);
        socket.on('globalUnreadCountUpdated', handleGlobalUnreadCountUpdated);
        socket.on('userSeenMessage', handleUserSeenMessage);
        socket.on('receiveMessage', handleReceiveMessage);

        return () => {
            socket.off('unreadCountUpdated', handleUnreadCountUpdated);
            socket.off('globalUnreadCountUpdated', handleGlobalUnreadCountUpdated);
            socket.off('userSeenMessage', handleUserSeenMessage);
            socket.off('receiveMessage', handleReceiveMessage);
        };

    }, [socket, user?._id, activeChatId]);


    // 5. Function for useSeenManager to call to update the global state
    const setLastSeenMessageForChat = useCallback((chatId, message) => {
        setLastSeenMessagesMap(prevMap => {
            const currentSeen = prevMap[chatId];
            // Only update if the new message is actually newer to prevent race conditions
            if (currentSeen && new Date(message.createdAt) <= new Date(currentSeen.createdAt)) {
                return prevMap;
            }
            // Also emit socket event to backend
            if (socket) {
                socket.emit('updateLastSeen', { chatId, messageId: message._id });
            }

            return {
                ...prevMap,
                [chatId]: message,
            };
        });
    }, [socket]);

    /**
     * Update a conversation's lastMessage immediately
     * Used by ChatBox when sending a message to trigger instant re-sort
     */
    const updateConversationLastMessage = useCallback((chatId, message) => {
        setConversations(prevConversations => 
            prevConversations.map(convo => 
                convo._id === chatId 
                    ? { ...convo, lastMessage: message }
                    : convo
            )
        );
    }, []);

    // 6. Memoize the context value to prevent unnecessary re-renders of consumers
    const value = useMemo(() => ({
        lastSeenMessagesMap,
        setLastSeenMessageForChat,
        updateConversationLastMessage,
        unreadCountsMap,
        totalUnreadCount,
        failedToFetch,
        conversations, 
        loading,
        setLoading,
        activeChatId,
        setActiveChatId,
    }), [
        lastSeenMessagesMap, 
        setLastSeenMessageForChat,
        updateConversationLastMessage,
        unreadCountsMap, 
        totalUnreadCount,
        conversations,
        failedToFetch,
        activeChatId,
    ]);

    return (
        <MessageSeenContext.Provider value={value}>
            {children}
        </MessageSeenContext.Provider>
    );
};