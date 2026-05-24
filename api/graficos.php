<?php
// api/graficos.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

$response = [
    'por_dia_semana' => [],
    'por_motivo' => [],
    'evolucao_mensal' => []
];

try {
    // 1. Chamados por dia da semana (barras)
    $semana = $pdo->query("
        SELECT CAST(strftime('%w', data_de_inicio) AS INTEGER) as dia_index, COUNT(*) as total
        FROM Chamados
        GROUP BY dia_index
    ")->fetchAll();
    
    $diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    $semanaMap = array_fill(0, 7, 0);
    foreach($semana as $row) {
        $semanaMap[$row['dia_index']] = (int)$row['total'];
    }
    foreach($semanaMap as $index => $total) {
        $response['por_dia_semana'][] = ['name' => $diasNomes[$index], 'total' => $total];
    }

    // 2. Pizza de distribuição por tipo/motivo
    $motivos = $pdo->query("
        SELECT m.descricao as name, COUNT(*) as value
        FROM Chamados c
        JOIN Motivos m ON c.codmotivo = m.codmotivo
        GROUP BY m.descricao
    ")->fetchAll();
    
    foreach($motivos as $m) {
        $response['por_motivo'][] = ['name' => $m['name'], 'value' => (int)$m['value']];
    }

    // 3. Evolução mensal (Abertos vs Fechados)
    $meses = $pdo->query("
        SELECT 
            strftime('%Y-%m', data_de_inicio) as mes,
            SUM(CASE WHEN codstatus NOT IN (4, 5) THEN 1 ELSE 0 END) as abertos,
            SUM(CASE WHEN codstatus IN (4, 5) THEN 1 ELSE 0 END) as fechados
        FROM Chamados
        GROUP BY mes
        ORDER BY mes ASC
        LIMIT 6
    ")->fetchAll();

    foreach($meses as $m) {
        $response['evolucao_mensal'][] = [
            'name' => $m['mes'],
            'abertos' => (int)$m['abertos'],
            'fechados' => (int)$m['fechados']
        ];
    }

    echo json_encode($response);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro: ' . $e->getMessage()]);
}
