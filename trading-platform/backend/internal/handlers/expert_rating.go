package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"trading-platform/internal/database"
	"trading-platform/internal/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func refreshExpertAggregatesTx(tx *gorm.DB, expertID uint) error {
	var row struct {
		Avg float64
		Cnt int64
	}
	if err := tx.Model(&models.ExpertRating{}).Where("expert_id = ?", expertID).
		Select("COALESCE(AVG(score),0) as avg, COUNT(*) as cnt").
		Scan(&row).Error; err != nil {
		return err
	}
	return tx.Model(&models.User{}).Where("id = ?", expertID).Updates(map[string]any{
		"expert_rating_avg":   row.Avg,
		"expert_rating_count": int(row.Cnt),
	}).Error
}

func SetExpertRating(c echo.Context) error {
	me := c.Get("user_id").(uint)
	target64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	target := uint(target64)
	if target == me {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cannot rate yourself"})
	}

	var req struct {
		Score int `json:"score"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if req.Score < 1 || req.Score > 5 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "score must be 1-5"})
	}

	var n int64
	database.DB.Model(&models.User{}).Where("id = ?", target).Count(&n)
	if n == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "user not found"})
	}

	er := models.ExpertRating{ExpertID: target, RaterID: me, Score: req.Score}
	if err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "expert_id"}, {Name: "rater_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"score", "updated_at"}),
		}).Create(&er).Error; err != nil {
			return err
		}
		return refreshExpertAggregatesTx(tx, target)
	}); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not save rating"})
	}

	var u models.User
	if err := database.DB.First(&u, target).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not load user"})
	}
	var actor models.User
	if err := database.DB.Select("username").First(&actor, me).Error; err == nil {
		enqueueNotification(target, "expert_rating", fmt.Sprintf("%s đã chấm bạn %d sao (chuyên gia)", actor.Username, req.Score), me, nil)
	}
	return c.JSON(http.StatusOK, map[string]any{
		"expert_rating_avg":     u.ExpertRatingAvg,
		"expert_rating_count": u.ExpertRatingCount,
		"my_expert_rating":      req.Score,
	})
}
