package handlers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"trading-platform/internal/database"
	"trading-platform/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type registerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Register(c echo.Context) error {
	var req registerRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Username == "" || len(req.Password) < 6 || req.Email == "" || !strings.Contains(req.Email, "@") {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "validation failed"})
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not hash password"})
	}

	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
	}
	if err := database.DB.Create(&user).Error; err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "user already exists"})
	}

	return c.JSON(http.StatusCreated, map[string]any{
		"message": "user created successfully",
		"user_id": user.ID,
	})
}

func Login(c echo.Context) error {
	var req loginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "server misconfigured"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenStr, err := token.SignedString([]byte(secret))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not sign token"})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"token": tokenStr,
		"user": map[string]any{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"avatar":   user.AvatarURL,
		},
	})
}
