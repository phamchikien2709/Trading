package models

import (
	"time"

	"github.com/lib/pq"
)

type Post struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	UserID        uint           `gorm:"index;not null" json:"user_id"`
	Content       string         `gorm:"not null" json:"content"`
	ChartImageURL string         `json:"chart_image_url"`
	Symbols       pq.StringArray `gorm:"type:text[]" json:"symbols"`
	Timeframe     string         `gorm:"size:20" json:"timeframe"`
	AnalysisType  string         `gorm:"size:20;default:technical" json:"analysis_type"`
	LikesCount    int            `gorm:"default:0" json:"likes_count"`
	CommentsCount int            `gorm:"default:0" json:"comments_count"`
	CreatedAt     time.Time      `gorm:"index" json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`

	User     User      `json:"user,omitempty"`
	Comments []Comment `json:"comments,omitempty"`

	LikedByMe bool `json:"liked_by_me,omitempty" gorm:"-"`
}
