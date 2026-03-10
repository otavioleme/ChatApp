"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/Avatar";
import api from "@/lib/api";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) {
    router.push("/");
    return null;
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/api/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      login({ ...user, avatarUrl: data.avatarUrl });
      setSuccess(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/chat")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Avatar username={user.username} avatarUrl={user.avatarUrl} size="lg" />

          <div className="text-center">
            <p className="text-white font-semibold text-lg">{user.username}</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg px-6 py-3 transition-colors w-full"
          >
            {uploading ? "Uploading..." : "Change Avatar"}
          </button>

          {success && (
            <p className="text-green-400 text-sm">Avatar updated successfully!</p>
          )}
        </div>
      </div>
    </div>
  );
}