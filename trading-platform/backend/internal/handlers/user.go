package handlers

import (
	"net/http"
	"strconv"

	"trading-platform/internal/database"
	"trading-platform/internal/models"

	"github.com/labstack/echo/v4"
)

func GetProfile(c echo.Context) error {
	userID := c.Get("user_id").(uint)
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "user not found"})
	}
	return c.JSON(http.StatusOK, map[string]any{
		"id":         user.ID,
		"username":   user.Username,
		"email":      user.Email,
		"avatar_url": user.AvatarURL,
		"bio":        user.Bio,
		"created_at": user.CreatedAt,
	})
}

type updateProfileRequest struct {
	AvatarURL string `json:"avatar_url"`
	Bio       string `json:"bio"`
}

func UpdateProfile(c echo.Context) error {
	userID := c.Get("user_id").(uint)
	var req updateProfileRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]any{
		"avatar_url": req.AvatarURL,
		"bio":        req.Bio,
	}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not update profile"})
	}
	return GetProfile(c)
}

func FollowUser(c echo.Context) error {
	me := c.Get("user_id").(uint)
	targetID64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	target := uint(targetID64)
	if target == me {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cannot follow yourself"})
	}

	var count int64
	database.DB.Model(&models.User{}).Where("id = ?", target).Count(&count)
	if count == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "user not found"})
	}

	f := models.Follow{UserID: target, FollowerID: me}
	if err := database.DB.Create(&f).Error; err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "already following"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "followed"})
}

func UnfollowUser(c echo.Context) error {
	me := c.Get("user_id").(uint)
	targetID64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	target := uint(targetID64)

	res := database.DB.Where("user_id = ? AND follower_id = ?", target, me).Delete(&models.Follow{})
	if res.RowsAffected == 0 {
		return c.JSON(http.StatusOK, map[string]string{"message": "not following"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "unfollowed"})
}
