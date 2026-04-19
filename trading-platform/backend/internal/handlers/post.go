package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"trading-platform/internal/database"
	"trading-platform/internal/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func postIsAnalysis(analysisType string) bool {
	return strings.ToLower(strings.TrimSpace(analysisType)) != "news"
}

func feedSortKeys(post models.Post) (ia int, ex float64) {
	if postIsAnalysis(post.AnalysisType) {
		return 1, post.User.ExpertRatingAvg
	}
	return 0, 0
}

func GetNewsfeed(c echo.Context) error {
	userID := c.Get("user_id").(uint)

	const pageSize = 20
	var afterID uint
	if s := c.QueryParam("after_id"); s != "" {
		v, err := strconv.ParseUint(s, 10, 32)
		if err != nil || v == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid after_id"})
		}
		afterID = uint(v)
	}

	const iaExpr = `CASE WHEN LOWER(TRIM(COALESCE(posts.analysis_type, ''))) = 'news' THEN 0 ELSE 1 END`
	const exExpr = `CASE WHEN LOWER(TRIM(COALESCE(posts.analysis_type, ''))) = 'news' THEN 0 ELSE COALESCE(feed_author.expert_rating_avg, 0) END`

	q := database.DB.Preload("User").Model(&models.Post{}).
		Joins("LEFT JOIN users AS feed_author ON feed_author.id = posts.user_id").
		Order(iaExpr + " DESC").
		Order(exExpr + " DESC").
		Order("posts.created_at DESC, posts.id DESC").
		Limit(pageSize + 1)

	if afterID > 0 {
		var cursor models.Post
		if err := database.DB.Preload("User").Where("id = ?", afterID).First(&cursor).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid cursor"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not load feed"})
		}
		iaC, exC := feedSortKeys(cursor)
		q = q.Where(`(
  (`+iaExpr+`) < ? OR (
    (`+iaExpr+`) = ? AND (`+exExpr+`) < ? OR (
      (`+iaExpr+`) = ? AND (`+exExpr+`) = ? AND (
        posts.created_at < ? OR (posts.created_at = ? AND posts.id < ?)
      )
    )
  )
)`, iaC, iaC, exC, iaC, exC, cursor.CreatedAt, cursor.CreatedAt, cursor.ID)
	}

	var posts []models.Post
	if err := q.Find(&posts).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not load feed"})
	}

	hasMore := len(posts) > pageSize
	if hasMore {
		posts = posts[:pageSize]
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

	return c.JSON(http.StatusOK, map[string]any{
		"items":    posts,
		"has_more": hasMore,
	})
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

	var post models.Post
	if err := database.DB.Select("id", "user_id").First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "post not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not load post"})
	}

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
	if post.UserID != userID {
		var actor models.User
		if err := database.DB.Select("username").First(&actor, userID).Error; err == nil {
			pid := postID
			enqueueNotification(post.UserID, "like", fmt.Sprintf("%s đã thích bài viết của bạn", actor.Username), userID, &pid)
		}
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

	var post models.Post
	if err := database.DB.First(&post, postID).Error; err != nil {
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
	if post.UserID != userID {
		var actor models.User
		if err := database.DB.Select("username").First(&actor, userID).Error; err == nil {
			pid := postID
			enqueueNotification(post.UserID, "comment", fmt.Sprintf("%s đã bình luận bài viết của bạn", actor.Username), userID, &pid)
		}
	}
	return c.JSON(http.StatusCreated, comment)
}

func DeleteComment(c echo.Context) error {
	postID64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	postID := uint(postID64)
	commentID64, err := strconv.ParseUint(c.Param("comment_id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid comment id"})
	}
	commentID := uint(commentID64)
	userID := c.Get("user_id").(uint)

	var com models.Comment
	if err := database.DB.Where("id = ? AND post_id = ?", commentID, postID).First(&com).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "comment not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not load comment"})
	}
	if com.UserID != userID {
		return c.JSON(http.StatusForbidden, map[string]string{"error": "forbidden"})
	}

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&models.Comment{}, com.ID).Error; err != nil {
			return err
		}
		var n int64
		if err := tx.Model(&models.Comment{}).Where("post_id = ?", postID).Count(&n).Error; err != nil {
			return err
		}
		return tx.Model(&models.Post{}).Where("id = ?", postID).Update("comments_count", n).Error
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not delete comment"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}

func DeletePost(c echo.Context) error {
	postID64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	postID := uint(postID64)
	userID := c.Get("user_id").(uint)

	var post models.Post
	if err := database.DB.Where("id = ? AND user_id = ?", postID, userID).First(&post).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "post not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not load post"})
	}

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("post_id = ?", postID).Delete(&models.Like{}).Error; err != nil {
			return err
		}
		if err := tx.Where("post_id = ?", postID).Delete(&models.Comment{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.Post{}, postID).Error
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not delete post"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}
