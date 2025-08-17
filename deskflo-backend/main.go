package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/joho/godotenv"
)

// --- MODEL ---
type AccountRequest struct {
	ID          int64     `json:"id"`
	NamaLengkap string    `json:"nama_lengkap"`
	NPM         string    `json:"npm"`
	Jurusan     string    `json:"jurusan"`
	Email       string    `json:"email"`
	Status      string    `json:"status"`
	RequestedAt time.Time `json:"requested_at"`
}

// --- KONEKSI DATABASE (VERSI SEDERHANA & FINAL) ---
func connectDB() *pgxpool.Pool {
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL tidak ditemukan di .env atau environment variable.")
	}

	log.Println("Mencoba koneksi dengan URL:", dbUrl)

	// Menggunakan metode koneksi yang paling dasar dan standar.
	// Parameter ?sslmode=require di .env akan ditangani secara otomatis.
	pool, err := pgxpool.Connect(context.Background(), dbUrl)
	if err != nil {
		log.Fatalf("Gagal koneksi ke database: %v\n", err)
	}

	// Tes koneksi untuk memastikan pool valid
	err = pool.Ping(context.Background())
	if err != nil {
		log.Fatalf("Ping ke database gagal: %v\n", err)
	}

	fmt.Println("Sukses terhubung ke database Supabase!")
	return pool
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Peringatan: Tidak dapat menemukan file .env, menggunakan environment variable sistem")
	}

	dbPool := connectDB()
	defer dbPool.Close()

	router := gin.Default()

	// Middleware CORS untuk mengizinkan koneksi dari frontend
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := router.Group("/api")
	{
		adminRoutes := api.Group("/admin")
		{
			adminRoutes.GET("/requests", getPendingRequests(dbPool))
		}
	}

	log.Println("Server berjalan di http://localhost:8080")
	router.Run(":8080")
}

// --- HANDLER ---
func getPendingRequests(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var requests []AccountRequest

		rows, err := pool.Query(context.Background(), "SELECT id, nama_lengkap, npm, jurusan, email, status, requested_at FROM public.account_requests WHERE status = 'pending' ORDER BY requested_at ASC")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data dari database"})
			log.Printf("Error querying database: %v\n", err)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var req AccountRequest
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
}
