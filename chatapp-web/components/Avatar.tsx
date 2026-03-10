interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({ username, avatarUrl, size = "md" }: AvatarProps) {
  const sizes = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-16 h-16 text-xl",
  };

  if (avatarUrl) {
    return (
      <img
        src={`${process.env.NEXT_PUBLIC_API_URL}${avatarUrl}`}
        alt={username}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-semibold">
        {username.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}