using ChatApp.API.Data;
using ChatApp.API.DTOs;
using ChatApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.API.Services;

public class DirectConversationService(AppDbContext context)
{
    public async Task<List<DirectConversationResponse>> GetUserConversationsAsync(int userId)
    {
        return await context.DirectConversations
            .Include(dc => dc.User1)
            .Include(dc => dc.User2)
            .Where(dc => dc.User1Id == userId || dc.User2Id == userId)
            .Select(dc => ToResponse(dc))
            .ToListAsync();
    }

    public async Task<DirectConversationResponse?> CreateConversationAsync(int userId, int otherUserId)
    {
        var exists = await context.DirectConversations
            .Include(dc => dc.User1)
            .Include(dc => dc.User2)
            .FirstOrDefaultAsync(dc =>
                (dc.User1Id == userId && dc.User2Id == otherUserId) ||
                (dc.User1Id == otherUserId && dc.User2Id == userId));

        if (exists is not null)
            return ToResponse(exists);

        var conversation = new DirectConversation
        {
            User1Id = userId,
            User2Id = otherUserId
        };

        context.DirectConversations.Add(conversation);
        await context.SaveChangesAsync();

        await context.Entry(conversation).Reference(dc => dc.User1).LoadAsync();
        await context.Entry(conversation).Reference(dc => dc.User2).LoadAsync();

        return ToResponse(conversation);
    }

private static DirectConversationResponse ToResponse(DirectConversation dc) => new(
    dc.Id,
    dc.CreatedAt,
    new UserResponse(dc.User1.Id, dc.User1.Username, dc.User1.Email, dc.User1.CreatedAt, dc.User1.AvatarUrl),
    new UserResponse(dc.User2.Id, dc.User2.Username, dc.User2.Email, dc.User2.CreatedAt, dc.User2.AvatarUrl)
);
}