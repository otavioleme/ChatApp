namespace ChatApp.API.Models;

public class Room
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }

    // Navigation properties
    public User CreatedBy { get; set; } = null!;
    public ICollection<RoomMember> RoomMembers { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
}