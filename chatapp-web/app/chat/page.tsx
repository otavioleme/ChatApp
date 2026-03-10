"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import { Room, DirectConversation, Message } from "@/types";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  const { user, token, isAuthenticated } = useAuth();
  const router = useRouter();
  const chat = useChat(token);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeConversation, setActiveConversation] = useState<DirectConversation | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [unreadRooms, setUnreadRooms] = useState<Set<number>>(new Set());
  const [unreadConversations, setUnreadConversations] = useState<Set<number>>(new Set());
  

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
      fetchConversations();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (chat.conversationUpdated > 0) {
      fetchConversations();
    }
  }, [chat.conversationUpdated]);

  useEffect(() => {
  if (chat.deletedMessageId) {
    setCurrentMessages((prev) => prev.filter((m) => m.id !== chat.deletedMessageId));
    chat.setDeletedMessageId(null);
  }
}, [chat.deletedMessageId]);

useEffect(() => {
  if (chat.newRoom) {
    setRooms((prev) => {
      if (prev.find((r) => r.id === chat.newRoom!.id)) return prev;
      return [...prev, chat.newRoom!];
    });
    chat.setNewRoom(null);
  }
}, [chat.newRoom]);

useEffect(() => {
  if (chat.deletedRoomId) {
    setRooms((prev) => prev.filter((r) => r.id !== chat.deletedRoomId));
    if (activeRoom?.id === chat.deletedRoomId) {
      setActiveRoom(null);
      setCurrentMessages([]);
    }
    chat.setDeletedRoomId(null);
  }
}, [chat.deletedRoomId]);

  useEffect(() => {
    const newMessages = chat.messages.filter((m) => {
      if (activeRoom) return m.roomId === activeRoom.id;
      if (activeConversation) return m.directConversationId === activeConversation.id;
      return false;
    });

    if (newMessages.length > 0) {
      setCurrentMessages((prev) => [...prev, ...newMessages]);
      chat.setMessages([]);
    }

    // marcar como não lida se não estiver na conversa ativa
    chat.messages.forEach((m) => {
      if (m.roomId && m.roomId !== activeRoom?.id) {
        setUnreadRooms((prev) => new Set(prev).add(m.roomId!));
      }
      if (m.directConversationId && m.directConversationId !== activeConversation?.id) {
        setUnreadConversations((prev) => new Set(prev).add(m.directConversationId!));
      }
    });
  }, [chat.messages, activeRoom, activeConversation]);

  const fetchRooms = async () => {
    const { data } = await api.get("/api/rooms");
    setRooms(data);
  };

const fetchConversations = async () => {
  const { data } = await api.get("/api/conversations");
  setConversations(data);
  // entrar automaticamente em todos os grupos de DM
  data.forEach((c: DirectConversation) => {
    chat.joinDirectConversation(c.id);
  });
};

  const handleSelectRoom = async (room: Room) => {
    if (activeRoom) await chat.leaveRoom(activeRoom.id);
    setActiveRoom(room);
    setActiveConversation(null);
    setUnreadRooms((prev) => { const s = new Set(prev); s.delete(room.id); return s; });
    await chat.joinRoom(room.id);
    const { data } = await api.get(`/api/messages/room/${room.id}`);
    setCurrentMessages(data);
  };

  const handleSelectConversation = async (conversation: DirectConversation) => {
    setActiveConversation(conversation);
    setActiveRoom(null);
    setUnreadConversations((prev) => { const s = new Set(prev); s.delete(conversation.id); return s; });
    await chat.joinDirectConversation(conversation.id);
    const { data } = await api.get(`/api/messages/conversation/${conversation.id}`);
    setCurrentMessages(data);
  };

  const handleSendMessage = async (content: string) => {
    if (activeRoom) {
      await chat.sendRoomMessage(activeRoom.id, content);
    } else if (activeConversation) {
      await chat.sendDirectMessage(activeConversation.id, content);
    }
  };

const handleCreateRoom = async (name: string) => {
  const { data } = await api.post("/api/rooms", { name });
  setRooms((prev) => [...prev, data]);
  chat.notifyRoomCreated(data);
};

const handleDeleteRoom = async (roomId: number) => {
  await api.delete(`/api/rooms/${roomId}`);
  setRooms((prev) => prev.filter((r) => r.id !== roomId));
  if (activeRoom?.id === roomId) {
    setActiveRoom(null);
    setCurrentMessages([]);
  }
  chat.notifyRoomDeleted(roomId);
};

  const handleStartConversation = async (userId: number) => {
    const { data } = await api.post(`/api/conversations/${userId}`);
    setConversations((prev) => {
      if (prev.find((c) => c.id === data.id)) return prev;
      return [...prev, data];
    });
    handleSelectConversation(data);
  };

const handleDeleteMessage = async (messageId: number) => {
  await api.delete(`/api/messages/${messageId}`);
  setCurrentMessages((prev) => prev.filter((m) => m.id !== messageId));
  chat.notifyMessageDeleted(
    messageId,
    activeRoom?.id ?? null,
    activeConversation?.id ?? null
  );
};

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar
        user={user!}
        rooms={rooms}
        conversations={conversations}
        activeRoom={activeRoom}
        activeConversation={activeConversation}
        onlineUsers={chat.onlineUsers}
        unreadRooms={unreadRooms}
        unreadConversations={unreadConversations}
        onSelectRoom={handleSelectRoom}
        onSelectConversation={handleSelectConversation}
        onCreateRoom={handleCreateRoom}
        onStartConversation={handleStartConversation}
        onRefreshConversations={fetchConversations}
        onDeleteRoom={handleDeleteRoom}
      />
<ChatWindow
  user={user!}
  activeRoom={activeRoom}
  activeConversation={activeConversation}
  messages={currentMessages}
  onDeleteMessage={handleDeleteMessage}
  onSendMessage={handleSendMessage}
  onImageSent={(message) => {
    setCurrentMessages((prev) => [...prev, message]);
    chat.notifyImageSent(message);
  }}
  onTyping={() => {
    if (activeRoom) chat.typingInRoom(activeRoom.id);
    else if (activeConversation) chat.typingInDirect(activeConversation.id);
  }}
/>
    </div>
  );
}