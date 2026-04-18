package handlers

import (
	"net/http"
	"strconv"

	"trading-platform/internal/database"
	"trading-platform/internal/models"

	"github.com/labstack/echo/v4"
)

func journalPnL(j *models.TradingJournal) {
	if j.Direction == "LONG" {
		j.PnL = (j.ExitPrice - j.EntryPrice) * float64(j.Volume)
	} else {
		j.PnL = (j.EntryPrice - j.ExitPrice) * float64(j.Volume)
	}
}

func GetUserJournals(c echo.Context) error {
	userID := c.Get("user_id").(uint)
	var journals []models.TradingJournal
	database.DB.Where("user_id = ?", userID).Order("traded_at DESC").Find(&journals)
	return c.JSON(http.StatusOK, journals)
}

func CreateJournal(c echo.Context) error {
	userID := c.Get("user_id").(uint)
	var journal models.TradingJournal
	if err := c.Bind(&journal); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	journal.UserID = userID
	journalPnL(&journal)
	if err := database.DB.Create(&journal).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not create journal"})
	}
	return c.JSON(http.StatusCreated, journal)
}

func UpdateJournal(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	userID := c.Get("user_id").(uint)

	var journal models.TradingJournal
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&journal).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "journal not found"})
	}

	var updates models.TradingJournal
	if err := c.Bind(&updates); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	updates.ID = journal.ID
	updates.UserID = journal.UserID
	journalPnL(&updates)

	database.DB.Model(&journal).Updates(map[string]any{
		"symbol":         updates.Symbol,
		"direction":      updates.Direction,
		"entry_price":    updates.EntryPrice,
		"exit_price":     updates.ExitPrice,
		"volume":         updates.Volume,
		"pnl":            updates.PnL,
		"screenshot_url": updates.ScreenshotURL,
		"notes":          updates.Notes,
		"traded_at":      updates.TradedAt,
	})
	database.DB.First(&journal, id)
	return c.JSON(http.StatusOK, journal)
}

func DeleteJournal(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	userID := c.Get("user_id").(uint)

	res := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.TradingJournal{})
	if res.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "journal not found"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "deleted successfully"})
}
