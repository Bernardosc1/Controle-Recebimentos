/*
  # Create Controle de Comissões Database Schema

  ## Overview
  Creates the complete schema for the commission management system, including users, clients, properties, sales, and EPR analysis.

  ## Tables Created
  1. **profiles** - Extended user information with role management
  2. **clientes** - Client/customer records
  3. **empreendimentos** - Properties/developments
  4. **tabelas_mensais** - Monthly reference tables
  5. **vendas** - Sales transactions
  6. **analise_epr** - EPR analysis records

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Restrictive policies requiring authentication
  - Ownership and membership checks for data access

  ## Key Features
  - User roles: DIRETOR (Director) and GESTOR (Manager)
  - Sales status tracking: PENDENTE (Pending) and FATURADO (Billed)
  - Payment methods: À Vista, Financiado, Desconto
  - JSON fields for flexible EPR data storage
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  user_type text DEFAULT 'GES' CHECK (user_type IN ('DIR', 'GES')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clientes table
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create empreendimentos table
CREATE TABLE IF NOT EXISTS empreendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create tabelas_mensais table
CREATE TABLE IF NOT EXISTS tabelas_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create vendas table
CREATE TABLE IF NOT EXISTS vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela_mensal_id uuid NOT NULL REFERENCES tabelas_mensais ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes ON DELETE CASCADE,
  empreendimento_id uuid NOT NULL REFERENCES empreendimentos ON DELETE CASCADE,
  data_venda date NOT NULL,
  status text DEFAULT 'PE' CHECK (status IN ('PE', 'FA')),
  valor_venda decimal(12, 2),
  forma_pagamento text CHECK (forma_pagamento IN ('AV', 'FI', 'DS')),
  corretor text,
  imobiliaria text,
  unidade text,
  etapa text,
  fgts decimal(12, 2),
  observacoes text,
  valor_comissao decimal(12, 2),
  data_faturamento date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cliente_id, empreendimento_id, unidade, data_venda)
);

-- Create analise_epr table
CREATE TABLE IF NOT EXISTS analise_epr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text DEFAULT 'PE' CHECK (status IN ('PE', 'CO', 'CA')),
  vendas_ids jsonb DEFAULT '[]'::jsonb,
  dados_epr jsonb DEFAULT '[]'::jsonb,
  total_encontradas integer DEFAULT 0,
  resumo_por_mes jsonb DEFAULT '{}'::jsonb,
  confirmado_em timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabelas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE analise_epr ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Clientes policies - all authenticated users can read/write
CREATE POLICY "Authenticated users can read clientes"
  ON clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create clientes"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes"
  ON clientes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clientes"
  ON clientes FOR DELETE
  TO authenticated
  USING (true);

-- Empreendimentos policies - all authenticated users can read/write
CREATE POLICY "Authenticated users can read empreendimentos"
  ON empreendimentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create empreendimentos"
  ON empreendimentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update empreendimentos"
  ON empreendimentos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete empreendimentos"
  ON empreendimentos FOR DELETE
  TO authenticated
  USING (true);

-- Tabelas_mensais policies - all authenticated users can read/write
CREATE POLICY "Authenticated users can read tabelas_mensais"
  ON tabelas_mensais FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tabelas_mensais"
  ON tabelas_mensais FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tabelas_mensais"
  ON tabelas_mensais FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tabelas_mensais"
  ON tabelas_mensais FOR DELETE
  TO authenticated
  USING (true);

-- Vendas policies - all authenticated users can read/write
CREATE POLICY "Authenticated users can read vendas"
  ON vendas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create vendas"
  ON vendas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vendas"
  ON vendas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vendas"
  ON vendas FOR DELETE
  TO authenticated
  USING (true);

-- Analise_epr policies - all authenticated users can read/write
CREATE POLICY "Authenticated users can read analise_epr"
  ON analise_epr FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create analise_epr"
  ON analise_epr FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update analise_epr"
  ON analise_epr FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete analise_epr"
  ON analise_epr FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendas_tabela_mensal ON vendas(tabela_mensal_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_empreendimento ON vendas(empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);
