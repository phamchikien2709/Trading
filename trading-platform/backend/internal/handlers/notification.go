package handlers

import (
	"net/http"
	"strconv"
	"time"

	"trading-platform/internal/database"
	"trading-platform/internal/models"

	"github.com/labstack/echo/v4"
)

// enqueueNotification persists one row; skips when recipient would notify themselves.
func enqueueNotification(recipientID uint, typ string, body string, actorID uint, postID *uint) {
	if recipientID == 0 || recipientID == actorID {
		return
	}
	aid := actorID
	n := models.Notification{
		UserID:  recipientID,
		Type:    typ,
		Body:    body,
		ActorID: &aid,
		PostID:  postID,
	}
	_ = database.DB.Create(&n).Error
}

func ListNotifications(c echo.Context) error {
	me := c.Get("user_id").(uint)
	var items []models.Notification
	if err := database.DB.Preload("Actor").
		Where("user_id = ?", me).
		Order("created_at DESC").
		Limit(100).
		Find(&items).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not load notifications"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func UnreadNotificationCount(c echo.Context) error {
	me := c.Get("user_id").(uint)
	var n int64
	if err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", me).
		Count(&n).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not count"})
	}
	return c.JSON(http.StatusOK, map[string]int64{"unread_count": n})
}

func MarkNotificationRead(c echo.Context) error {
	me := c.Get("user_id").(uint)
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	id := uint(id64)
	now := time.Now()
	res := database.DB.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, me).
		Update("read_at", now)
	if res.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not update"})
	}
	if res.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "ok"})
}

func MarkAllNotificationsRead(c echo.Context) error {
	me := c.Get("user_id").(uint)
	now := time.Now()
	if err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", me).
		Update("read_at", now).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not update"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "ok"})
}
