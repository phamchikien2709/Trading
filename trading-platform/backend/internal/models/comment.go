package models

import "time"

type Comment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	PostID    uint      `gorm:"index;not null" json:"post_id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	ParentID  *uint     `gorm:"index" json:"parent_id"`
	Content   string    `gorm:"not null" json:"content"`
	CreatedAt time.Time `json:"created_at"`

	User User `json:"user,omitempty"`
}
