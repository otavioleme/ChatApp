namespace ChatApp.API.DTOs;

public record CreateRoomRequest(string Name);

public record RoomResponse(int Id, string Name, DateTime CreatedAt, int CreatedByUserId, string CreatedByUsername);