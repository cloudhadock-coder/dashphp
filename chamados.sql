-- =========================================
-- BANCO DE DADOS: Monitoramento de Chamados
-- DIALETO: MySQL / PostgreSQL
-- (Recomendado para Vercel + PHP PDO)
-- =========================================

-- 1. TABELA DE STATUS
CREATE TABLE Status (
    codstatus INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(50) NOT NULL
);

-- 2. TABELA DE MOTIVOS
CREATE TABLE Motivos (
    codmotivo INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL
);

-- 3. TABELA DE RESPONSÁVEIS
CREATE TABLE Responsaveis (
    codresponsavel INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL
);

-- 4. TABELA PRINCIPAL DE CHAMADOS
CREATE TABLE Chamados (
    codigo INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_de_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_de_fechamento DATETIME NULL,
    codresponsavel INT NULL,
    codstatus INT NOT NULL,
    codmotivo INT NOT NULL,
    FOREIGN KEY (codresponsavel) REFERENCES Responsaveis(codresponsavel),
    FOREIGN KEY (codstatus) REFERENCES Status(codstatus),
    FOREIGN KEY (codmotivo) REFERENCES Motivos(codmotivo)
);

-- =========================================
-- INSERÇÃO DE DADOS FICTÍCIOS PARA TESTES
-- =========================================

INSERT INTO Status (descricao) VALUES 
('Aberto'),
('Em Atendimento'),
('Pausado'),
('Resolvido'),
('Fechado');

INSERT INTO Motivos (descricao) VALUES 
('Dúvida de Sistema'),
('Erro na Plataforma'),
('Solicitação de Acesso'),
('Problema de Hardware'),
('Instalação de Software');

INSERT INTO Responsaveis (nome, email) VALUES 
('João Silva', 'joao@empresa.com'),
('Maria Souza', 'maria@empresa.com'),
('Carlos Eduardo', 'carlos@empresa.com'),
('Ana Clara', 'ana@empresa.com'),
('Pedro Paulo', 'pedro@empresa.com');

-- a) Chamado com maior tempo de atendimento
INSERT INTO Chamados (titulo, descricao, data_de_inicio, data_de_fechamento, codresponsavel, codstatus, codmotivo)
VALUES ('Erro crítico no faturamento', 'Sistema não gera notas fiscais', '2025-10-01 10:00:00', '2026-02-15 15:00:00', 1, 4, 2);

-- b) Chamado sem atendimento há mais tempo
INSERT INTO Chamados (titulo, descricao, data_de_inicio, data_de_fechamento, codresponsavel, codstatus, codmotivo)
VALUES ('Acesso bloqueado ERP', 'Usuário relata que esqueceu a senha', '2025-11-10 08:00:00', NULL, NULL, 1, 3);

-- c) Top responsáveis
-- Maria (3 chamados)
INSERT INTO Chamados (titulo, data_de_inicio, data_de_fechamento, codresponsavel, codstatus, codmotivo) VALUES 
('Instalar Office', '2026-05-10 09:00:00', '2026-05-10 10:00:00', 2, 4, 5),
('Trocar teclado', '2026-05-11 09:00:00', '2026-05-11 09:30:00', 2, 4, 4),
('Dúvida relatório', '2026-05-12 09:00:00', '2026-05-12 09:15:00', 2, 4, 1);
-- Carlos (2 chamados)
INSERT INTO Chamados (titulo, data_de_inicio, data_de_fechamento, codresponsavel, codstatus, codmotivo) VALUES 
('Criar usuário novo', '2026-05-13 09:00:00', '2026-05-13 10:00:00', 3, 4, 3),
('Erro de login', '2026-05-14 09:00:00', '2026-05-14 14:00:00', 3, 4, 2);

-- d) Tipo com maior número de solicitações
INSERT INTO Chamados (titulo, data_de_inicio, data_de_fechamento, codresponsavel, codstatus, codmotivo) VALUES 
('Acesso VPN', '2026-05-15 09:00:00', '2026-05-15 10:00:00', 1, 4, 3),
('Liberar pasta rede', '2026-05-16 09:00:00', '2026-05-16 14:00:00', 4, 4, 3);

-- e) Chamado mais recente
INSERT INTO Chamados (titulo, data_de_inicio, data_de_fechamento, codresponsavel, codstatus, codmotivo) VALUES 
('Monitor piscando', CURRENT_TIMESTAMP, NULL, NULL, 1, 4);
