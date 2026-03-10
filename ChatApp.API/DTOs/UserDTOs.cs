namespace ChatApp.API.DTOs;

public record UserResponse(int Id, string Username, string Email, DateTime CreatedAt, string? AvatarUrl);