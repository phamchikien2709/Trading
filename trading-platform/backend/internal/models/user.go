package models

import "time"

type User struct {
	ID                 uint    `gorm:"primaryKey" json:"id"`
	Username           string  `gorm:"uniqueIndex;not null;size:50" json:"username"`
	Email              string  `gorm:"uniqueIndex;not null;size:100" json:"email"`
	PasswordHash       string  `gorm:"not null;size:255" json:"-"`
	AvatarURL          string  `json:"avatar_url"`
	Bio                string  `json:"bio"`
	ExpertRatingAvg    float64 `gorm:"type:double precision;default:0" json:"expert_rating_avg"`
	ExpertRatingCount  int     `gorm:"default:0" json:"expert_rating_count"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	Journals []TradingJournal `json:"journals,omitempty"`
	Posts    []Post           `json:"posts,omitempty"`
}
