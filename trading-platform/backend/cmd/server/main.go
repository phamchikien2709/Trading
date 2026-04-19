package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"trading-platform/internal/database"
	"trading-platform/internal/handlers"
	authmw "trading-platform/internal/middleware"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	_ = godotenv.Load()

	database.Connect()

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	origins := os.Getenv("CORS_ORIGINS")
	if origins == "" {
		origins = "http://localhost:5173,http://127.0.0.1:5173"
	}
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: strings.Split(origins, ","),
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	e.GET("/api/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	e.POST("/api/login", handlers.Login)
	e.POST("/api/auth/signup/request", handlers.SignupRequestOTP)
	e.POST("/api/auth/signup/verify", handlers.SignupVerifyOTP)
	e.POST("/api/auth/signup/complete", handlers.SignupComplete)
	e.POST("/api/auth/password-reset/request", handlers.PasswordResetRequestOTP)
	e.POST("/api/auth/password-reset/verify", handlers.PasswordResetVerifyOTP)
	e.POST("/api/auth/password-reset/complete", handlers.PasswordResetComplete)

	api := e.Group("/api")
	api.Use(authmw.AuthMiddleware)
	api.GET("/journal-checklist-templates", handlers.ListJournalChecklistTemplates)
	api.GET("/journal-checklist-templates/:id", handlers.GetJournalChecklistTemplate)
	api.POST("/journal-checklist-templates", handlers.CreateJournalChecklistTemplate)
	api.DELETE("/journal-checklist-templates/:id", handlers.DeleteJournalChecklistTemplate)

	api.GET("/journals", handlers.GetUserJournals)
	api.POST("/journals", handlers.CreateJournal)
	api.PUT("/journals/:id", handlers.UpdateJournal)
	api.DELETE("/journals/:id", handlers.DeleteJournal)

	api.GET("/feed", handlers.GetNewsfeed)
	api.GET("/posts/:id", handlers.GetPost)
	api.POST("/posts", handlers.CreatePost)
	api.DELETE("/posts/:id/comments/:comment_id", handlers.DeleteComment)
	api.DELETE("/posts/:id", handlers.DeletePost)
	api.POST("/posts/:id/like", handlers.LikePost)
	api.DELETE("/posts/:id/like", handlers.UnlikePost)
	api.POST("/posts/:id/comments", handlers.AddComment)

	api.GET("/profile", handlers.GetProfile)
	api.PUT("/profile", handlers.UpdateProfile)
	api.GET("/users/:id", handlers.GetPublicUser)
	api.POST("/users/:id/expert-rating", handlers.SetExpertRating)
	api.POST("/follow/:id", handlers.FollowUser)
	api.DELETE("/follow/:id", handlers.UnfollowUser)

	api.GET("/notifications/unread-count", handlers.UnreadNotificationCount)
	api.GET("/notifications", handlers.ListNotifications)
	api.POST("/notifications/read-all", handlers.MarkAllNotificationsRead)
	api.POST("/notifications/:id/read", handlers.MarkNotificationRead)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("server on :%s", port)
	if err := e.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}
