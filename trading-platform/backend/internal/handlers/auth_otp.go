package handlers

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strings"
	"time"

	"trading-platform/internal/database"
	"trading-platform/internal/mail"
	"trading-platform/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

const (
	otpPurposeSignup        = "signup"
	otpPurposePasswordReset = "password_reset"
	audSignupComplete       = "signup_complete"
	audPasswordReset        = "password_reset"
	otpTTL                  = 10 * time.Minute
	setupTokenTTL           = 15 * time.Minute
	maxOTPAttempts          = 6
)

type signupRequestOTPBody struct {
	Email    string `json:"email"`
	Username string `json:"username"`
}

type verifyOTPBody struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

type signupCompleteBody struct {
	SetupToken string `json:"setup_token"`
	Password   string `json:"password"`
}

type passwordResetRequestBody struct {
	Email string `json:"email"`
}

type passwordResetCompleteBody struct {
	SetupToken string `json:"setup_token"`
	Password   string `json:"password"`
}

func randomOTP6() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func jwtSecret() (string, error) {
	s := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if s == "" {
		return "", fmt.Errorf("missing JWT_SECRET")
	}
	return s, nil
}

func signSetupToken(aud string, email string, username string) (string, error) {
	secret, err := jwtSecret()
	if err != nil {
		return "", err
	}
	claims := jwt.MapClaims{
		"aud": aud,
		"exp": time.Now().Add(setupTokenTTL).Unix(),
		"iat": time.Now().Unix(),
		"sub": strings.ToLower(strings.TrimSpace(email)),
	}
	if username != "" {
		claims["username"] = strings.TrimSpace(username)
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(secret))
}

func parseSetupToken(tokenStr, expectedAud string) (email string, username string, err error) {
	secret, err := jwtSecret()
	if err != nil {
		return "", "", err
	}
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return "", "", fmt.Errorf("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", fmt.Errorf("invalid claims")
	}
	if claims["aud"] != expectedAud {
		return "", "", fmt.Errorf("wrong audience")
	}
	sub, _ := claims["sub"].(string)
	if sub == "" {
		return "", "", fmt.Errorf("missing sub")
	}
	un, _ := claims["username"].(string)
	return strings.ToLower(strings.TrimSpace(sub)), strings.TrimSpace(un), nil
}

func issueOTPChallenge(email, purpose, username string) (plain string, err error) {
	plain, err = randomOTP6()
	if err != nil {
		return "", err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.MinCost)
	if err != nil {
		return "", err
	}
	if err := database.DB.Where("email = ? AND purpose = ?", email, purpose).Delete(&models.EmailOTPChallenge{}).Error; err != nil {
		return "", err
	}
	ch := models.EmailOTPChallenge{
		Email:     email,
		Purpose:   purpose,
		CodeHash:  string(hash),
		Username:  strings.TrimSpace(username),
		ExpiresAt: time.Now().Add(otpTTL),
		Attempts:  0,
	}
	if err := database.DB.Create(&ch).Error; err != nil {
		return "", err
	}
	return plain, nil
}

// SignupRequestOTP sends a signup OTP after validating email and username availability.
func SignupRequestOTP(c echo.Context) error {
	var body signupRequestOTPBody
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "payload không hợp lệ"})
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	username := strings.TrimSpace(body.Username)
	if username == "" || len(username) < 2 || email == "" || !strings.Contains(email, "@") {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "email hoặc tên không hợp lệ"})
	}

	var existing models.User
	if err := database.DB.Where("email = ?", email).First(&existing).Error; err == nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "email đã được sử dụng"})
	}
	if err := database.DB.Where("username = ?", username).First(&existing).Error; err == nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "tên đăng nhập đã được sử dụng"})
	}

	plain, err := issueOTPChallenge(email, otpPurposeSignup, username)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "không thể tạo mã OTP"})
	}
	subject := "Mã xác nhận đăng ký"
	msg := fmt.Sprintf("Chào %s,\n\nMã OTP của bạn là: %s\nCó hiệu lực trong %d phút.\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.\n", username, plain, int(otpTTL.Minutes()))
	if err := mail.SendPlain(email, subject, msg); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "không thể gửi email"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "đã gửi OTP"})
}

// SignupVerifyOTP checks the signup OTP and returns a short-lived setup token.
func SignupVerifyOTP(c echo.Context) error {
	var body verifyOTPBody
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "payload không hợp lệ"})
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	code := strings.TrimSpace(body.Code)
	if email == "" || len(code) < 4 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "thông tin không hợp lệ"})
	}

	var ch models.EmailOTPChallenge
	if err := database.DB.Where("email = ? AND purpose = ?", email, otpPurposeSignup).First(&ch).Error; err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "mã OTP không đúng hoặc đã hết hạn"})
	}
	if time.Now().After(ch.ExpiresAt) {
		_ = database.DB.Delete(&ch).Error
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "mã OTP không đúng hoặc đã hết hạn"})
	}
	if ch.Attempts >= maxOTPAttempts {
		return c.JSON(http.StatusTooManyRequests, map[string]string{"error": "quá nhiều lần thử, vui lòng gửi lại mã"})
	}
	if bcrypt.CompareHashAndPassword([]byte(ch.CodeHash), []byte(code)) != nil {
		_ = database.DB.Model(&ch).Update("attempts", ch.Attempts+1).Error
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "mã OTP không đúng"})
	}
	username := ch.Username
	_ = database.DB.Delete(&ch).Error

	token, err := signSetupToken(audSignupComplete, email, username)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "lỗi máy chủ"})
	}
	return c.JSON(http.StatusOK, map[string]any{"setup_token": token})
}

