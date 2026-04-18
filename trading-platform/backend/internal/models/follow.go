package models

import "time"

// Follow maps to table "followers": user_id is followed account, follower_id is who follows.
type Follow struct {
	UserID     uint      `gorm:"primaryKey;column:user_id" json:"user_id"`
	FollowerID uint      `gorm:"primaryKey;column:follower_id" json:"follower_id"`
	CreatedAt  time.Time `json:"created_at"`
}

func (Follow) TableName() string {
	return "followers"
}
