namespace ChatApp.API.Models;

public class Message
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int SenderId { get; set; }
    public int? RoomId { get; set; }
    public int? DirectConversationId { get; set; }

    // Navigation properties
    public User Sender { get; set; } = null!;
    public Room? Room { get; set; }
    public DirectConversation? DirectConversation { get; set; }
    public FileAttachment? FileAttachment { get; set; }
}