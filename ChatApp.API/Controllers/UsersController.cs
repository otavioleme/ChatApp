using System.Security.Claims;
using ChatApp.API.Data;
using ChatApp.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(AppDbContext context, IWebHostEnvironment environment) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await context.Users
            .Select(u => new UserResponse(u.Id, u.Username, u.Email, u.CreatedAt, u.AvatarUrl))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { message = "Invalid file type." });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "File too large. Max 5MB." });

        var uploadsPath = Path.Combine(environment.WebRootPath, "uploads", "avatars");
        Directory.CreateDirectory(uploadsPath);

        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsPath, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var user = await context.Users.FindAsync(GetUserId());
        if (user is null) return NotFound();

        user.AvatarUrl = $"/uploads/avatars/{uniqueFileName}";
        await context.SaveChangesAsync();

        return Ok(new { avatarUrl = user.AvatarUrl });
    }
}