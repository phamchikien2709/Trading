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

	e.POST("/api/register", handlers.Register)
	e.POST("/api/login", handlers.Login)

	api := e.Group("/api")
	api.Use(authmw.AuthMiddleware)
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
	api.POST("/follow/:id", handlers.FollowUser)
	api.DELETE("/follow/:id", handlers.UnfollowUser)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("server on :%s", port)
	if err := e.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}
