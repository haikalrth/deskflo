package handlers

import (
	"context"
	"deskflo-backend/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

func GetProgrammersHandler(c *gin.Context, pool *pgxpool.Pool) {
	nama := c.Query("nama")
	npm := c.Query("npm")
	status := c.Query("status")

	query := "SELECT id, nama_lengkap, npm, jurusan, role, status, created_at, updated_at FROM programmers WHERE 1=1"
	args := []interface{}{}
	argId := 1

	if nama != "" {
		query += " AND nama_lengkap ILIKE $" + string(argId)
		args = append(args, "%"+nama+"%")
		argId++
	}
	if npm != "" {
		query += " AND npm = $" + string(argId)
		args = append(args, npm)
		argId++
	}
	if status != "" {
		query += " AND status = $" + string(argId)
		args = append(args, status)
		argId++
	}

	rows, err := pool.Query(context.Background(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get data from database"})
		return
	}
	defer rows.Close()

	programmers := []models.Programmer{}
	for rows.Next() {
		var p models.Programmer
		if err := rows.Scan(&p.ID, &p.NamaLengkap, &p.NPM, &p.Jurusan, &p.Role, &p.Status, &p.CreatedAt, &p.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process data"})
			return
		}
		programmers = append(programmers, p)
	}

	c.JSON(http.StatusOK, programmers)
}

func CreateProgrammerHandler(c *gin.Context, pool *pgxpool.Pool) {
	var p models.Programmer
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		INSERT INTO programmers (nama_lengkap, npm, jurusan, role, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`
	err := pool.QueryRow(context.Background(), query, p.NamaLengkap, p.NPM, p.Jurusan, p.Role, p.Status, time.Now(), time.Now()).Scan(&p.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create programmer"})
		return
	}

	c.JSON(http.StatusCreated, p)
}

func UpdateProgrammerHandler(c *gin.Context, pool *pgxpool.Pool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var p models.Programmer
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		UPDATE programmers
		SET nama_lengkap = $1, npm = $2, jurusan = $3, role = $4, status = $5, updated_at = $6
		WHERE id = $7
	`
	_, err = pool.Exec(context.Background(), query, p.NamaLengkap, p.NPM, p.Jurusan, p.Role, p.Status, time.Now(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update programmer"})
		return
	}

	c.JSON(http.StatusOK, p)
}
