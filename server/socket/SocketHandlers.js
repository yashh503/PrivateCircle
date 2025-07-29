import Message from "../models/Message.js";
import Room from "../models/Room.js";
import { checkSocketRoomAccess } from "../middleware/roomAuth.js";

export const handleConnection = (io, socket) => {
  console.log(`User ${socket.user.username} connected`);

  // Join user to their rooms
  socket.on("join-rooms", async () => {
    try {
      const userRooms = await Room.find({
        "members.user": socket.user._id,
        isActive: true,
      });

      userRooms.forEach((room) => {
        socket.join(room._id.toString());
      });

      socket.emit("rooms-joined", userRooms.length);
    } catch (error) {
      console.error("Join rooms error:", error);
    }
  });

  // Join specific room
  socket.on("join-room", async (roomId) => {
    try {
      const hasAccess = await checkSocketRoomAccess(socket, roomId);
      if (!hasAccess) {
        socket.emit("error", { message: "Access denied to room" });
        return;
      }

      socket.join(roomId);

      // Send recent messages
      const messages = await Message.find({
        room: roomId,
        deletedAt: null,
      })
        .populate("sender", "username")
        .sort({ createdAt: -1 })
        .limit(50);
      // Reverse to send oldest first
      await messages.reverse();
      const allmessages = messages.map((msg) => ({
        id: msg._id,
        content: msg.content,
        senderId: msg.sender._id,
        senderName: msg.sender.username,
        timestamp: msg.createdAt.toISOString(), // always iso string!
        messageType: msg.messageType,
        encrypted: msg.encrypted,
        senderId: msg.sender._id,
      }));
      // Emit message history
      socket.emit("message-history", allmessages);

      // Notify other room members
      socket.to(roomId).emit("user-joined", {
        userId: socket.user._id,
        username: socket.user.username,
      });
    } catch (error) {
      console.error("Join room error:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // Leave room
  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", {
      userId: socket.user._id,
      username: socket.user.username,
    });
  });

  // Send message
  socket.on("send-message", async (data) => {
    try {
      const { content, roomId, messageType = "text" } = data;

      if (!content || !roomId) {
        socket.emit("error", { message: "Content and room ID are required" });
        return;
      }

      const hasAccess = await checkSocketRoomAccess(socket, roomId);
      if (!hasAccess) {
        socket.emit("error", { message: "Access denied to room" });
        return;
      }

      // Create message
      const message = new Message({
        content,
        sender: socket.user._id,
        room: roomId,
        messageType,
        encrypted: true,
      });

      await message.save();
      await message.populate("sender", "username");

      // Update room last activity
      await Room.findByIdAndUpdate(roomId, {
        lastActivity: new Date(),
      });

      // Send to all room members
      io.to(roomId).emit("new-message", {
        id: message._id,
        content: message.content,
        senderId: message.sender._id,
        senderName: message.sender.username,
        timestamp: message.createdAt.toISOString(), // always iso string!
        messageType: message.messageType,
        encrypted: message.encrypted,
      });
    } catch (error) {
      console.error("Send message error:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Typing indicators
  socket.on("typing-start", (roomId) => {
    socket.to(roomId).emit("user-typing", {
      userId: socket.user._id,
      username: socket.user.username,
    });
  });

  socket.on("typing-stop", (roomId) => {
    socket.to(roomId).emit("user-stopped-typing", {
      userId: socket.user._id,
      username: socket.user.username,
    });
  });

  // Call events
  socket.on("initiate-call", async (data) => {
    try {
      const { roomId, type } = data; // type: 'audio' or 'video'

      const hasAccess = await checkSocketRoomAccess(socket, roomId);
      if (!hasAccess) {
        socket.emit("error", { message: "Access denied to room" });
        return;
      }

      // Notify other room members about incoming call
      socket.to(roomId).emit("incoming-call", {
        callerId: socket.user._id,
        callerName: socket.user.username,
        roomId,
        type,
        timestamp: new Date(),
      });

      // Create call message
      const callMessage = new Message({
        content: `${type === "video" ? "Video" : "Audio"} call started`,
        sender: socket.user._id,
        room: roomId,
        messageType: "call",
        encrypted: false,
      });

      await callMessage.save();
    } catch (error) {
      console.error("Initiate call error:", error);
      socket.emit("error", { message: "Failed to initiate call" });
    }
  });

  socket.on("accept-call", (data) => {
    const { roomId, callerId } = data;
    socket.to(roomId).emit("call-accepted", {
      accepterId: socket.user._id,
      accepterName: socket.user.username,
    });
  });

  socket.on("reject-call", (data) => {
    const { roomId, callerId } = data;
    socket.to(roomId).emit("call-rejected", {
      rejecterId: socket.user._id,
      rejecterName: socket.user.username,
    });
  });

  socket.on("end-call", (data) => {
    const { roomId } = data;
    socket.to(roomId).emit("call-ended", {
      enderId: socket.user._id,
      enderName: socket.user.username,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User ${socket.user.username} disconnected`);
  });
};
