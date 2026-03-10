using System.Security.Claims;
using ChatApp.API.DTOs;
using ChatApp.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController(MessageService messageService, FileService fileService) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("room/{roomId}")]
    public async Task<IActionResult> GetRoomMessages(int roomId)
    {
        var messages = await messageService.GetRoomMessagesAsync(roomId);
        return Ok(messages);
    }

    [HttpGet("conversation/{conversationId}")]
    public async Task<IActionResult> GetDirectMessages(int conversationId)
    {
        var messages = await messageService.GetDirectMessagesAsync(conversationId);
        return Ok(messages);
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage(SendMessageRequest request)
    {
        var message = await messageService.SendMessageAsync(request, GetUserId());

        if (message is null)
            return BadRequest(new { message = "Invalid message." });

        return Ok(message);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMessage(int id)
    {
        var success = await messageService.DeleteMessageAsync(id, GetUserId());

        if (!success)
            return NotFound(new { message = "Message not found or unauthorized." });

        return NoContent();
    }

[HttpPost("upload")]
    public async Task<IActionResult> UploadFile(
        [FromForm] IFormFile file,
        [FromForm] int? roomId,
        [FromForm] int? directConversationId)
    {
        var senderId = GetUserId();
        var result = await fileService.UploadAndCreateMessageAsync(file, senderId, roomId, directConversationId);

        if (result is null)
            return BadRequest(new { message = "Invalid file. Check size (max 10MB) and extension." });

        return Ok(result);
    }
}