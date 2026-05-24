<?php
// api/indicadores.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Permite chamadas do frontend em dev (CORS)

require_once 'db.php';

$response = [
    'maior_volume' => null,
    'maior_tempo' => null,
    'sem_atendimento' => null,
    'mais_recente' => null,
    'top_responsaveis' => []
];

try {
    // 1. Tipo de chamado com maior número de solicitações
    $stmt1 = $pdo->query("
        SELECT m.descricao as motivo, COUNT(*) as total 
        FROM Chamados c
        JOIN Motivos m ON c.codmotivo = m.codmotivo
        GROUP BY c.codmotivo, m.descricao
        ORDER BY total DESC 
        LIMIT 1
    ");
    $response['maior_volume'] = $stmt1->fetch();

    // 2. Chamado com maior tempo de atendimento
    // Em SQLite calculamos minutos via julianday
    $stmt2 = $pdo->query("
        SELECT c.codigo, c.titulo, 
               CAST((julianday(c.data_de_fechamento) - julianday(c.data_de_inicio)) * 1440 AS INTEGER) as minutos
        FROM Chamados c
        WHERE c.data_de_fechamento IS NOT NULL
        ORDER BY minutos DESC
        LIMIT 1
    ");
    $response['maior_tempo'] = $stmt2->fetch();

    // 3. Chamado sem atendimento há mais tempo (Aberto e sem responsavel)
    // Em SQLite calculamos dias via julianday
    $stmt3 = $pdo->query("
        SELECT c.codigo, c.titulo, c.data_de_inicio,
               CAST(julianday('now') - julianday(c.data_de_inicio) AS INTEGER) as dias_aberto
        FROM Chamados c
        WHERE c.codstatus = 1 AND c.codresponsavel IS NULL
        ORDER BY c.data_de_inicio ASC
        LIMIT 1
    ");
    $response['sem_atendimento'] = $stmt3->fetch();

    // 4. Chamado mais recente
    $stmt4 = $pdo->query("
        SELECT c.codigo, c.titulo, c.descricao, c.data_de_inicio
        FROM Chamados c
        ORDER BY c.data_de_inicio DESC
        LIMIT 1
    ");
    $response['mais_recente'] = $stmt4->fetch();

    // 5. Top 10 responsáveis com mais atendimentos concluídos
    // codstatus = 4 (Resolvido) ou 5 (Fechado)
    $stmt5 = $pdo->query("
        SELECT r.nome, COUNT(*) as concluidos
        FROM Chamados c
        JOIN Responsaveis r ON c.codresponsavel = r.codresponsavel
        WHERE c.codstatus IN (4, 5)
        GROUP BY c.codresponsavel, r.nome
        ORDER BY concluidos DESC
        LIMIT 10
    ");
    $response['top_responsaveis'] = $stmt5->fetchAll();

    echo json_encode($response);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar indicadores: ' . $e->getMessage()]);
}
