using System.Security.Claims;
using ChatApp.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public class DirectConversationsController(DirectConversationService conversationService) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetConversations()
    {
        var conversations = await conversationService.GetUserConversationsAsync(GetUserId());
        return Ok(conversations);
    }

    [HttpPost("{otherUserId}")]
    public async Task<IActionResult> CreateConversation(int otherUserId)
    {
        var conversation = await conversationService.CreateConversationAsync(GetUserId(), otherUserId);

        if (conversation is null)
            return BadRequest(new { message = "Could not create conversation." });

        return Ok(conversation);
    }
}