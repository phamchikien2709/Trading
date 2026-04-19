package models

import (
	"time"

	"gorm.io/datatypes"
)

type TradingJournal struct {
	ID                  uint           `gorm:"primaryKey" json:"id"`
	UserID              uint           `gorm:"index;not null" json:"user_id"`
	Symbol              string         `gorm:"not null;size:20" json:"symbol"`
	Direction           string         `gorm:"size:5" json:"direction"` // LONG or SHORT (SHORT is 5 runes)
	EntryPrice          float64        `gorm:"not null" json:"entry_price"`
	ExitPrice           float64        `json:"exit_price"`
	Volume              int            `gorm:"not null" json:"volume"`
	PnL                 float64        `json:"pnl"`
	ScreenshotURL       string         `json:"screenshot_url"`
	Notes               string         `json:"notes"`
	TradedAt            time.Time      `gorm:"index;not null" json:"traded_at"`
	ChecklistTemplateID *uint          `gorm:"index" json:"checklist_template_id,omitempty"`
	ChecklistSnapshot   datatypes.JSON `gorm:"type:jsonb" json:"checklist_snapshot,omitempty"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
}
