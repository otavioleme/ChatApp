using System.Security.Claims;
using ChatApp.API.DTOs;
using ChatApp.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[ApiController]
[Route("api/rooms")]
[Authorize]
public class RoomsController(RoomService roomService) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetRooms()
    {
        var rooms = await roomService.GetAllRoomsAsync();
        return Ok(rooms);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoom(CreateRoomRequest request)
    {
        var room = await roomService.CreateRoomAsync(request, GetUserId());

        if (room is null)
            return BadRequest(new { message = "Room name already exists." });

        return Ok(room);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoom(int id)
    {
        var success = await roomService.DeleteRoomAsync(id, GetUserId());

        if (!success)
            return NotFound(new { message = "Room not found or unauthorized." });

        return NoContent();
    }

    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinRoom(int id)
    {
        var success = await roomService.JoinRoomAsync(id, GetUserId());

        if (!success)
            return BadRequest(new { message = "Already a member of this room." });

        return Ok();
    }

    [HttpPost("{id}/leave")]
    public async Task<IActionResult> LeaveRoom(int id)
    {
        var success = await roomService.LeaveRoomAsync(id, GetUserId());

        if (!success)
            return NotFound(new { message = "Not a member of this room." });

        return NoContent();
    }
}