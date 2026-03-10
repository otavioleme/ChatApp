namespace ChatApp.API.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<RoomMember> RoomMembers { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
    public ICollection<Room> CreatedRooms { get; set; } = [];
    public ICollection<DirectConversation> DirectConversationsAsUser1 { get; set; } = [];
    public ICollection<DirectConversation> DirectConversationsAsUser2 { get; set; } = [];

    public string? AvatarUrl { get; set; }
}