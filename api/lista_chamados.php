<?php
// api/lista_chamados.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$offset = ($page - 1) * $limit;

try {
    $totalQuery = $pdo->query("SELECT COUNT(*) FROM Chamados WHERE codstatus NOT IN (4, 5)");
    $total = $totalQuery->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT 
            c.codigo, 
            c.titulo, 
            c.descricao, 
            c.data_de_inicio, 
            c.prioridade,
            s.descricao as status,
            r.nome as responsavel,
            m.descricao as motivo,
            CAST(julianday('now', 'localtime') - julianday(c.data_de_inicio) AS INTEGER) as dias_aberto
        FROM Chamados c
        JOIN Status s ON c.codstatus = s.codstatus
        JOIN Motivos m ON c.codmotivo = m.codmotivo
        LEFT JOIN Responsaveis r ON c.codresponsavel = r.codresponsavel
        WHERE c.codstatus NOT IN (4, 5)
        ORDER BY c.data_de_inicio DESC
        LIMIT :limit OFFSET :offset
    ");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $chamados = $stmt->fetchAll();

    echo json_encode([
        'data' => $chamados,
        'total' => $total,
        'page' => $page,
        'totalPages' => ceil($total / $limit)
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro: ' . $e->getMessage()]);
}
