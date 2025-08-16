package main

import (
	"fmt"
	"log"
	"net"
)

func main() {
	hostname := "db.dnyjsrlrfuhmnzuhzrux.supabase.co"
	fmt.Printf("Mencari alamat IP untuk host: %s\n", hostname)

	ips, err := net.LookupHost(hostname)
	if err != nil {
		log.Fatalf("Gagal melakukan DNS lookup: %v\n", err)
	}

	fmt.Printf("Berhasil! Alamat IP yang ditemukan: %v\n", ips)
}
