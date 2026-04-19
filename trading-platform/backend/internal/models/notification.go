package models

import "time"

// Notification is an in-app message for user_id (recipient).
type Notification struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"index;not null" json:"user_id"`
	Type      string     `gorm:"size:24;not null;index" json:"type"`
	Body      string     `gorm:"size:500;not null" json:"body"`
	ActorID   *uint      `gorm:"index" json:"actor_id,omitempty"`
	PostID    *uint      `gorm:"index" json:"post_id,omitempty"`
	ReadAt    *time.Time `json:"read_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`

	Actor *User `json:"actor,omitempty" gorm:"foreignKey:ActorID"`
}
