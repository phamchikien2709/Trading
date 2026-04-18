package handlers

import (
	"net/http"
	"strconv"

	"trading-platform/internal/database"
	"trading-platform/internal/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetNewsfeed(c echo.Context) error {
	userID := c.Get("user_id").(uint)

	followed := database.DB.Model(&models.Follow{}).
		Select("user_id").
		Where("follower_id = ?", userID)

	var posts []models.Post
	q := database.DB.Preload("User").
		Where("user_id = ? OR user_id IN (?)", userID, followed).
		Order("created_at DESC").
		Limit(20)

	if err := q.Find(&posts).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not load feed"})
	}
	if len(posts) > 0 {
		ids := make([]uint, len(posts))
		for i := range posts {
			ids[i] = posts[i].ID
		}
		var likedIDs []uint
		database.DB.Model(&models.Like{}).
			Where("user_id = ? AND post_id IN ?", userID, ids).
			Pluck("post_id", &likedIDs)
		liked := make(map[uint]bool, len(likedIDs))
		for _, id := range likedIDs {
			liked[id] = true
		}
		for i := range posts {
			posts[i].LikedByMe = liked[posts[i].ID]
		}
	}
	return c.JSON(http.StatusOK, posts)
}

func GetPost(c echo.Context) error {
	userID := c.Get("user_id").(uint)
	postID64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	postID := uint(postID64)

	var post models.Post
	if err := database.DB.Preload("User").
		Preload("Comments", func(db *gorm.DB) *gorm.DB {
			return db.Order("comments.created_at ASC").Preload("User")
		}).
		Where("id = ?", postID).
		First(&post).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "post not found"})
	}
	var n int64
	database.DB.Model(&models.Like{}).Where("user_id = ? AND post_id = ?", userID, postID).Count(&n)
	post.LikedByMe = n > 0
	return c.JSON(http.StatusOK, post)
}

func CreatePost(c echo.Context) error {
	userID := c.Get("user_id").(uint)
	var post models.Post
	if err := c.Bind(&post); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	post.UserID = userID
	post.LikesCount = 0
	post.CommentsCount = 0
	if post.AnalysisType == "" {
		post.AnalysisType = "technical"
	}
	if err := database.DB.Create(&post).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not create post"})
	}
	database.DB.Preload("User").First(&post, post.ID)
	return c.JSON(http.StatusCreated, post)
}

func LikePost(c echo.Context) error {
	postID64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	postID := uint(postID64)
	userID := c.Get("user_id").(uint)

	var exists int64
	database.DB.Model(&models.Like{}).Where("user_id = ? AND post_id = ?", userID, postID).Count(&exists)
	if exists > 0 {
		return c.JSON(http.StatusConflict, map[string]string{"error": "already liked"})
	}

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&models.Like{UserID: userID, PostID: postID}).Error; err != nil {
			return err
		}
		return tx.Model(&models.Post{}).Where("id = ?", postID).
			UpdateColumn("likes_count", gorm.Expr("likes_count + 1")).Error
	})
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "already liked"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "liked successfully"})
}

func UnlikePost(c echo.Context) error {
	postID64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	postID := uint(postID64)
	userID := c.Get("user_id").(uint)

	res := database.DB.Where("user_id = ? AND post_id = ?", userID, postID).Delete(&models.Like{})
	if res.RowsAffected == 0 {
		return c.JSON(http.StatusOK, map[string]string{"message": "not liked"})
	}
	database.DB.Model(&models.Post{}).Where("id = ? AND likes_count > ?", postID, 0).
		UpdateColumn("likes_count", gorm.Expr("likes_count - 1"))
	return c.JSON(http.StatusOK, map[string]string{"message": "unliked successfully"})
}

func AddComment(c echo.Context) error {
	postID64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	postID := uint(postID64)
	userID := c.Get("user_id").(uint)

	var req struct {
		Content  string `json:"content"`
		ParentID *uint  `json:"parent_id"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if req.Content == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "content required"})
	}

	if err := database.DB.First(&models.Post{}, postID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "post not found"})
	}

	comment := models.Comment{
		PostID:   postID,
		UserID:   userID,
		ParentID: req.ParentID,
		Content:  req.Content,
	}

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&comment).Error; err != nil {
			return err
		}
		return tx.Model(&models.Post{}).Where("id = ?", postID).
			UpdateColumn("comments_count", gorm.Expr("comments_count + 1")).Error
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not add comment"})
	}
	database.DB.Preload("User").First(&comment, comment.ID)
	return c.JSON(http.StatusCreated, comment)
}
