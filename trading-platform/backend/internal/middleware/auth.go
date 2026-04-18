package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

func AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		auth := c.Request().Header.Get("Authorization")
		if auth == "" {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "missing token"})
		}
		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		if tokenStr == auth {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "missing bearer prefix"})
		}

		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if err != nil || !token.Valid {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid token"})
		}

		raw, ok := claims["user_id"]
		if !ok {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid token claims"})
		}
		var uid uint
		switch v := raw.(type) {
		case float64:
			uid = uint(v)
		default:
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid user id"})
		}

		c.Set("user_id", uid)
		return next(c)
	}
}
