using ChatApp.API.Data;
using ChatApp.API.DTOs;
using ChatApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.API.Services;

public class RoomService(AppDbContext context)
{
    public async Task<List<RoomResponse>> GetAllRoomsAsync()
    {
        return await context.Rooms
            .Include(r => r.CreatedBy)
            .Select(r => new RoomResponse(
                r.Id,
                r.Name,
                r.CreatedAt,
                r.CreatedByUserId,
                r.CreatedBy.Username
            ))
            .ToListAsync();
    }

    public async Task<RoomResponse?> CreateRoomAsync(CreateRoomRequest request, int userId)
    {
        if (await context.Rooms.AnyAsync(r => r.Name == request.Name))
            return null;

        var room = new Room
        {
            Name = request.Name,
            CreatedByUserId = userId
        };

        context.Rooms.Add(room);
        await context.SaveChangesAsync();

        await JoinRoomAsync(room.Id, userId);

        await context.Entry(room).Reference(r => r.CreatedBy).LoadAsync();

        return new RoomResponse(room.Id, room.Name, room.CreatedAt, room.CreatedByUserId, room.CreatedBy.Username);
    }

    public async Task<bool> DeleteRoomAsync(int roomId, int userId)
    {
        var room = await context.Rooms.FirstOrDefaultAsync(r => r.Id == roomId && r.CreatedByUserId == userId);

        if (room is null)
            return false;

        context.Rooms.Remove(room);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> JoinRoomAsync(int roomId, int userId)
    {
        if (await context.RoomMembers.AnyAsync(rm => rm.RoomId == roomId && rm.UserId == userId))
            return false;

        context.RoomMembers.Add(new RoomMember { RoomId = roomId, UserId = userId });
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> LeaveRoomAsync(int roomId, int userId)
    {
        var member = await context.RoomMembers
            .FirstOrDefaultAsync(rm => rm.RoomId == roomId && rm.UserId == userId);

        if (member is null)
            return false;

        context.RoomMembers.Remove(member);
        await context.SaveChangesAsync();
        return true;
    }
}