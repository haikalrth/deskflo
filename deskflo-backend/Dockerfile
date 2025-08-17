# Gunakan image Go resmi sebagai dasar
FROM golang:1.21-alpine

# Atur direktori kerja di dalam container
WORKDIR /app

# Salin file go.mod dan go.sum untuk mengunduh dependensi
COPY go.mod go.sum ./
RUN go mod download

# Salin sisa kode sumber aplikasi
COPY . .

# Build aplikasi Go menjadi satu file executable
RUN go build -o /deskflo-backend .

# Buka port 8080 agar bisa diakses dari luar container
EXPOSE 8080

# Perintah untuk menjalankan aplikasi saat container dimulai
CMD [ "/deskflo-backend" ]
