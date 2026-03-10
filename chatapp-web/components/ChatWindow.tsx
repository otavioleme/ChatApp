"use client";

import { useState, useEffect, useRef } from "react";
import { Message, Room, DirectConversation } from "@/types";
import api from "@/lib/api";
import Avatar from "@/components/Avatar";

interface ChatWindowProps {
  user: { id: number; username: string; email: string; token: string; avatarUrl: string | null };
  activeRoom: Room | null;
  activeConversation: DirectConversation | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onImageSent: (message: Message) => void;
  onDeleteMessage: (messageId: number) => void;
  onTyping: () => void;
}

export default function ChatWindow({
  user,
  activeRoom,
  activeConversation,
  messages,
  onSendMessage,
  onImageSent = () => {},
  onDeleteMessage,
  onTyping,
}: ChatWindowProps) {
  const [content, setContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!content.trim()) return;
    onSendMessage(content.trim());
    setContent("");
  };

  const handleTyping = () => {
    onTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTypingUsers([]), 2000);
  };

  const handleFileUpload = async (file: File) => {
    if (!activeRoom && !activeConversation) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (activeRoom) formData.append("roomId", activeRoom.id.toString());
      if (activeConversation) formData.append("directConversationId", activeConversation.id.toString());

      const { data } = await api.post("/api/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onImageSent(data);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFileUpload(file);
      }
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!activeRoom && !activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-gray-400 text-lg">Select a room or conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const title = activeRoom ? `# ${activeRoom.name}` : `@ ${
    activeConversation!.user1.id === user.id
      ? activeConversation!.user2.username
      : activeConversation!.user1.username
  }`;

  return (
    <div className="flex-1 flex flex-col bg-gray-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <h2 className="text-white font-semibold text-lg">{title}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 group ${message.senderId === user.id ? "flex-row-reverse" : ""}`}>
            <Avatar
              username={message.senderUsername}
              avatarUrl={message.senderAvatarUrl}
              size="sm"
            />
            <div className={`flex flex-col max-w-xs lg:max-w-md ${message.senderId === user.id ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-400 text-xs">{message.senderUsername}</span>
                <span className="text-gray-600 text-xs">{formatTime(message.createdAt)}</span>
                {message.senderId === user.id && (
                  <button
                    onClick={() => onDeleteMessage(message.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition-opacity"
                  >
                    🗑
                  </button>
                )}
              </div>

              {message.fileAttachment ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${message.fileAttachment.fileUrl}`}
                  alt={message.fileAttachment.fileName}
                  className="max-w-xs max-h-64 rounded-xl object-cover cursor-pointer"
                  onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}${message.fileAttachment!.fileUrl}`, "_blank")}
                />
              ) : (
                <div className={`px-4 py-2 rounded-2xl text-sm ${
                  message.senderId === user.id
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-gray-800 text-gray-100 rounded-tl-sm"
                }`}>
                  {message.content}
                </div>
              )}
            </div>
          </div>
        ))}
        {typingUsers.length > 0 && (
          <p className="text-gray-500 text-xs italic">{typingUsers.join(", ")} is typing...</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {uploading ? "⏳" : "📎"}
          </button>
          <input
            type="text"
            placeholder={`Message ${title}`}
            value={content}
            onChange={(e) => { setContent(e.target.value); handleTyping(); }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            onPaste={handlePaste}
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!content.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-4 py-3 transition-colors text-sm font-semibold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}