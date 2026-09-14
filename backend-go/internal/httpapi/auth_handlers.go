package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"stocky/backend-go/internal/auth"
	"stocky/backend-go/internal/models"
	"stocky/backend-go/internal/store"
)

type signupRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type authResponse struct {
	AccessToken  string      `json:"accessToken"`
	RefreshToken string      `json:"refreshToken"`
	User         models.User `json:"user"`
}

func (s *Server) issueTokenPair(w http.ResponseWriter, user models.User) {
	accessToken, _, err := s.Tokens.IssueAccessToken(user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to issue access token")
		return
	}

	refreshPlain, refreshHash, err := auth.GenerateRefreshToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to issue refresh token")
		return
	}
	expiresAt := time.Now().Add(auth.RefreshTokenTTL)
	if err := s.Store.SaveRefreshToken(user.ID, refreshHash, expiresAt); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to persist refresh token")
		return
	}

	writeJSON(w, http.StatusOK, authResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshPlain,
		User:         user,
	})
}

func (s *Server) handleSignup(w http.ResponseWriter, r *http.Request) {
	var req signupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" || len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "email is required and password must be at least 8 characters")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	user, err := s.Store.CreateUser(req.Email, hash, req.DisplayName)
	if err == store.ErrDuplicate {
		writeError(w, http.StatusConflict, "an account with this email already exists")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create account")
		return
	}

	s.issueTokenPair(w, user)
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	user, passwordHash, err := s.Store.GetUserByEmail(req.Email)
	if err == store.ErrNotFound || !auth.CheckPassword(passwordHash, req.Password) {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to look up account")
		return
	}

	s.issueTokenPair(w, user)
}

func (s *Server) handleRefresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.RefreshToken == "" {
		writeError(w, http.StatusBadRequest, "refreshToken is required")
		return
	}

	userID, err := s.Store.ConsumeRefreshToken(req.RefreshToken)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	user, err := s.Store.GetUserByID(userID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "account no longer exists")
		return
	}

	s.issueTokenPair(w, user)
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err == nil && req.RefreshToken != "" {
		_ = s.Store.RevokeRefreshToken(req.RefreshToken)
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "logged out"})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	user, err := s.Store.GetUserByID(userIDFromContext(r))
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, user)
}
