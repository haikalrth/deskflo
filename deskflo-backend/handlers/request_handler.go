package handlers

import (
	"context"
	"deskflo-backend/models"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

// GetPendingRequests mengambil semua permintaan akun dengan status 'pending'.
func GetPendingRequests(c *gin.Context, pool *pgxpool.Pool) {
	var requests []models.AccountRequest

	rows, err := pool.Query(context.Background(), "SELECT id, nama_lengkap, npm, jurusan, email, status, requested_at FROM public.account_requests WHERE status = 'pending' ORDER BY requested_at ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data dari database"})
		log.Printf("Error querying database: %v\n", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var req models.AccountRequest
		err := rows.Scan(&req.ID, &req.NamaLengkap, &req.NPM, &req.Jurusan, &req.Email, &req.Status, &req.RequestedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses data"})
			log.Printf("Error scanning row: %v\n", err)
			return
		}
		requests = append(requests, req)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Terjadi kesalahan saat membaca data"})
		log.Printf("Error during rows iteration: %v\n", err)
		return
	}

	c.JSON(http.StatusOK, requests)
}

// UpdateRequestStatus mengubah status permintaan akun (approved/rejected).
func UpdateRequestStatus(c *gin.Context, pool *pgxpool.Pool, newStatus string) {
	// Ambil ID dari URL parameter
	id := c.Param("id")

	// Validasi status baru
	if newStatus != "approved" && newStatus != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid"})
		return
	}

	// Eksekusi perintah UPDATE di database
	commandTag, err := pool.Exec(context.Background(), "UPDATE public.account_requests SET status = $1 WHERE id = $2", newStatus, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status permintaan"})
		log.Printf("Error updating request status: %v\n", err)
		return
	}

	// Cek apakah ada baris yang terpengaruh
	if commandTag.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Permintaan tidak ditemukan"})
		return
	}

	// Beri respon sukses
	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Permintaan berhasil diubah menjadi %s", newStatus)})
}
