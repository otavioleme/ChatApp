using System.Collections.Concurrent;
using System.Security.Claims;
using ChatApp.API.DTOs;
using ChatApp.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.API.Hubs;

[Authorize]
public class ChatHub(MessageService messageService) : Hub
{
    private static readonly ConcurrentDictionary<string, string> OnlineUsers = new();

    private int GetUserId() => int.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string GetUsername() => Context.User!.FindFirstValue(ClaimTypes.Name)!;

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId().ToString();
        var username = GetUsername();

        OnlineUsers[userId] = username;

        await Clients.All.SendAsync("UserOnline", userId, username);
        await Clients.Caller.SendAsync("OnlineUsers", OnlineUsers);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId().ToString();
        var username = GetUsername();

        OnlineUsers.TryRemove(userId, out _);

        await Clients.All.SendAsync("UserOffline", userId, username);

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinRoom(int roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomId}");
        await Clients.Group($"room_{roomId}").SendAsync("UserJoinedRoom", GetUserId(), GetUsername(), roomId);
    }

    public async Task LeaveRoom(int roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room_{roomId}");
        await Clients.Group($"room_{roomId}").SendAsync("UserLeftRoom", GetUserId(), GetUsername(), roomId);
    }

    public async Task SendRoomMessage(int roomId, string content)
    {
        var request = new SendMessageRequest(content, roomId, null);
        var message = await messageService.SendMessageAsync(request, GetUserId());

        if (message is not null)
            await Clients.Group($"room_{roomId}").SendAsync("ReceiveRoomMessage", message);
    }

    public async Task SendDirectMessage(int conversationId, string content)
    {
        var request = new SendMessageRequest(content, null, conversationId);
        var message = await messageService.SendMessageAsync(request, GetUserId());

        if (message is not null)
        {
            await Clients.Group($"dm_{conversationId}").SendAsync("ReceiveDirectMessage", message);
            await Clients.All.SendAsync("ConversationUpdated", conversationId);
        }
    }

    public async Task JoinDirectConversation(int conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"dm_{conversationId}");
    }

    public async Task TypingInRoom(int roomId)
    {
        await Clients.OthersInGroup($"room_{roomId}").SendAsync("UserTypingInRoom", GetUserId(), GetUsername(), roomId);
    }

    public async Task TypingInDirect(int conversationId)
    {
        await Clients.OthersInGroup($"dm_{conversationId}").SendAsync("UserTypingInDirect", GetUserId(), GetUsername(), conversationId);
    }

    public async Task NotifyImageSent(MessageResponse message)
    {
        if (message.RoomId.HasValue)
            await Clients.OthersInGroup($"room_{message.RoomId}").SendAsync("ReceiveRoomMessage", message);
        else if (message.DirectConversationId.HasValue)
            await Clients.OthersInGroup($"dm_{message.DirectConversationId}").SendAsync("ReceiveDirectMessage", message);
    }

    public async Task NotifyMessageDeleted(int messageId, int? roomId, int? directConversationId)
{
    if (roomId.HasValue)
        await Clients.OthersInGroup($"room_{roomId}").SendAsync("MessageDeleted", messageId);
    else if (directConversationId.HasValue)
        await Clients.OthersInGroup($"dm_{directConversationId}").SendAsync("MessageDeleted", messageId);
}

public async Task NotifyRoomCreated(RoomResponse room)
{
    await Clients.All.SendAsync("RoomCreated", room);
}

public async Task NotifyRoomDeleted(int roomId)
{
    await Clients.All.SendAsync("RoomDeleted", roomId);
}

}