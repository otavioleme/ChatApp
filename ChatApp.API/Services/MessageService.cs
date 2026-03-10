using ChatApp.API.Data;
using ChatApp.API.DTOs;
using ChatApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.API.Services;

public class MessageService(AppDbContext context)
{
    public async Task<List<MessageResponse>> GetRoomMessagesAsync(int roomId)
    {
        return await context.Messages
            .Include(m => m.Sender)
            .Include(m => m.FileAttachment)
            .Where(m => m.RoomId == roomId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => ToResponse(m))
            .ToListAsync();
    }

    public async Task<List<MessageResponse>> GetDirectMessagesAsync(int conversationId)
    {
        return await context.Messages
            .Include(m => m.Sender)
            .Include(m => m.FileAttachment)
            .Where(m => m.DirectConversationId == conversationId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => ToResponse(m))
            .ToListAsync();
    }

    public async Task<MessageResponse?> SendMessageAsync(SendMessageRequest request, int senderId)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return null;

        var message = new Message
        {
            Content = request.Content,
            SenderId = senderId,
            RoomId = request.RoomId,
            DirectConversationId = request.DirectConversationId
        };

        context.Messages.Add(message);
        await context.SaveChangesAsync();

        await context.Entry(message).Reference(m => m.Sender).LoadAsync();

        return ToResponse(message);
    }

    public async Task<bool> DeleteMessageAsync(int messageId, int userId)
    {
        var message = await context.Messages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.SenderId == userId);

        if (message is null)
            return false;

        context.Messages.Remove(message);
        await context.SaveChangesAsync();
        return true;
    }

private static MessageResponse ToResponse(Message m) => new(
    m.Id,
    m.Content,
    m.CreatedAt,
    m.SenderId,
    m.Sender.Username,
    m.Sender.AvatarUrl,
    m.RoomId,
    m.DirectConversationId,
    m.FileAttachment == null ? null : new FileAttachmentResponse(
        m.FileAttachment.Id,
        m.FileAttachment.FileName,
        m.FileAttachment.FileUrl,
        m.FileAttachment.FileSize
    )
);
}