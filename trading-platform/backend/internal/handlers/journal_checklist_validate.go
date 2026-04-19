package handlers

import (
	"encoding/json"
	"errors"
	"strings"

	"trading-platform/internal/database"
	"trading-platform/internal/models"

	"gorm.io/datatypes"
)

type checklistDefItem struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type checklistSnapItem struct {
	ID      string `json:"id"`
	Label   string `json:"label"`
	Checked bool   `json:"checked"`
}

func parseTemplateDefItems(raw datatypes.JSON) ([]checklistDefItem, error) {
	if len(raw) == 0 {
		return nil, errors.New("checklist không có rule")
	}
	var items []checklistDefItem
	if err := json.Unmarshal(raw, &items); err != nil {
		return nil, errors.New("checklist template không hợp lệ")
	}
	if len(items) == 0 {
		return nil, errors.New("checklist phải có ít nhất một rule")
	}
	for i := range items {
		items[i].Label = strings.TrimSpace(items[i].Label)
		items[i].ID = strings.TrimSpace(items[i].ID)
		if items[i].ID == "" || items[i].Label == "" {
			return nil, errors.New("mỗi rule cần id và nội dung")
		}
	}
	return items, nil
}

func parseSnapshotItems(raw datatypes.JSON) ([]checklistSnapItem, error) {
	if len(raw) == 0 {
		return nil, errors.New("thiếu checklist_snapshot")
	}
	var items []checklistSnapItem
	if err := json.Unmarshal(raw, &items); err != nil {
		return nil, errors.New("checklist_snapshot không hợp lệ")
	}
	if len(items) == 0 {
		return nil, errors.New("checklist_snapshot rỗng")
	}
	for i := range items {
		items[i].Label = strings.TrimSpace(items[i].Label)
		items[i].ID = strings.TrimSpace(items[i].ID)
	}
	return items, nil
}

// normalizeChecklistAgainstTemplate loads the template for this user, verifies the snapshot
// matches every rule (id + label) and is fully checked; returns canonical JSON for storage.
func normalizeChecklistAgainstTemplate(userID uint, templateID uint, snapshot datatypes.JSON) (datatypes.JSON, error) {
	var tpl models.JournalChecklistTemplate
	if err := database.DB.Where("id = ? AND user_id = ?", templateID, userID).First(&tpl).Error; err != nil {
		return nil, errors.New("không tìm thấy checklist")
	}
	defs, err := parseTemplateDefItems(tpl.Items)
	if err != nil {
		return nil, err
	}
	snaps, err := parseSnapshotItems(snapshot)
	if err != nil {
		return nil, err
	}
	if len(snaps) != len(defs) {
		return nil, errors.New("checklist không khớp template")
	}
	for i := range defs {
		if snaps[i].ID != defs[i].ID || snaps[i].Label != defs[i].Label {
			return nil, errors.New("checklist không khớp template")
		}
		if !snaps[i].Checked {
			return nil, errors.New("phải tick đủ mọi rule trước khi lưu")
		}
	}
	out, err := json.Marshal(snaps)
	if err != nil {
		return nil, err
	}
	return datatypes.JSON(out), nil
}
