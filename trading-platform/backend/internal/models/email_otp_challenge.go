package models

import "time"

// EmailOTPChallenge stores a pending OTP for signup or password reset.
type EmailOTPChallenge struct {
	ID        uint      `gorm:"primaryKey"`
	Email     string    `gorm:"not null;size:100;uniqueIndex:idx_otp_email_purpose"`
	Purpose   string    `gorm:"not null;size:32;uniqueIndex:idx_otp_email_purpose"`
	CodeHash  string    `gorm:"not null;size:255"`
	Username  string    `gorm:"size:50"` // signup only
	ExpiresAt time.Time `gorm:"not null"`
	Attempts  int       `gorm:"not null;default:0"`
	CreatedAt time.Time
}
