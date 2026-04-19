package database

import (
	"fmt"
	"log"
	"os"

	"trading-platform/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal("failed to connect database:", err)
	}

	if err := DB.AutoMigrate(
		&models.User{},
		&models.EmailOTPChallenge{},
		&models.ExpertRating{},
		&models.JournalChecklistTemplate{},
		&models.TradingJournal{},
		&models.Post{},
		&models.Comment{},
		&models.Like{},
		&models.Follow{},
		&models.Notification{},
	); err != nil {
		log.Fatal("auto migrate:", err)
	}

	log.Println("database connected and migrated")
}
