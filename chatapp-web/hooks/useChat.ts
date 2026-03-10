"use client";

import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Message, Room } from "@/types";

export function useChat(token: string | null) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationUpdated, setConversationUpdated] = useState(0);
  const [deletedMessageId, setDeletedMessageId] = useState<number | null>(null);
  const [newRoom, setNewRoom] = useState<Room | null>(null);
  const [deletedRoomId, setDeletedRoomId] = useState<number | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL}/hubs/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    newConnection.on("OnlineUsers", (users: Record<string, string>) => {
      if (isMounted) setOnlineUsers(users);
    });

    newConnection.on("UserOnline", (userId: string, username: string) => {
      if (isMounted) setOnlineUsers((prev) => ({ ...prev, [userId]: username }));
    });

    newConnection.on("UserOffline", (userId: string) => {
      if (isMounted) setOnlineUsers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    newConnection.on("ReceiveRoomMessage", (message: Message) => {
      if (isMounted) setMessages((prev) => [...prev, message]);
    });

    newConnection.on("ReceiveDirectMessage", (message: Message) => {
      if (isMounted) setMessages((prev) => [...prev, message]);
    });

    newConnection.on("ConversationUpdated", () => {
      if (isMounted) setConversationUpdated((prev) => prev + 1);
    });

    newConnection.on("MessageDeleted", (messageId: number) => {
      if (isMounted) setDeletedMessageId(messageId);
    });

    newConnection.on("RoomCreated", (room: Room) => {
      if (isMounted) setNewRoom(room);
    });

    newConnection.on("RoomDeleted", (roomId: number) => {
      if (isMounted) setDeletedRoomId(roomId);
    });

    newConnection.start()
      .then(() => { if (isMounted) setConnected(true); })
      .catch(() => {});

    connectionRef.current = newConnection;
    setConnection(newConnection);

    return () => {
      isMounted = false;
      newConnection.stop();
    };
  }, [token]);

  const joinRoom = (roomId: number) => connection?.invoke("JoinRoom", roomId);
  const leaveRoom = (roomId: number) => connection?.invoke("LeaveRoom", roomId);
  const sendRoomMessage = (roomId: number, content: string) => connection?.invoke("SendRoomMessage", roomId, content);
  const joinDirectConversation = (conversationId: number) => connection?.invoke("JoinDirectConversation", conversationId);
  const sendDirectMessage = (conversationId: number, content: string) => connection?.invoke("SendDirectMessage", conversationId, content);
  const typingInRoom = (roomId: number) => connection?.invoke("TypingInRoom", roomId);
  const typingInDirect = (conversationId: number) => connection?.invoke("TypingInDirect", conversationId);
  const notifyImageSent = (message: Message) => connection?.invoke("NotifyImageSent", message);
  const notifyMessageDeleted = (messageId: number, roomId: number | null, directConversationId: number | null) =>
    connection?.invoke("NotifyMessageDeleted", messageId, roomId, directConversationId);
  const notifyRoomCreated = (room: Room) => connection?.invoke("NotifyRoomCreated", room);
  const notifyRoomDeleted = (roomId: number) => connection?.invoke("NotifyRoomDeleted", roomId);

  return {
    connected,
    onlineUsers,
    messages,
    setMessages,
    conversationUpdated,
    deletedMessageId,
    setDeletedMessageId,
    newRoom,
    setNewRoom,
    deletedRoomId,
    setDeletedRoomId,
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    joinDirectConversation,
    sendDirectMessage,
    typingInRoom,
    typingInDirect,
    notifyImageSent,
    notifyMessageDeleted,
    notifyRoomCreated,
    notifyRoomDeleted,
  };
}