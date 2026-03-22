import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import axiosBase from './src/utils/axiosBase'; // Adjusted path
import { useAuth } from './src/context/AuthContext'; // Adjusted path
import { useSocket } from './src/context/SocketContext'; // Adjusted path

const MessageSeenContext = createContext();

export const useMessageSeen = () => useContext(MessageSeenContext);

export const MessageSeenProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useSocket();

    // State for conversations
    const [conversations, setConversations] = useState([]);
    
    // Map of { [chatId]: lastSeenMessageObject }
    const [lastSeenMessagesMap, setLastSeenMessagesMap] = useState({});
    
    // Map of { [chatId]: unreadCount }
    const [unreadCountsMap, setUnreadCountsMap] = useState({});
    
    // Total unread count for the main sidebar badge
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);

    const [failedToFetch, setFailedToFetch] = useState(false);

    // 1. Fetch conversations for the logged-in user
    useEffect(() => {
        const fetchConversations = async () => {
            if (!user?._id) return;
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

        socket.on('unreadCountUpdated', handleUnreadCountUpdated);
        socket.on('globalUnreadCountUpdated', handleGlobalUnreadCountUpdated);
        socket.on('userSeenMessage', handleUserSeenMessage);

        return () => {
            socket.off('unreadCountUpdated', handleUnreadCountUpdated);
            socket.off('globalUnreadCountUpdated', handleGlobalUnreadCountUpdated);
            socket.off('userSeenMessage', handleUserSeenMessage);
        };

    }, [socket, user?._id]);


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

    // 6. Memoize the context value to prevent unnecessary re-renders of consumers
    const value = useMemo(() => ({
        lastSeenMessagesMap,
        setLastSeenMessageForChat,
        unreadCountsMap,
        totalUnreadCount,
        failedToFetch,
        conversations, // expose conversations to consumers
    }), [
        lastSeenMessagesMap, 
        setLastSeenMessageForChat, 
        unreadCountsMap, 
        totalUnreadCount,
        conversations,
        failedToFetch,
    ]);

    return (
        <MessageSeenContext.Provider value={value}>
            {children}
        </MessageSeenContext.Provider>
    );
};