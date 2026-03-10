"use client";

import { useState, useEffect } from "react";
import { Room, DirectConversation, User } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Avatar from "@/components/Avatar";

interface SidebarProps {
  user: { id: number; username: string; email: string; token: string; avatarUrl: string | null };
  rooms: Room[];
  conversations: DirectConversation[];
  activeRoom: Room | null;
  activeConversation: DirectConversation | null;
  onlineUsers: Record<string, string>;
  unreadRooms: Set<number>;
  unreadConversations: Set<number>;
  onSelectRoom: (room: Room) => void;
  onSelectConversation: (conversation: DirectConversation) => void;
  onCreateRoom: (name: string) => void;
  onStartConversation: (userId: number) => void;
  onRefreshConversations: () => void;
  onDeleteRoom: (roomId: number) => void;
}

export default function Sidebar({
  user,
  rooms,
  conversations,
  activeRoom,
  activeConversation,
  onlineUsers,
  unreadRooms = new Set(),
  unreadConversations = new Set(),
  onSelectRoom,
  onSelectConversation,
  onCreateRoom,
  onDeleteRoom,
  onStartConversation,
}: SidebarProps) {
  const [newRoomName, setNewRoomName] = useState("");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [dmUsername, setDmUsername] = useState("");
  const [showNewDm, setShowNewDm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    api.get("/api/users").then(({ data }) => setUsers(data));
  }, []);

  const handleDmInput = (value: string) => {
    setDmUsername(value);
    if (!value.trim()) {
      setFilteredUsers([]);
      return;
    }
    const filtered = users.filter(
      (u) =>
        u.username.toLowerCase().includes(value.toLowerCase()) &&
        u.id !== user.id
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (selectedUser: User) => {
    onStartConversation(selectedUser.id);
    setDmUsername("");
    setFilteredUsers([]);
    setShowNewDm(false);
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    onCreateRoom(newRoomName.trim());
    setNewRoomName("");
    setShowNewRoom(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getOtherUser = (conversation: DirectConversation) => {
    return conversation.user1.id === user.id ? conversation.user2 : conversation.user1;
  };

  const isOnline = (userId: number) => !!onlineUsers[userId.toString()];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
{/* Header */}
<div className="p-4 border-b border-gray-800 flex items-center gap-3">
  <Avatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
  <div className="flex-1 min-w-0">
    <h1 className="text-sm font-bold text-white truncate">{user.username}</h1>
  </div>
  <button
    onClick={() => router.push("/profile")}
    className="text-gray-400 hover:text-white text-xs transition-colors"
  >
    ⚙️
  </button>
</div>

      {/* Rooms */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Rooms</span>
            <button onClick={() => setShowNewRoom(!showNewRoom)} className="text-gray-400 hover:text-white text-lg leading-none">+</button>
          </div>

          {showNewRoom && (
            <div className="mb-2 flex gap-1">
              <input
                type="text"
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                className="flex-1 bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500"
              />
              <button onClick={handleCreateRoom} className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded px-2 py-1">+</button>
            </div>
          )}

{rooms.map((room) => (
  <div
    key={room.id}
    className={`flex items-center group rounded-lg ${
      activeRoom?.id === room.id ? "bg-blue-600" : "hover:bg-gray-800"
    }`}
  >
    <button
      onClick={() => onSelectRoom(room)}
      className={`flex-1 text-left px-3 py-2 text-sm transition-colors ${
        activeRoom?.id === room.id ? "text-white" : "text-gray-300"
      }`}
    >
      # {room.name}
    </button>
    {unreadRooms.has(room.id) && (
      <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mr-2" />
    )}
    {room.createdByUserId === user.id && (
      <button
        onClick={() => onDeleteRoom(room.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs pr-2 transition-opacity"
      >
        🗑
      </button>
    )}
  </div>
))}
        </div>

        {/* Direct Messages */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Direct Messages</span>
            <button onClick={() => { setShowNewDm(!showNewDm); setDmUsername(""); setFilteredUsers([]); }} className="text-gray-400 hover:text-white text-lg leading-none">+</button>
          </div>

          {showNewDm && (
            <div className="mb-2 relative">
              <input
                type="text"
                placeholder="Search username..."
                value={dmUsername}
                onChange={(e) => handleDmInput(e.target.value)}
                className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500"
              />
              {filteredUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg mt-1 z-10 overflow-hidden">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline(u.id) ? "bg-green-400" : "bg-gray-600"}`} />
                      {u.username}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

{conversations.map((conversation) => {
  const other = getOtherUser(conversation);
  return (
    <button
      key={conversation.id}
      onClick={() => onSelectConversation(conversation)}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
        activeConversation?.id === conversation.id ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
      }`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline(other.id) ? "bg-green-400" : "bg-gray-600"}`} />
      <span className="flex-1">{other.username}</span>
      {unreadConversations.has(conversation.id) && (
        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
      )}
    </button>
  );
})}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full text-left text-gray-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}