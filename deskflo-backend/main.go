package main

import (
	"context"
	"fmt"
	"log"
	"net" // <-- IMPORT BARU UNTUK FUNGSI JARINGAN
	"net/http"
	"net/url"
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

// --- KONEKSI DATABASE (DENGAN MANUAL DNS RESOLVE) ---
func connectDB() *pgxpool.Pool {
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL tidak ditemukan di .env atau environment variable.")
	}

	// Parse URL untuk mengambil komponennya
	parsedUrl, err := url.Parse(dbUrl)
	if err != nil {
		log.Fatalf("Gagal mem-parsing DATABASE_URL: %v", err)
	}

	// Ambil hostname (tanpa port)
	hostname := parsedUrl.Hostname()
	log.Printf("Mencari alamat IP untuk host: %s\n", hostname)

	// Secara manual cari alamat IP dari hostname
	ips, err := net.LookupHost(hostname)
	if err != nil || len(ips) == 0 {
		log.Fatalf("Gagal melakukan DNS lookup untuk host %s: %v", hostname, err)
	}
	
	// Gunakan alamat IP pertama yang ditemukan
	ipAddress := ips[0]
	log.Printf("Host %s ditemukan di alamat IP: %s\n", hostname, ipAddress)

	// Buat config koneksi pgx
	config, err := pgxpool.ParseConfig(dbUrl)
	if err != nil {
		log.Fatalf("Gagal mem-parsing config dari DATABASE_URL: %v", err)
	}

	// Ganti hostname di config dengan IP yang sudah kita temukan
	// dan atur fungsi Dial kustom
	config.ConnConfig.Host = ipAddress
	config.ConnConfig.DialFunc = (&net.Dialer{
		Timeout:   30 * time.Second,
		KeepAlive: 5 * time.Minute,
	}).DialContext

	log.Printf("Mencoba koneksi ke IP: %s Port: %d\n", config.ConnConfig.Host, config.ConnConfig.Port)

	// Buat koneksi pool menggunakan config yang sudah dimodifikasi
	pool, err := pgxpool.ConnectConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Gagal terhubung ke database menggunakan IP: %v", err)
	}

	// Tes koneksi untuk memastikan pool valid
	err = pool.Ping(context.Background())
	if err != nil {
		log.Fatalf("Ping ke database gagal: %v", err)
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

	api := router.Group("/api")
	{
		adminRoutes := api.Group("/admin")
		{
			adminRoutes.GET("/requests", func(c *gin.Context) {
				getPendingRequests(c, dbPool)
			})
		}
	}

	log.Println("Server berjalan di http://localhost:8080")
	router.Run(":8080")
}

// --- HANDLER ---
func getPendingRequests(c *gin.Context, pool *pgxpool.Pool) {
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
