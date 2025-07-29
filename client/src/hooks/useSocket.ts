import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  encrypted: boolean;
  messageType?: string;
}

interface TypingUser {
  userId: string;
  username: string;
}

interface CallData {
  callerId: string;
  callerName: string;
  roomId: string;
  type: "audio" | "video";
  timestamp: Date;
}

export const useSocket = (roomId: string | null, userId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);

  useEffect(() => {
    if (!roomId || !userId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Initialize socket connection with auth
    socketRef.current = io("http://localhost:3001", {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      setConnected(true);
      console.log("✅ Connected to server");

      // Join all user rooms first
      socket.emit("join-rooms");

      // Then join specific room
      socket.emit("join-room", roomId);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("❌ Disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      setConnected(false);
    });

    socket.on("new-message", (message: Message) => {
      setMessages((prev) => {
        // Skip if already shown optimistically
        if (prev.some((m) => m.id === message.id)) return prev;
        return [
          ...prev.filter(
            (m) =>
              m.content !== message.content || m.senderId !== message.senderId
          ), // Remove optimistic
          {
            ...message,
            timestamp: new Date(message.timestamp),
          },
        ];
      });
    });

    socket.on("message-history", (history: Message[]) => {
      console.log(history, "  History received");
      const formattedHistory = history.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(formattedHistory);
    });

    // Typing indicators
    socket.on("user-typing", (user: TypingUser) => {
      if (user.userId === userId) return; // Ignore if it's yourself

      setTypingUsers((prev) => {
        const exists = prev.find((u) => u.userId === user.userId);
        if (!exists) {
          return [...prev, user];
        }
        return prev;
      });
    });

    socket.on("user-stopped-typing", (user: TypingUser) => {
      if (user.userId === userId) return; // Ignore if it's yourself

      setTypingUsers((prev) => prev.filter((u) => u.userId !== user.userId));
    });

    // Call events
    socket.on("incoming-call", (callData: CallData) => {
      setIncomingCall({
        ...callData,
        timestamp: new Date(callData.timestamp),
      });
    });

    socket.on("call-accepted", () => {
      setIncomingCall(null);
    });

    socket.on("call-rejected", () => {
      setIncomingCall(null);
    });

    socket.on("call-ended", () => {
      setIncomingCall(null);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    return () => {
      if (socket.connected) {
        socket.emit("leave-room", roomId);
        socket.disconnect();
      }
    };
  }, [roomId, userId]);

  const sendMessage = useCallback(
    (content: string, messageType: string = "text") => {
      if (socketRef.current && connected && roomId && userId) {
        // Create an optimistic message with tempId
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
          id: tempId,
          content,
          senderId: userId, // current user
          senderName: "You", // or your username
          timestamp: new Date(),
          encrypted: false, // you know!
          messageType,
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        // Now send to server (without id)
        socketRef.current.emit("send-message", {
          content,
          roomId,
          messageType,
        });
      }
    },
    [connected, roomId, userId]
  );

  const startTyping = useCallback(() => {
    if (socketRef.current && connected && roomId) {
      socketRef.current.emit("typing-start", roomId);
    }
  }, [connected, roomId]);

  const stopTyping = useCallback(() => {
    if (socketRef.current && connected && roomId) {
      socketRef.current.emit("typing-stop", roomId);
    }
  }, [connected, roomId]);

  const initiateCall = useCallback(
    (type: "audio" | "video") => {
      if (socketRef.current && connected) {
        socketRef.current.emit("initiate-call", { roomId, type });
      }
    },
    [connected, roomId]
  );

  const acceptCall = useCallback(() => {
    if (socketRef.current && connected && incomingCall) {
      socketRef.current.emit("accept-call", {
        roomId: incomingCall.roomId,
        callerId: incomingCall.callerId,
      });
      setIncomingCall(null);
    }
  }, [connected, incomingCall]);

  const rejectCall = useCallback(() => {
    if (socketRef.current && connected && incomingCall) {
      socketRef.current.emit("reject-call", {
        roomId: incomingCall.roomId,
        callerId: incomingCall.callerId,
      });
      setIncomingCall(null);
    }
  }, [connected, incomingCall]);

  const endCall = useCallback(() => {
    if (socketRef.current && connected) {
      socketRef.current.emit("end-call", { roomId });
    }
  }, [connected, roomId]);

  return {
    messages,
    connected,
    typingUsers,
    incomingCall,
    sendMessage,
    startTyping,
    stopTyping,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
  };
};
