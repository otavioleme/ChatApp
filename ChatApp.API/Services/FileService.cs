using ChatApp.API.Data;
using ChatApp.API.DTOs;
using ChatApp.API.Models;

namespace ChatApp.API.Services;

public class FileService(AppDbContext context, IWebHostEnvironment environment)
{
    private readonly string[] _allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public async Task<MessageResponse?> UploadAndCreateMessageAsync(
        IFormFile file,
        int senderId,
        int? roomId,
        int? directConversationId)
    {
        if (file.Length > MaxFileSize)
            return null;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(extension))
            return null;

        var uploadsPath = Path.Combine(environment.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadsPath);

        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsPath, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var message = new Message
        {
            Content = "",
            SenderId = senderId,
            RoomId = roomId,
            DirectConversationId = directConversationId
        };

        context.Messages.Add(message);
        await context.SaveChangesAsync();

        var attachment = new FileAttachment
        {
            MessageId = message.Id,
            FileName = file.FileName,
            FileUrl = $"/uploads/{uniqueFileName}",
            FileSize = file.Length
        };

        context.FileAttachments.Add(attachment);
        await context.SaveChangesAsync();

        await context.Entry(message).Reference(m => m.Sender).LoadAsync();
        await context.Entry(message).Reference(m => m.FileAttachment).LoadAsync();

return new MessageResponse(
    message.Id,
    message.Content,
    message.CreatedAt,
    message.SenderId,
    message.Sender.Username,
    message.Sender.AvatarUrl,
    message.RoomId,
    message.DirectConversationId,
    new FileAttachmentResponse(
        attachment.Id,
        attachment.FileName,
        attachment.FileUrl,
        attachment.FileSize
    )
);
    }
}