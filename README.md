# Dashboard de Chamados 🚀

Uma dashboard moderna e em tempo real para monitoramento e gestão de chamados de TI/Operações.

## 🛠 Tecnologias
- **Frontend:** React.js + Vite
- **Estilização:** CSS3 puro (Glassmorphism e Variáveis Nativas)
- **Banco de Dados:** Supabase (PostgreSQL)
- **Gráficos:** Recharts
- **Deploy:** Vercel

## 🚀 Como Executar Localmente

1. Certifique-se de ter o Node.js instalado.
2. Instale as dependências do projeto:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env.local` na raiz do projeto com suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_key_aqui
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse `http://localhost:5173` no seu navegador.

## 🌐 Deploy
O projeto está configurado para deploy automático no **Vercel**. Certifique-se de configurar as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas configurações de "Environment Variables" no painel do seu projeto no Vercel.
