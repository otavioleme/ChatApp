namespace ChatApp.API.Models;

public class RoomMember
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public int UserId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Room Room { get; set; } = null!;
    public User User { get; set; } = null!;
}