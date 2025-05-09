//Component for message notification indicators
import React, { useState, useEffect } from 'react';
import { messageService } from '../messageService';
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import '../styles/NavbarMessageIndicator.css';

const NavbarMessageIndicator = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchUnreadCount = async () => {
      try {
        const count = await messageService.getTotalUnreadCount(userId);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Set up a periodic refresh every 60 seconds
    const intervalId = setInterval(fetchUnreadCount, 60000);

    // Subscribe to changes
    const unsubscribe = messageService.subscribeToUserConversations(userId, async () => {
      const count = await messageService.getTotalUnreadCount(userId);
      setUnreadCount(count);
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [userId]);

  return (
    <div className="message-icon">
      <ChatBubbleLeftIcon className="icon" />
      {unreadCount > 0 && (
        <div className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</div>
      )}
    </div>
  );
};

export default NavbarMessageIndicator;