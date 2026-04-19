package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// JournalChecklistTemplate is a user-defined rule list applied before logging a trade.
// Immutable after create; Delete is soft (deleted_at) via GORM.
type JournalChecklistTemplate struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"index;not null" json:"user_id"`
	Name      string         `gorm:"not null;size:160" json:"name"`
	Items     datatypes.JSON `gorm:"type:jsonb;not null" json:"items"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
