namespace ChatApp.API.DTOs;

public record RegisterRequest(string Username, string Email, string Password);

public record LoginRequest(string Email, string Password);

public record LoginResponse(int Id, string Username, string Email, string Token);