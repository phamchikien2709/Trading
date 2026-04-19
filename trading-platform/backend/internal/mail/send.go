package mail

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
)

// SendPlain sends a plain-text email. If SMTP_HOST is empty, logs the body (dev).
func SendPlain(to, subject, body string) error {
	host := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	if host == "" {
		log.Printf("[mail:dev] to=%s subject=%s\n%s", to, subject, body)
		return nil
	}

	port := strings.TrimSpace(os.Getenv("SMTP_PORT"))
	if port == "" {
		port = "587"
	}
	from := strings.TrimSpace(os.Getenv("SMTP_FROM"))
	if from == "" {
		from = "noreply@localhost"
	}

	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASSWORD")
	addr := fmt.Sprintf("%s:%s", host, port)

	msg := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s\r\n",
		from, to, subject, body))

	var auth smtp.Auth
	if user != "" {
		auth = smtp.PlainAuth("", user, pass, host)
	}
	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}
