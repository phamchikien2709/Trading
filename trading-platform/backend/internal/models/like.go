package models

import "time"

type Like struct {
	UserID    uint      `gorm:"primaryKey" json:"user_id"`
	PostID    uint      `gorm:"primaryKey;index" json:"post_id"`
	CreatedAt time.Time `json:"created_at"`
}
