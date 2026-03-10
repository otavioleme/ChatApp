namespace ChatApp.API.DTOs;

public record CreateDirectConversationRequest(int OtherUserId);

public record DirectConversationResponse(
    int Id,
    DateTime CreatedAt,
    UserResponse User1,
    UserResponse User2
);