// SignupComplete creates the user using a valid setup token and password.
func SignupComplete(c echo.Context) error {
	var body signupCompleteBody
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "payload không hợp lệ"})
	}
	email, username, err := parseSetupToken(strings.TrimSpace(body.SetupToken), audSignupComplete)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "phiên đặt mật khẩu hết hạn, vui lòng bắt đầu lại"})
	}
	if len(strings.TrimSpace(body.Password)) < 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "mật khẩu tối thiểu 6 ký tự"})
	}
	if username == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "phiên không hợp lệ"})
	}

	var existing models.User
	if err := database.DB.Where("email = ? OR username = ?", email, username).First(&existing).Error; err == nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "tài khoản đã tồn tại"})
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "không thể lưu mật khẩu"})
	}
	user := models.User{Username: username, Email: email, PasswordHash: string(hash)}
	if err := database.DB.Create(&user).Error; err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "không thể tạo tài khoản"})
	}
	return c.JSON(http.StatusCreated, map[string]any{
		"message": "đã tạo tài khoản",
		"user_id": user.ID,
	})
}

// PasswordResetRequestOTP emails an OTP if the account exists (same response otherwise).
func PasswordResetRequestOTP(c echo.Context) error {
	var body passwordResetRequestBody
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "payload không hợp lệ"})
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if email == "" || !strings.Contains(email, "@") {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "email không hợp lệ"})
	}

	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		// Do not reveal whether email is registered.
		return c.JSON(http.StatusOK, map[string]string{"message": "nếu email tồn tại, bạn sẽ nhận được mã OTP"})
	}

	plain, err := issueOTPChallenge(email, otpPurposePasswordReset, "")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "không thể tạo mã OTP"})
	}
	subject := "Mã đặt lại mật khẩu"
	msg := fmt.Sprintf("Mã OTP đặt lại mật khẩu của bạn là: %s\nCó hiệu lực trong %d phút.\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.\n", plain, int(otpTTL.Minutes()))
	if err := mail.SendPlain(email, subject, msg); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "không thể gửi email"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "nếu email tồn tại, bạn sẽ nhận được mã OTP"})
}

// PasswordResetVerifyOTP validates OTP and returns a setup token.
func PasswordResetVerifyOTP(c echo.Context) error {
	var body verifyOTPBody
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "payload không hợp lệ"})
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	code := strings.TrimSpace(body.Code)
	if email == "" || len(code) < 4 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "thông tin không hợp lệ"})
	}

	var ch models.EmailOTPChallenge
	if err := database.DB.Where("email = ? AND purpose = ?", email, otpPurposePasswordReset).First(&ch).Error; err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "mã OTP không đúng hoặc đã hết hạn"})
	}
	if time.Now().After(ch.ExpiresAt) {
		_ = database.DB.Delete(&ch).Error
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "mã OTP không đúng hoặc đã hết hạn"})
	}
	if ch.Attempts >= maxOTPAttempts {
		return c.JSON(http.StatusTooManyRequests, map[string]string{"error": "quá nhiều lần thử, vui lòng gửi lại mã"})
	}
	if bcrypt.CompareHashAndPassword([]byte(ch.CodeHash), []byte(code)) != nil {
		_ = database.DB.Model(&ch).Update("attempts", ch.Attempts+1).Error
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "mã OTP không đúng"})
	}
	_ = database.DB.Delete(&ch).Error

	token, err := signSetupToken(audPasswordReset, email, "")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "lỗi máy chủ"})
	}
	return c.JSON(http.StatusOK, map[string]any{"setup_token": token})
}

// PasswordResetComplete updates password using a valid setup token.
func PasswordResetComplete(c echo.Context) error {
	var body passwordResetCompleteBody
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "payload không hợp lệ"})
	}
	email, _, err := parseSetupToken(strings.TrimSpace(body.SetupToken), audPasswordReset)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "phiên đặt mật khẩu hết hạn, vui lòng bắt đầu lại"})
	}
	if len(strings.TrimSpace(body.Password)) < 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "mật khẩu tối thiểu 6 ký tự"})
	}

	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "không tìm thấy tài khoản"})
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "không thể lưu mật khẩu"})
	}
	if err := database.DB.Model(&user).Update("password_hash", string(hash)).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "cập nhật thất bại"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "đã đặt lại mật khẩu"})
}
