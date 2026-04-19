package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"trading-platform/internal/database"
	"trading-platform/internal/models"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/datatypes"
)

type checklistTemplateItemInput struct {
	Label string `json:"label"`
}

type journalChecklistTemplateBody struct {
	Name  string                       `json:"name"`
	Items []checklistTemplateItemInput `json:"items"`
}

func ListJournalChecklistTemplates(c echo.Context) error {
	userID := c.Get("user_id").(uint)
	var rows []models.JournalChecklistTemplate
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&rows)
	return c.JSON(http.StatusOK, rows)
}

func GetJournalChecklistTemplate(c echo.Context) error {
	userID := c.Get("user_id").(uint)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	var row models.JournalChecklistTemplate
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&row).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "template not found"})
	}
	return c.JSON(http.StatusOK, row)
}

func CreateJournalChecklistTemplate(c echo.Context) error {
	userID := c.Get("user_id").(uint)
	var body journalChecklistTemplateBody
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	name := strings.TrimSpace(body.Name)
	if name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "tên checklist không được để trống"})
	}
	items := make([]checklistDefItem, 0, len(body.Items))
	for _, it := range body.Items {
		l := strings.TrimSpace(it.Label)
		if l == "" {
			continue
		}
		items = append(items, checklistDefItem{ID: uuid.NewString(), Label: l})
	}
	if len(items) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cần ít nhất một rule"})
	}
	raw, err := json.Marshal(items)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not save template"})
	}
	row := models.JournalChecklistTemplate{
		UserID: userID,
		Name:   name,
		Items:  datatypes.JSON(raw),
	}
	if err := database.DB.Create(&row).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not create template"})
	}
	return c.JSON(http.StatusCreated, row)
}

func DeleteJournalChecklistTemplate(c echo.Context) error {
	userID := c.Get("user_id").(uint)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	var row models.JournalChecklistTemplate
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&row).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "template not found"})
	}
	if err := database.DB.Delete(&row).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not delete template"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "archived"})
}
