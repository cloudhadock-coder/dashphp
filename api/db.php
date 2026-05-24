<?php
// api/db.php
// Conexão SQLite usando PDO

// Usando o caminho do seu banco local
$dbPath = 'C:\\Users\\cloud\\Downloads\\chamados.db\\chamados.db';

try {
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(["error" => "Erro na conexão com o banco de dados", "details" => $e->getMessage()]);
    exit;
}
