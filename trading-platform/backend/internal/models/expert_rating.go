package models

import "time"

// ExpertRating is one user's score (1–5) for another user as "expert".
type ExpertRating struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ExpertID  uint      `gorm:"not null;uniqueIndex:ux_expert_rater" json:"expert_id"`
	RaterID   uint      `gorm:"not null;uniqueIndex:ux_expert_rater" json:"rater_id"`
	Score     int       `gorm:"not null" json:"score"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
