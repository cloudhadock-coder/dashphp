<?php
// api/indicadores.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

// Filtros
$periodo = $_GET['periodo'] ?? 'geral';
$responsavel = $_GET['responsavel'] ?? 'todos';
$motivo = $_GET['motivo'] ?? 'todos';

$whereClauses = ["1=1"];
$params = [];

if ($periodo === 'hoje') {
    $whereClauses[] = "c.data_de_inicio >= date('now', 'localtime')";
} elseif ($periodo === 'semana') {
    $whereClauses[] = "c.data_de_inicio >= date('now', '-7 days', 'localtime')";
} elseif ($periodo === 'mes') {
    $whereClauses[] = "c.data_de_inicio >= date('now', '-1 month', 'localtime')";
}

if ($responsavel !== 'todos' && is_numeric($responsavel)) {
    $whereClauses[] = "c.codresponsavel = :resp";
    $params[':resp'] = $responsavel;
}

if ($motivo !== 'todos' && is_numeric($motivo)) {
    $whereClauses[] = "c.codmotivo = :motivo";
    $params[':motivo'] = $motivo;
}

$whereSql = implode(' AND ', $whereClauses);

$response = [
    'maior_volume' => null,
    'maior_tempo' => null,
    'sem_atendimento' => null,
    'mais_recente' => null,
    'mais_antigo' => null,
    'top_responsaveis' => [],
    'total_status' => ['abertos' => 0, 'fechados' => 0, 'total' => 0, 'abertos_percent' => 0],
    'tempo_medio_minutos' => 0,
    'abertos_hoje' => 0,
    'taxa_resolucao_prazo' => 0
];

try {
    $runQuery = function($sql) use ($pdo, $params) {
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        return $stmt;
    };

    // 1. Maior Volume
    $response['maior_volume'] = $runQuery("
        SELECT m.descricao as motivo, COUNT(*) as total 
        FROM Chamados c
        JOIN Motivos m ON c.codmotivo = m.codmotivo
        WHERE $whereSql
        GROUP BY c.codmotivo, m.descricao
        ORDER BY total DESC 
        LIMIT 1
    ")->fetch();

    // 2. Maior tempo
    $response['maior_tempo'] = $runQuery("
        SELECT c.codigo, c.titulo, 
               CAST((julianday(c.data_de_fechamento) - julianday(c.data_de_inicio)) * 1440 AS INTEGER) as minutos
        FROM Chamados c
        WHERE c.data_de_fechamento IS NOT NULL AND $whereSql
        ORDER BY minutos DESC
        LIMIT 1
    ")->fetch();

    // 3. Sem atendimento
    $response['sem_atendimento'] = $runQuery("
        SELECT c.codigo, c.titulo, c.data_de_inicio,
               CAST(julianday('now', 'localtime') - julianday(c.data_de_inicio) AS INTEGER) as dias_aberto
        FROM Chamados c
        WHERE c.codstatus = 1 AND c.codresponsavel IS NULL AND $whereSql
        ORDER BY c.data_de_inicio ASC
        LIMIT 1
    ")->fetch();

    // 4. Mais recente
    $response['mais_recente'] = $runQuery("
        SELECT c.codigo, c.titulo, c.descricao, c.data_de_inicio, c.prioridade
        FROM Chamados c
        WHERE $whereSql
        ORDER BY c.data_de_inicio DESC
        LIMIT 1
    ")->fetch();

    // 5. Mais antigo (Aberto)
    $response['mais_antigo'] = $runQuery("
        SELECT c.codigo, c.titulo, c.data_de_inicio, c.prioridade
        FROM Chamados c
        WHERE c.codstatus NOT IN (4, 5) AND $whereSql
        ORDER BY c.data_de_inicio ASC
        LIMIT 1
    ")->fetch();

    // 6. Top Responsáveis
    $response['top_responsaveis'] = $runQuery("
        SELECT r.nome, COUNT(*) as concluidos
        FROM Chamados c
        JOIN Responsaveis r ON c.codresponsavel = r.codresponsavel
        WHERE c.codstatus IN (4, 5) AND $whereSql
        GROUP BY c.codresponsavel, r.nome
        ORDER BY concluidos DESC
        LIMIT 10
    ")->fetchAll();

    // 7. Total de chamados abertos vs fechados
    $statusStats = $runQuery("
        SELECT 
            SUM(CASE WHEN c.codstatus NOT IN (4, 5) THEN 1 ELSE 0 END) as abertos,
            SUM(CASE WHEN c.codstatus IN (4, 5) THEN 1 ELSE 0 END) as fechados,
            COUNT(*) as total
        FROM Chamados c
        WHERE $whereSql
    ")->fetch();
    
    if ($statusStats) {
        $response['total_status']['abertos'] = (int)$statusStats['abertos'];
        $response['total_status']['fechados'] = (int)$statusStats['fechados'];
        $response['total_status']['total'] = (int)$statusStats['total'];
        if ($response['total_status']['total'] > 0) {
            $response['total_status']['abertos_percent'] = round(($response['total_status']['abertos'] / $response['total_status']['total']) * 100, 1);
        }
    }

    // 8. Tempo médio de atendimento geral (minutos)
    $avgTime = $runQuery("
        SELECT AVG(CAST((julianday(c.data_de_fechamento) - julianday(c.data_de_inicio)) * 1440 AS INTEGER)) as avg_min
        FROM Chamados c
        WHERE c.data_de_fechamento IS NOT NULL AND $whereSql
    ")->fetch();
    $response['tempo_medio_minutos'] = $avgTime['avg_min'] ? round($avgTime['avg_min']) : 0;

    // 9. Chamados abertos hoje
    $abertosHoje = $pdo->query("
        SELECT COUNT(*) as count 
        FROM Chamados c 
        WHERE c.data_de_inicio >= date('now', 'localtime')
    ")->fetch();
    $response['abertos_hoje'] = $abertosHoje['count'];

    // 10. Taxa de resolução no prazo (<= 24h = 1440 mins)
    $resolvidos = $runQuery("
        SELECT 
            COUNT(*) as total_resolvidos,
            SUM(CASE WHEN CAST((julianday(c.data_de_fechamento) - julianday(c.data_de_inicio)) * 1440 AS INTEGER) <= 1440 THEN 1 ELSE 0 END) as no_prazo
        FROM Chamados c
        WHERE c.codstatus IN (4, 5) AND c.data_de_fechamento IS NOT NULL AND $whereSql
    ")->fetch();

    if ($resolvidos && $resolvidos['total_resolvidos'] > 0) {
        $response['taxa_resolucao_prazo'] = round(($resolvidos['no_prazo'] / $resolvidos['total_resolvidos']) * 100, 1);
    }

    echo json_encode($response);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro: ' . $e->getMessage()]);
}
