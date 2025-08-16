package models

import "time"

type Programmer struct {
	ID          int       `json:"id"`
	NamaLengkap string    `json:"nama_lengkap"`
	NPM         string    `json:"npm"`
	Jurusan     string    `json:"jurusan"`
	Role        string    `json:"role"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
