namespace ChatApp.API.DTOs;

public record SendMessageRequest(string Content, int? RoomId, int? DirectConversationId);

public record MessageResponse(
    int Id,
    string Content,
    DateTime CreatedAt,
    int SenderId,
    string SenderUsername,
    string? SenderAvatarUrl,
    int? RoomId,
    int? DirectConversationId,
    FileAttachmentResponse? FileAttachment
);

public record FileAttachmentResponse(int Id, string FileName, string FileUrl, long FileSize);