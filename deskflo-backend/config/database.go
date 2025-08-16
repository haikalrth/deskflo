package config

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v4/pgxpool"
)

// ConnectDB membuat dan mengembalikan koneksi pool ke database.
func ConnectDB() *pgxpool.Pool {
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL environment variable not set")
		os.Exit(1)
	}

	pool, err := pgxpool.Connect(context.Background(), dbUrl)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Gagal koneksi ke database: %v\n", err)
		os.Exit(1)
	}

	err = pool.Ping(context.Background())
	if err != nil {
		fmt.Fprintf(os.Stderr, "Ping ke database gagal: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Sukses terhubung ke database Supabase!")
	return pool
}
