<?php
// api/update_db.php
require_once 'db.php';

try {
    // Adicionar coluna prioridade
    $pdo->exec("ALTER TABLE Chamados ADD COLUMN prioridade VARCHAR(20) DEFAULT 'Media'");
    
    // Atualizar alguns chamados para simular criticidade
    $pdo->exec("UPDATE Chamados SET prioridade = 'Critica' WHERE codigo IN (2, 5)");
    $pdo->exec("UPDATE Chamados SET prioridade = 'Alta' WHERE codigo IN (1, 3)");
    
    echo "Banco atualizado com sucesso!";
} catch (Exception $e) {
    // Se a coluna ja existir, ignorar o erro.
    echo "Erro ao atualizar (pode já existir): " . $e->getMessage();
}
