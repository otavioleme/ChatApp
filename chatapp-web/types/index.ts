export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  avatarUrl: string | null;
}

export interface LoginResponse {
  id: number;
  username: string;
  email: string;
  token: string;
  avatarUrl: string | null;
}

export interface Room {
  id: number;
  name: string;
  createdAt: string;
  createdByUserId: number;
  createdByUsername: string;
}

export interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  senderUsername: string;
  senderAvatarUrl: string | null;
  roomId: number | null;
  directConversationId: number | null;
  fileAttachment: FileAttachment | null;
}

export interface FileAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
}

export interface DirectConversation {
  id: number;
  createdAt: string;
  user1: User;
  user2: User;
}