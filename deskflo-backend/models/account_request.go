package models

import "time"

// AccountRequest merepresentasikan model data untuk permintaan akun.
type AccountRequest struct {
	ID          int64     `json:"id"`
	NamaLengkap string    `json:"nama_lengkap"`
	NPM         string    `json:"npm"`
	Jurusan     string    `json:"jurusan"`
	Email       string    `json:"email"`
	Status      string    `json:"status"`
	RequestedAt time.Time `json:"requested_at"`
}
