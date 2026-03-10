using ChatApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomMember> RoomMembers => Set<RoomMember>();
    public DbSet<DirectConversation> DirectConversations => Set<DirectConversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<FileAttachment> FileAttachments => Set<FileAttachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Room
        modelBuilder.Entity<Room>()
            .HasOne(r => r.CreatedBy)
            .WithMany(u => u.CreatedRooms)
            .HasForeignKey(r => r.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // RoomMember
        modelBuilder.Entity<RoomMember>()
            .HasOne(rm => rm.Room)
            .WithMany(r => r.RoomMembers)
            .HasForeignKey(rm => rm.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RoomMember>()
            .HasOne(rm => rm.User)
            .WithMany(u => u.RoomMembers)
            .HasForeignKey(rm => rm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // DirectConversation
        modelBuilder.Entity<DirectConversation>()
            .HasOne(dc => dc.User1)
            .WithMany(u => u.DirectConversationsAsUser1)
            .HasForeignKey(dc => dc.User1Id)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DirectConversation>()
            .HasOne(dc => dc.User2)
            .WithMany(u => u.DirectConversationsAsUser2)
            .HasForeignKey(dc => dc.User2Id)
            .OnDelete(DeleteBehavior.Restrict);

        // Message
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany(u => u.Messages)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Message>()
            .HasOne(m => m.Room)
            .WithMany(r => r.Messages)
            .HasForeignKey(m => m.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Message>()
            .HasOne(m => m.DirectConversation)
            .WithMany(dc => dc.Messages)
            .HasForeignKey(m => m.DirectConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        // FileAttachment
        modelBuilder.Entity<FileAttachment>()
            .HasOne(fa => fa.Message)
            .WithOne(m => m.FileAttachment)
            .HasForeignKey<FileAttachment>(fa => fa.MessageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}