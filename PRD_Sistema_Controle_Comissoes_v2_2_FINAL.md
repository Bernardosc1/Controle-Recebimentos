# PRD - Sistema de Controle de Comissões v2.2 (FINAL)

**Versão:** 2.2  
**Data:** 03 de Novembro de 2025  
**Autor:** [Seu Nome]  
**Status:** Em Desenvolvimento

---

## 📋 Histórico de Versões

| Versão | Data | Mudanças Principais |
|--------|------|---------------------|
| 1.0 | 03/11/2025 | Versão inicial - conceito geral |
| 2.0 | 03/11/2025 | Fluxo redefinido em 3 etapas, modelo de dados ajustado |
| 2.1 | 03/11/2025 | Adicionadas colunas FORMA e STATUS da planilha Gestores, novo status DESISTIU |
| **2.2** | **03/11/2025** | **ANÁLISE DAS PLANILHAS REAIS: Mapeamento exato de valores, parser automático de headers, regras WeboPay ajustadas** |

---

## 1. Visão Geral do Produto

### 1.1 Contexto
O diretor de uma construtora recebe comissões sobre vendas de imóveis através de diferentes modelos de pagamento:
- **PIX:** Comissão liberada no momento do pagamento
- **Financiamento (FIN + IMOB):** Comissão liberada na assinatura do contrato
- **QUITADO:** Forma não identificada que requer análise manual
- **Desconto:** Cliente recebeu desconto, não haverá comissão
- **Distrato:** Cliente desistiu da compra, não haverá comissão

Atualmente, o controle dessas comissões é feito manualmente através do cruzamento de **4 planilhas Excel** provenientes de diferentes fontes:
1. **ACOMPANHAMENTO_SKILL_2025.xlsx:** Base geral de ~5.500 clientes da construtora
2. **COMISSÕES_GESTORES.xlsx:** Cadastro de clientes com FORMA de pagamento e STATUS (~270 registros)
3. **EPR_03-11-25.xls:** Clientes que assinaram contrato (~6.100 contratos)
4. **relatorio-comissoes_WebroPay.xlsx:** Plataforma de controle de pagamentos PIX (~3.400 parcelas)

### 1.2 Problema
- **Processo manual propenso a erros** no cruzamento de múltiplas planilhas
- **Regras de negócio complexas** com múltiplas formas de pagamento
- **Headers com linhas vazias** dificultam importação automática
- **WeboPay com múltiplas parcelas** por cliente requer tratamento especial
- **Valores desconhecidos** (ex: "QUITADO") não têm regra definida
- **Dificuldade em rastrear** quais comissões já foram faturadas
- **Falta de visibilidade** sobre comissões pendentes por período
- **Tempo excessivo** gasto em atividades operacionais

### 1.3 Solução Proposta
Sistema web que permite ao diretor:
1. **Criar bases mensais** de clientes a partir da planilha de Acompanhamento
2. **Detectar automaticamente** headers nas planilhas (pulando linhas vazias)
3. **Atualizar status e valores** através do upload de Gestores + WeboPay com regras inteligentes de prioridade
4. **Tratar múltiplas parcelas** no WeboPay (considera apenas primeira parcela)
5. **Alertar formas desconhecidas** ("QUITADO") para análise manual
6. **Gerar relatórios de recebimento** cruzando com a planilha EPR
7. **Manter histórico** de todas as bases e operações realizadas
8. **Alertar inconsistências** automaticamente

### 1.4 Objetivos do Produto
- Reduzir em **80%** o tempo gasto em controles manuais
- Eliminar **100%** dos erros de cruzamento manual
- **Detectar automaticamente** estrutura das planilhas
- Fornecer **visibilidade em tempo real** de comissões pendentes
- Manter **histórico completo** de bases mensais para auditoria
- Identificar **proativamente** inconsistências e valores desconhecidos
- Rastrear clientes que desistiram (distrato)

---

## 2. Estrutura Real das Planilhas

### 2.1 Planilha: ACOMPANHAMENTO_SKILL_2025.xlsx

**Características:**
- Total de registros: ~5.500 clientes
- **Header na linha 3** (linhas 0-2 são vazias/cabeçalho visual)
- Encoding: UTF-8

**Estrutura:**
```
Linha 0: [vazia]
Linha 1: [vazia]
Linha 2: QUANT. | DATA | NOME | CORRETOR | IMOBILIARIA | EMPREENDIMENTO | UNIDADE | ETAPA | FGTS | STATUS | OBSERVAÇÕES
Linha 3: 1 | 2024-04-01 | VIVIAN SOUZA GONCALVES | MURILO PINHO | ALCANCE IMOBILIARIA | ...
```

**Colunas Relevantes:**
- **NOME** ← Coluna principal para cruzamento (busca exata)

**Exemplo de dados:**
```
NOME: "VIVIAN SOUZA GONCALVES"
NOME: "THAIS DE MOURA ARAUJO"
```

---

### 2.2 Planilha: COMISSÕES_GESTORES.xlsx

**Características:**
- Total de registros: ~270 linhas (mas só ~17 com dados válidos)
- **Header na linha 1** (linha 0 é vazia/cabeçalho visual)
- Encoding: UTF-8

**Estrutura:**
```
Linha 0: # | NOME DO CLIENTE | STATUS - NF | STATUS - NF | EMPREENDIMENTO | ...
Linha 1: 10385 | EVELYN SAMILE BISPO DA SILVA SENA | [vazio] | SECRE | VICENZA | ...
```

**Colunas Relevantes:**
- **NOME DO CLIENTE** ← Coluna para cruzamento (busca exata)
- **COMISSÃO** ← Valor da comissão do diretor (ex: 337.3305)
- **FORMA** ← Forma de pagamento (valores reais abaixo)
- **STATUS** ← Status do pagamento (valores reais abaixo)

**Valores Reais da Coluna FORMA:**
```
"PIX"           → Cliente pagou via PIX
"FIN + IMOB"    → Cliente financiou (variações: "FINANCIADO", "FIN", etc)
"QUITADO"       → ⚠️ Forma desconhecida (gerar ALERTA)
"DESCONTO"      → Cliente recebeu desconto
(pode ter outros valores não documentados)
```

**Valores Reais da Coluna STATUS:**
```
"ENTROU"        → Pagamento foi realizado
"EM ABERTO"     → Pagamento ainda não realizado
"DESCONTO"      → Cliente recebeu desconto (mesma função que FORMA = DESCONTO)
"DISTRATO"      → Cliente desistiu (raro, mas existe)
```

**Exemplo de dados:**
```
LINHA 1:
  Nome: "EVELYN SAMILE BISPO DA SILVA SENA"
  FORMA: "QUITADO"
  COMISSÃO: 337.3305
  STATUS: "DESCONTO"
  
LINHA 2:
  Nome: "LEVI DE SANTANA LIMA"
  FORMA: "PIX"
  COMISSÃO: 350.9805
  STATUS: "ENTROU"
  
LINHA 3:
  Nome: "JOAO ERICK NASCIMENTO AMORIM"
  FORMA: "PIX"
  COMISSÃO: 421.1805
  STATUS: "ENTROU"
  
LINHA 4:
  Nome: "CLEONICE LAYS TRINDADE RIBEIRO"
  FORMA: "FIN + IMOB"
  COMISSÃO: 331.4805
  STATUS: "EM ABERTO"
```

---

### 2.3 Planilha: EPR_03-11-25.xls

**Características:**
- Total de registros: ~6.100 contratos assinados
- **Header na linha 0** (primeira linha já é o cabeçalho)
- Formato: .xls (Excel antigo - requer engine='xlrd')

**Estrutura:**
```
Linha 0: Nome Empreendimento | Número Contrato | Nome Mutuário | CPF/CNPJ Mutuário | Data de Assinatura | ...
Linha 1: Acqua Venture Europa II Mod 1 | 878772353735 | YASMIN DOS SANTOS LEAL | 8339803514 | 2025-05-23 | ...
```

**Colunas Relevantes:**
- **Nome Mutuário** ← Coluna para cruzamento (busca exata)
- **Data de Assinatura** ← Data para incluir no relatório

**Exemplo de dados:**
```
Nome Mutuário: "YASMIN DOS SANTOS LEAL"
Data de Assinatura: 2025-05-23

Nome Mutuário: "ERIC RIOS FERREIRA"
Data de Assinatura: 2025-05-23
```

---

### 2.4 Planilha: relatorio-comissoes_WebroPay.xlsx

**Características:**
- Total de registros: ~3.400 parcelas
- **Múltiplas linhas por cliente** (1 linha = 1 parcela)
- **Header na linha 0** (primeira linha já é o cabeçalho)

**Estrutura:**
```
Linha 0: Pagador | Empreendimento | Unidade | Data_da_venda | Parcelas_totais | Valor_original | Status_parcela | Status_comissão | ...
Linha 1: JOANDERSON DA SILVA JESUS | ACQUA VENTURE AMÉRICA | ... | 2025-11-01 | 12 | 323.68 | Pago | pago | ...
Linha 2: JOAO ERICK NASCIMENTO AMORIM | Atlanta Residence Park | ... | 2025-11-01 | 1 | 421.18 | Pago | pago | ...
```

**Colunas Relevantes:**
- **Pagador** ← Coluna para cruzamento (busca exata)
- **Valor_original** ← Valor da comissão (usar este, não Valor_disponivel)
- **Status_parcela** ← "Pago" ou "Pendente"
- **Status_comissão** ← "pago" ou "pendente"
- **Numero_parcela** ← Número da parcela (1, 2, 3...)

**IMPORTANTE - Tratamento de Parcelas:**
```
⚠️ O mesmo cliente pode ter múltiplas linhas (uma por parcela)

Exemplo:
Linha 1: LEVI DE SANTANA LIMA | Parcela 1 | 350.99 | Pendente
Linha 2: LEVI DE SANTANA LIMA | Parcela 2 | 350.99 | Pendente
Linha 3: LEVI DE SANTANA LIMA | Parcela 3 | 350.99 | Pago
...

REGRA: Considerar APENAS a primeira parcela (Numero_parcela = 1)
```

**Validação de Pagamento:**
```
Cliente considerado PAGO se:
  Status_parcela == "Pago" 
  E 
  Status_comissão == "pago"
```

**Exemplo de dados:**
```
LINHA 1:
  Pagador: "JOANDERSON DA SILVA JESUS"
  Valor_original: 323.68
  Status_parcela: "Pago"
  Status_comissão: "pago"
  Numero_parcela: 1
  
LINHA 2:
  Pagador: "JOAO ERICK NASCIMENTO AMORIM"
  Valor_original: 421.18
  Status_parcela: "Pago"
  Status_comissão: "pago"
  Numero_parcela: 1
  
LINHA 3:
  Pagador: "LEVI DE SANTANA LIMA"
  Valor_original: 350.99
  Status_parcela: "Pendente"
  Status_comissão: "pendente"
  Numero_parcela: 1
```

---

## 3. Mapeamento de Valores e Regras

### 3.1 Mapeamento da Coluna FORMA (Gestores)

```python
MAPEAMENTO_FORMA = {
    # Valores conhecidos
    "PIX": "PAGO",           # Cliente pagou via PIX
    "pix": "PAGO",           # Case insensitive
    
    "FIN + IMOB": "FINANCIADO",
    "FIN": "FINANCIADO",
    "FINANCIADO": "FINANCIADO",
    "fin + imob": "FINANCIADO",  # Case insensitive
    
    "DESCONTO": "DESCONTO",
    "desconto": "DESCONTO",
    
    # Valores que geram ALERTA
    "QUITADO": "ALERTA",     # ⚠️ Forma desconhecida - requer análise manual
    "quitado": "ALERTA",
}

# Se FORMA não estiver no mapeamento → gerar ALERTA TIPO 9
```

### 3.2 Mapeamento da Coluna STATUS (Gestores)

```python
MAPEAMENTO_STATUS = {
    "DISTRATO": "DESISTIU",      # Cliente desistiu
    "distrato": "DESISTIU",
    
    "DESCONTO": "DESCONTO",       # Cliente recebeu desconto
    "desconto": "DESCONTO",
    
    "ENTROU": "ENTROU",           # Pagamento confirmado (info adicional)
    "EM ABERTO": "ABERTO",        # Pagamento pendente (info adicional)
}
```

### 3.3 Status do Cliente no Sistema (6 Tipos)

```
┌─────────────┬──────────────────────────────────────────────────────┐
│   STATUS    │                   DESCRIÇÃO                          │
├─────────────┼──────────────────────────────────────────────────────┤
│ NULO        │ Cliente sem informação adicional                     │
│             │ Aguardando atualização de dados                      │
├─────────────┼──────────────────────────────────────────────────────┤
│ FINANCIADO  │ Cliente financiou (FIN + IMOB)                       │
│             │ Comissão será liberada na ASSINATURA (EPR)           │
├─────────────┼──────────────────────────────────────────────────────┤
│ PAGO        │ Cliente pagou via PIX (confirmado no WeboPay)        │
│             │ Comissão liberada no PAGAMENTO                       │
├─────────────┼──────────────────────────────────────────────────────┤
│ DESCONTO    │ Cliente recebeu desconto de comissão                 │
│             │ NÃO será faturado (R$ 0,00)                          │
├─────────────┼──────────────────────────────────────────────────────┤
│ DESISTIU    │ Cliente fez DISTRATO (desistiu da compra)            │
│             │ NÃO será faturado (R$ 0,00)                          │
│             │ Incluído em seção separada do relatório             │
├─────────────┼──────────────────────────────────────────────────────┤
│ REQUER_     │ Forma de pagamento desconhecida (ex: QUITADO)        │
│ ANÁLISE     │ Aguardando análise manual do diretor                 │
│             │ Gera alerta automático                               │
└─────────────┴──────────────────────────────────────────────────────┘
```

---

## 4. Regras de Prioridade (ATUALIZADAS)

### 4.1 Fluxo Completo de Decisão

```python
"""
Motor de Cruzamento - Definição de STATUS do Cliente
Baseado nas planilhas reais
"""

def definir_status_cliente(cliente_base, dados_gestores, dados_webopay):
    """
    Aplica regras de prioridade para definir status do cliente
    """
    
    # ===== PRIORIDADE 1: DISTRATO =====
    # Mais importante - independente da FORMA
    if cliente in Gestores AND STATUS_Gestores == "DISTRATO":
        return {
            'status': 'DESISTIU',
            'valor_comissao': 0.00,
            'fonte': 'Gestores (Distrato)',
            'observacao': 'Cliente fez distrato'
        }
    
    # ===== PRIORIDADE 2: DESCONTO =====
    # Pode vir tanto de FORMA quanto de STATUS
    if cliente in Gestores AND (FORMA_Gestores == "DESCONTO" OR STATUS_Gestores == "DESCONTO"):
        return {
            'status': 'DESCONTO',
            'valor_comissao': 0.00,
            'fonte': 'Gestores (Desconto)',
            'observacao': 'Cliente recebeu desconto de comissão'
        }
    
    # ===== PRIORIDADE 3: FORMA DESCONHECIDA (QUITADO) =====
    # Requer análise manual
    if cliente in Gestores AND FORMA_Gestores == "QUITADO":
        valor = extrair_valor_de_Gestores(cliente)
        
        gerar_alerta(
            tipo='forma_desconhecida',
            severidade='ALTA',
            descricao=f'Cliente {cliente.nome} com FORMA = "QUITADO" (desconhecida)',
            acao='Analisar manualmente e definir tratamento'
        )
        
        return {
            'status': 'REQUER_ANALISE',
            'valor_comissao': valor,
            'fonte': 'Gestores (QUITADO)',
            'observacao': 'Forma de pagamento desconhecida - análise manual necessária'
        }
    
    # ===== PRIORIDADE 4: FINANCIADO (FIN + IMOB) =====
    # Comissão liberada na assinatura
    if cliente in Gestores AND FORMA_Gestores in ["FIN + IMOB", "FIN", "FINANCIADO"]:
        valor = extrair_valor_de_Gestores(cliente)
        
        # Validação: se financiado, não deveria estar no WeboPay
        if cliente in WeboPay:
            gerar_alerta(
                tipo='financiado_no_webopay',
                severidade='MEDIA',
                descricao=f'Cliente {cliente.nome} está como FINANCIADO em Gestores mas aparece no WeboPay',
                acao='Verificar se houve mudança na forma de pagamento'
            )
        
        return {
            'status': 'FINANCIADO',
            'valor_comissao': valor,
            'fonte': 'Gestores (Financiado)',
            'observacao': 'Aguardando assinatura (EPR) para faturamento'
        }
    
    # ===== PRIORIDADE 5: PIX em Gestores =====
    # Deve ser confirmado no WeboPay
    if cliente in Gestores AND FORMA_Gestores == "PIX":
        
        # Cenário A: Está em ambos (esperado)
        if cliente in WeboPay:
            # Pegar apenas primeira parcela
            parcela_1 = filtrar_parcela_1(WeboPay, cliente)
            
            # Validar se está pago
            if parcela_1.Status_parcela == "Pago" AND parcela_1.Status_comissão == "pago":
                valor_gestores = extrair_valor_de_Gestores(cliente)
                valor_webopay = parcela_1.Valor_original
                
                # Validação: valores devem ser iguais
                if abs(valor_gestores - valor_webopay) > 0.01:  # Tolerância de 1 centavo
                    gerar_alerta(
                        tipo='valores_divergentes',
                        severidade='ALTA',
                        descricao=f'Valores divergentes: Gestores R$ {valor_gestores:.2f} vs WeboPay R$ {valor_webopay:.2f}',
                        acao='Verificar qual valor está correto'
                    )
                
                return {
                    'status': 'PAGO',
                    'valor_comissao': valor_webopay,  # Prefere WeboPay
                    'fonte': 'WeboPay (confirmado)',
                    'observacao': 'Pagamento PIX confirmado'
                }
            else:
                # Está no WeboPay mas não pago ainda
                return {
                    'status': 'NULO',
                    'valor_comissao': None,
                    'fonte': None,
                    'observacao': 'PIX pendente de pagamento no WeboPay'
                }
        
        # Cenário B: Está em Gestores mas NÃO no WeboPay (ALERTA!)
        else:
            gerar_alerta(
                tipo='pix_nao_confirmado',
                severidade='ALTA',
                descricao=f'Cliente {cliente.nome} marcado como PIX em Gestores mas NÃO aparece no WeboPay',
                acao='Verificar se pagamento foi processado no WeboPay'
            )
            
            return {
                'status': 'NULO',
                'valor_comissao': None,
                'fonte': None,
                'observacao': 'Aguardando confirmação de pagamento PIX no WeboPay'
            }
    
    # ===== PRIORIDADE 6: Apenas no WeboPay =====
    # Cliente não está em Gestores, mas pagou
    if cliente in WeboPay:
        # Pegar apenas primeira parcela
        parcela_1 = filtrar_parcela_1(WeboPay, cliente)
        
        # Validar se está pago
        if parcela_1.Status_parcela == "Pago" AND parcela_1.Status_comissão == "pago":
            valor = parcela_1.Valor_original
            
            # Gerar alerta informativo
            gerar_alerta(
                tipo='webopay_sem_gestores',
                severidade='MEDIA',
                descricao=f'Cliente {cliente.nome} encontrado no WeboPay mas não em Gestores',
                acao='Verificar se cliente deveria estar cadastrado em Gestores'
            )
            
            return {
                'status': 'PAGO',
                'valor_comissao': valor,
                'fonte': 'WeboPay',
                'observacao': 'Pagamento confirmado apenas em WeboPay'
            }
        else:
            # No WeboPay mas não pago
            return {
                'status': 'NULO',
                'valor_comissao': None,
                'fonte': None,
                'observacao': 'Cliente no WeboPay mas pagamento pendente'
            }
    
    # ===== PRIORIDADE 7: NULO =====
    # Não está em nenhuma planilha
    return {
        'status': 'NULO',
        'valor_comissao': None,
        'fonte': None,
        'observacao': 'Cliente sem informação nas planilhas de controle'
    }


def filtrar_parcela_1(webopay_df, nome_cliente):
    """
    Retorna apenas a primeira parcela (Numero_parcela = 1) do cliente
    """
    return webopay_df[
        (webopay_df['Pagador'] == nome_cliente) &
        (webopay_df['Numero_parcela'] == 1)
    ].iloc[0]
```

---

## 5. Sistema de Alertas (ATUALIZADO)

### 5.1 Tipos de Alertas (9 tipos)

**ALERTA TIPO 1: Cliente em Gestores mas não na Base**
- **Situação:** Nome aparece em Gestores mas não existe na Base de Acompanhamento
- **Severidade:** MÉDIA
- **Ação Sugerida:** "Verificar se cliente deveria estar na Base de Acompanhamento"

**ALERTA TIPO 2: Cliente em WeboPay mas não na Base**
- **Situação:** Nome aparece em WeboPay mas não existe na Base de Acompanhamento
- **Severidade:** MÉDIA
- **Ação Sugerida:** "Verificar se cliente deveria estar na Base de Acompanhamento"

**ALERTA TIPO 3: PIX em Gestores mas NÃO confirmado no WeboPay**
- **Situação:** Cliente marcado como PIX em Gestores mas NÃO aparece no WeboPay
- **Severidade:** ALTA
- **Ação Sugerida:** "Confirmar se pagamento foi processado no WeboPay"
- **Comportamento:** Cliente permanece com STATUS = NULO até confirmação

**ALERTA TIPO 4: Financiado sem Valor de Comissão**
- **Situação:** Cliente com STATUS = FINANCIADO mas valor_comissao = NULL
- **Severidade:** ALTA
- **Ação Sugerida:** "Revisar planilha de Gestores - valor de comissão não encontrado"

**ALERTA TIPO 5: Múltiplas Correspondências por Nome**
- **Situação:** Nome do cliente aparece mais de 1 vez na mesma planilha
- **Severidade:** ALTA
- **Ação Sugerida:** "Revisar planilha - duplicidade detectada"

**ALERTA TIPO 6: FINANCIADO aparece no WeboPay**
- **Situação:** Cliente marcado como FINANCIADO em Gestores mas aparece pago no WeboPay
- **Severidade:** MÉDIA
- **Ação Sugerida:** "Verificar se houve mudança na forma de pagamento"

**ALERTA TIPO 7: Valores Divergentes (Gestores vs WeboPay)**
- **Situação:** Cliente aparece em ambas planilhas mas com valores diferentes de comissão
- **Severidade:** ALTA
- **Ação Sugerida:** "Verificar qual valor está correto"
- **Comportamento:** Sistema usa valor do WeboPay mas alerta o diretor

**ALERTA TIPO 8: Apenas WeboPay (sem Gestores)**
- **Situação:** Cliente encontrado no WeboPay mas não em Gestores
- **Severidade:** MÉDIA
- **Ação Sugerida:** "Verificar se cliente deveria estar cadastrado em Gestores"

**⭐ ALERTA TIPO 9: Forma Desconhecida (QUITADO) - NOVO!**
- **Situação:** Cliente com FORMA = "QUITADO" ou outra forma não mapeada
- **Severidade:** ALTA
- **Ação Sugerida:** "Analisar manualmente e definir tratamento adequado"
- **Comportamento:** Cliente fica com STATUS = REQUER_ANALISE até resolução

---

## 6. Parser de Planilhas (NOVO)

### 6.1 Detector Automático de Headers

```python
def detectar_header_acompanhamento(caminho_arquivo):
    """
    Detecta automaticamente a linha do header na planilha de Acompanhamento
    """
    df = pd.read_excel(caminho_arquivo, header=None, nrows=10)
    
    # Procurar pela linha que contém "NOME" e "DATA"
    for i, row in df.iterrows():
        valores = row.astype(str).str.upper()
        if 'NOME' in valores.values and 'DATA' in valores.values:
            # Header encontrado na linha i
            # Reimportar com header correto
            df_final = pd.read_excel(caminho_arquivo, skiprows=i)
            return df_final
    
    raise ValueError("Header não encontrado nas primeiras 10 linhas")


def detectar_header_gestores(caminho_arquivo):
    """
    Detecta automaticamente a linha do header na planilha de Gestores
    """
    df = pd.read_excel(caminho_arquivo, header=None, nrows=10)
    
    # Procurar pela linha que contém "NOME DO CLIENTE" e "COMISSÃO"
    for i, row in df.iterrows():
        valores = row.astype(str).str.upper()
        if 'NOME DO CLIENTE' in ' '.join(valores.values):
            # Header encontrado na linha i
            df_final = pd.read_excel(caminho_arquivo, skiprows=i)
            return df_final
    
    raise ValueError("Header não encontrado nas primeiras 10 linhas")


def importar_acompanhamento(caminho_arquivo):
    """
    Importa planilha de Acompanhamento detectando header automaticamente
    """
    df = detectar_header_acompanhamento(caminho_arquivo)
    
    # Validar colunas obrigatórias
    if 'NOME' not in df.columns:
        raise ValueError("Coluna 'NOME' não encontrada")
    
    # Limpar dados
    df = df[df['NOME'].notna()]  # Remover linhas vazias
    df['NOME'] = df['NOME'].str.strip().str.upper()  # Normalizar
    
    return df[['NOME']].to_dict('records')


def importar_gestores(caminho_arquivo):
    """
    Importa planilha de Gestores detectando header automaticamente
    """
    df = detectar_header_gestores(caminho_arquivo)
    
    # Validar colunas obrigatórias
    required_cols = ['NOME DO CLIENTE', 'FORMA', 'STATUS', 'COMISSÃO']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Coluna '{col}' não encontrada")
    
    # Limpar dados
    df = df[df['NOME DO CLIENTE'].notna()]  # Remover linhas vazias
    df['NOME DO CLIENTE'] = df['NOME DO CLIENTE'].str.strip().str.upper()
    df['FORMA'] = df['FORMA'].str.strip().str.upper()
    df['STATUS'] = df['STATUS'].str.strip().str.upper()
    
    return df.to_dict('records')


def importar_webopay(caminho_arquivo):
    """
    Importa planilha WeboPay e filtra apenas primeira parcela de cada cliente
    """
    df = pd.read_excel(caminho_arquivo)
    
    # Validar colunas
    required_cols = ['Pagador', 'Numero_parcela', 'Valor_original', 
                     'Status_parcela', 'Status_comissão']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Coluna '{col}' não encontrada")
    
    # IMPORTANTE: Filtrar apenas primeira parcela
    df = df[df['Numero_parcela'] == 1]
    
    # Limpar dados
    df['Pagador'] = df['Pagador'].str.strip().str.upper()
    
    return df.to_dict('records')


def importar_epr(caminho_arquivo):
    """
    Importa planilha EPR (formato .xls)
    """
    df = pd.read_excel(caminho_arquivo, engine='xlrd')
    
    # Validar colunas
    if 'Nome Mutuário' not in df.columns:
        raise ValueError("Coluna 'Nome Mutuário' não encontrada")
    
    # Limpar dados
    df = df[df['Nome Mutuário'].notna()]
    df['Nome Mutuário'] = df['Nome Mutuário'].str.strip().str.upper()
    
    return df[['Nome Mutuário', 'Data de Assinatura']].to_dict('records')
```

---

## 7. Modelo de Dados (ATUALIZADO)

### 7.1 Models Django

```python
# ========== MODELS.PY (ATUALIZADO v2.2) ==========

from django.db import models
from django.contrib.auth.models import AbstractUser

# ===== 1. AUTENTICAÇÃO =====

class User(AbstractUser):
    """Usuário do sistema"""
    
    ROLE_CHOICES = [
        ('diretor', 'Diretor'),
        ('admin', 'Admin'),
    ]
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='diretor')
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


# ===== 2. BASES DE CLIENTES =====

class BaseClientes(models.Model):
    """Base mensal de clientes"""
    
    MES_CHOICES = [
        (1, 'Janeiro'), (2, 'Fevereiro'), (3, 'Março'),
        (4, 'Abril'), (5, 'Maio'), (6, 'Junho'),
        (7, 'Julho'), (8, 'Agosto'), (9, 'Setembro'),
        (10, 'Outubro'), (11, 'Novembro'), (12, 'Dezembro'),
    ]
    
    nome = models.CharField(max_length=100)  # "Base Outubro/2025"
    mes = models.IntegerField(choices=MES_CHOICES)
    ano = models.IntegerField()
    arquivo_acompanhamento = models.FileField(upload_to='uploads/acompanhamento/')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Base de Clientes"
        verbose_name_plural = "Bases de Clientes"
        ordering = ['-ano', '-mes']
        unique_together = ['mes', 'ano']
    
    def __str__(self):
        return self.nome
    
    def total_clientes(self):
        return self.clientes.count()
    
    def total_a_receber(self):
        """Total de comissões FINANCIADAS não pagas"""
        return self.clientes.filter(
            status='FINANCIADO',
            ja_pago=False
        ).aggregate(total=models.Sum('valor_comissao'))['total'] or 0
    
    def total_faturado(self):
        """Total de comissões já faturadas"""
        return self.clientes.filter(
            ja_pago=True
        ).aggregate(total=models.Sum('valor_comissao'))['total'] or 0
    
    def total_desistencias(self):
        return self.clientes.filter(status='DESISTIU').count()
    
    def total_requer_analise(self):
        """Total de clientes com formas desconhecidas"""
        return self.clientes.filter(status='REQUER_ANALISE').count()


# ===== 3. CLIENTES =====

class Cliente(models.Model):
    """Cliente dentro de uma base"""
    
    STATUS_CHOICES = [
        ('NULO', 'Nulo'),
        ('FINANCIADO', 'Financiado'),
        ('PAGO', 'Pago'),
        ('DESCONTO', 'Desconto'),
        ('DESISTIU', 'Desistiu'),
        ('REQUER_ANALISE', 'Requer Análise'),  # NOVO!
    ]
    
    base = models.ForeignKey(
        BaseClientes, 
        on_delete=models.CASCADE, 
        related_name='clientes'
    )
    nome_cliente = models.CharField(max_length=200, db_index=True)
    
    # Status e Comissão
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='NULO',
        db_index=True
    )
    valor_comissao = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    
    # Controle de Faturamento
    ja_pago = models.BooleanField(default=False, db_index=True)
    data_pagamento = models.DateField(null=True, blank=True)
    
    # Metadados da Atualização
    fonte = models.CharField(
        max_length=100, 
        blank=True,
        help_text="De onde veio a informação"
    )
    observacao = models.TextField(blank=True)
    
    # Auditoria
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['nome_cliente']
        indexes = [
            models.Index(fields=['base', 'status']),
            models.Index(fields=['base', 'ja_pago']),
        ]
    
    def __str__(self):
        return f"{self.nome_cliente} ({self.get_status_display()})"
    
    def pode_faturar(self):
        """Retorna se este cliente pode ser faturado"""
        return self.status in ['FINANCIADO', 'PAGO'] and not self.ja_pago


# ===== 4. HISTÓRICO DE ATUALIZAÇÕES =====

class HistoricoAtualizacao(models.Model):
    """Registro de cada execução de Controle de Clientes"""
    
    TIPO_CHOICES = [
        ('controle', 'Controle de Clientes'),
        ('recebimentos', 'Análise de Recebimentos'),
    ]
    
    base = models.ForeignKey(
        BaseClientes, 
        on_delete=models.CASCADE, 
        related_name='historico'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    
    # Arquivos enviados
    arquivo_gestores = models.FileField(
        upload_to='uploads/gestores/', 
        null=True, 
        blank=True
    )
    arquivo_webopay = models.FileField(
        upload_to='uploads/webopay/', 
        null=True, 
        blank=True
    )
    arquivo_epr = models.FileField(
        upload_to='uploads/epr/', 
        null=True, 
        blank=True
    )
    
    # Estatísticas
    clientes_atualizados = models.IntegerField(default=0)
    novos_financiados = models.IntegerField(default=0)
    novos_pagos = models.IntegerField(default=0)
    novos_descontos = models.IntegerField(default=0)
    novos_desistiu = models.IntegerField(default=0)
    novos_requer_analise = models.IntegerField(default=0)  # NOVO!
    alertas_gerados = models.IntegerField(default=0)
    
    # Auditoria
    executed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    executed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Histórico de Atualização"
        verbose_name_plural = "Histórico de Atualizações"
        ordering = ['-executed_at']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.base.nome} - {self.executed_at.strftime('%d/%m/%Y %H:%M')}"


# ===== 5. ALERTAS =====

class Alerta(models.Model):
    """Alertas de inconsistências"""
    
    TIPO_CHOICES = [
        ('gestores_nao_base', 'Cliente em Gestores mas não na Base'),
        ('webopay_nao_base', 'Cliente em WeboPay mas não na Base'),
        ('pix_nao_confirmado', 'PIX em Gestores mas não em WeboPay'),
        ('financiado_sem_valor', 'Financiado sem Valor de Comissão'),
        ('multiplas_correspondencias', 'Múltiplas Correspondências por Nome'),
        ('financiado_no_webopay', 'Financiado aparece no WeboPay'),
        ('valores_divergentes', 'Valores Divergentes (Gestores vs WeboPay)'),
        ('webopay_sem_gestores', 'Cliente no WeboPay mas não em Gestores'),
        ('forma_desconhecida', 'Forma de Pagamento Desconhecida (QUITADO)'),  # NOVO!
    ]
    
    SEVERIDADE_CHOICES = [
        ('BAIXA', 'Baixa'),
        ('MEDIA', 'Média'),
        ('ALTA', 'Alta'),
    ]
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('resolvido', 'Resolvido'),
        ('falso_positivo', 'Falso Positivo'),
    ]
    
    historico_atualizacao = models.ForeignKey(
        HistoricoAtualizacao,
        on_delete=models.CASCADE,
        related_name='alertas'
    )
    base = models.ForeignKey(
        BaseClientes,
        on_delete=models.CASCADE,
        related_name='alertas'
    )
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='alertas'
    )
    
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    severidade = models.CharField(max_length=10, choices=SEVERIDADE_CHOICES, default='MEDIA')
    descricao = models.TextField()
    acao_sugerida = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    observacao = models.TextField(blank=True)
    
    # Auditoria de Resolução
    resolvido_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='alertas_resolvidos'
    )
    resolvido_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Alerta"
        verbose_name_plural = "Alertas"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['base', 'status']),
            models.Index(fields=['severidade', 'status']),
        ]
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.base.nome}"


# ===== 6. RELATÓRIOS =====

class Relatorio(models.Model):
    """Relatórios de Análise de Recebimentos gerados"""
    
    base = models.ForeignKey(
        BaseClientes,
        on_delete=models.CASCADE,
        related_name='relatorios'
    )
    historico_atualizacao = models.ForeignKey(
        HistoricoAtualizacao,
        on_delete=models.CASCADE,
        related_name='relatorios'
    )
    
    arquivo = models.FileField(upload_to='relatorios/')
    
    # Estatísticas Seção 1: A Receber
    total_clientes_a_receber = models.IntegerField(default=0)
    total_valor_a_receber = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Estatísticas Seção 2: Desistências
    total_desistencias = models.IntegerField(default=0)
    
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Relatório"
        verbose_name_plural = "Relatórios"
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"Relatório {self.base.nome} - {self.generated_at.strftime('%d/%m/%Y')}"


# ===== 7. LOGS DE AUDITORIA =====

class LogAuditoria(models.Model):
    """Logs de ações sensíveis no sistema"""
    
    ACAO_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('criar_base', 'Criar Base'),
        ('executar_controle', 'Executar Controle'),
        ('gerar_relatorio', 'Gerar Relatório'),
        ('resolver_alerta', 'Resolver Alerta'),
        ('editar_cliente', 'Editar Cliente'),
        ('criar_usuario', 'Criar Usuário'),
        ('editar_usuario', 'Editar Usuário'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    acao = models.CharField(max_length=30, choices=ACAO_CHOICES)
    
    entidade = models.CharField(max_length=50, blank=True)
    entidade_id = models.IntegerField(null=True, blank=True)
    
    dados_anteriores = models.JSONField(null=True, blank=True)
    dados_novos = models.JSONField(null=True, blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Log de Auditoria"
        verbose_name_plural = "Logs de Auditoria"
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username if self.user else 'Sistema'} - {self.get_acao_display()} - {self.timestamp.strftime('%d/%m/%Y %H:%M')}"
```

---

## 8. Casos de Teste Baseados em Dados Reais

### Caso de Teste 1: Cliente PIX Confirmado

**Entrada:**
```
Base: "VIVIAN SOUZA GONCALVES"

Gestores:
  Nome: "LEVI DE SANTANA LIMA"
  FORMA: "PIX"
  COMISSÃO: 350.9805
  STATUS: "ENTROU"

WeboPay:
  Pagador: "LEVI DE SANTANA LIMA"
  Numero_parcela: 1
  Valor_original: 350.99
  Status_parcela: "Pendente"
  Status_comissão: "pendente"
```

**Resultado Esperado:**
- STATUS = NULO (WeboPay mostra pendente)
- Valor = NULL
- Observação = "PIX pendente de pagamento no WeboPay"
- SEM ALERTA (está no WeboPay, só aguardando pagamento)

---

### Caso de Teste 2: Cliente PIX Pago

**Entrada:**
```
Base: "JOAO ERICK NASCIMENTO AMORIM"

Gestores:
  Nome: "JOAO ERICK NASCIMENTO AMORIM"
  FORMA: "PIX"
  COMISSÃO: 421.1805
  STATUS: "ENTROU"

WeboPay:
  Pagador: "JOAO ERICK NASCIMENTO AMORIM"
  Numero_parcela: 1
  Valor_original: 421.18
  Status_parcela: "Pago"
  Status_comissão: "pago"
```

**Resultado Esperado:**
- STATUS = PAGO
- Valor = 421.18 (do WeboPay)
- Fonte = "WeboPay (confirmado)"
- Observação = "Pagamento PIX confirmado"
- SEM ALERTA

---

### Caso de Teste 3: Cliente FINANCIADO

**Entrada:**
```
Base: "CLEONICE LAYS TRINDADE RIBEIRO"

Gestores:
  Nome: "CLEONICE LAYS TRINDADE RIBEIRO"
  FORMA: "FIN + IMOB"
  COMISSÃO: 331.4805
  STATUS: "EM ABERTO"

WeboPay: NÃO contém este cliente
```

**Resultado Esperado:**
- STATUS = FINANCIADO
- Valor = 331.4805
- Fonte = "Gestores (Financiado)"
- Observação = "Aguardando assinatura (EPR) para faturamento"
- SEM ALERTA

---

### Caso de Teste 4: Cliente DESCONTO

**Entrada:**
```
Base: "EVELYN SAMILE BISPO DA SILVA SENA"

Gestores:
  Nome: "EVELYN SAMILE BISPO DA SILVA SENA"
  FORMA: "QUITADO"
  COMISSÃO: 337.3305
  STATUS: "DESCONTO"

WeboPay: NÃO contém este cliente
```

**Resultado Esperado:**
- STATUS = DESCONTO (prioridade do STATUS)
- Valor = 0.00
- Fonte = "Gestores (Desconto)"
- SEM ALERTA (STATUS = DESCONTO tem prioridade)

---

### Caso de Teste 5: Forma QUITADO Desconhecida

**Entrada:**
```
Base: "MARIA DA SILVA"

Gestores:
  Nome: "MARIA DA SILVA"
  FORMA: "QUITADO"
  COMISSÃO: 500.00
  STATUS: "ENTROU"

WeboPay: NÃO contém este cliente
```

**Resultado Esperado:**
- STATUS = REQUER_ANALISE
- Valor = 500.00
- Fonte = "Gestores (QUITADO)"
- Observação = "Forma de pagamento desconhecida - análise manual necessária"
- **ALERTA TIPO 9** gerado:
  - Descrição: "Cliente MARIA DA SILVA com FORMA = 'QUITADO' (desconhecida)"
  - Severidade: ALTA
  - Ação: "Analisar manualmente e definir tratamento adequado"

---

### Caso de Teste 6: Múltiplas Parcelas no WeboPay

**Entrada:**
```
Base: "CARLOS SANTOS"

WeboPay:
  Linha 1: CARLOS SANTOS | Parcela 1 | 100.00 | Pago | pago
  Linha 2: CARLOS SANTOS | Parcela 2 | 100.00 | Pendente | pendente
  Linha 3: CARLOS SANTOS | Parcela 3 | 100.00 | Pendente | pendente
```

**Processamento:**
- Sistema filtra apenas Parcela 1

**Resultado Esperado:**
- Considera apenas: Parcela 1 | 100.00 | Pago | pago
- STATUS = PAGO
- Valor = 100.00
- As demais parcelas são IGNORADAS

---

## 9. Roadmap de Desenvolvimento (ATUALIZADO)

### 9.1 MVP - Versão 1.0 (10 Semanas)

**Sprint 1-2: Setup e Fundação (Semanas 1-4)**
- [ ] Setup do projeto Django + React + PostgreSQL + Docker
- [ ] Configuração de ambiente de desenvolvimento
- [ ] Autenticação JWT (login/logout)
- [ ] CRUD de usuários (Admin)
- [ ] Layout base do frontend
- [ ] Tela de Dashboard (versão básica)

**Sprint 3: Gestão de Bases (Semanas 5-6)**
- [ ] Model `BaseClientes` e `Cliente` (com STATUS = REQUER_ANALISE)
- [ ] Endpoint: Criar nova base
- [ ] **Parser automático de Acompanhamento** (detecta header)
- [ ] Endpoint: Listar bases
- [ ] Endpoint: Visualizar detalhes de uma base
- [ ] Frontend: Tela "Criar Nova Base"
- [ ] Frontend: Tela "Visualizar Base"

**Sprint 4: Controle de Clientes (Semanas 7-8)**
- [ ] Model `HistoricoAtualizacao` e `Alerta` (9 tipos)
- [ ] Endpoint: Executar Controle de Clientes
- [ ] **Parser automático de Gestores** (detecta header, normaliza FORMA/STATUS)
- [ ] **Parser de WeboPay** (filtra apenas primeira parcela)
- [ ] Motor de cruzamento com **regras reais** (PIX, FIN+IMOB, QUITADO)
- [ ] Validação de pagamento WeboPay (Status_parcela E Status_comissão)
- [ ] Geração automática de **9 tipos de alertas**
- [ ] Frontend: Tela "Executar Controle"
- [ ] Frontend: Painel de Alertas

**Sprint 5: Análise de Recebimentos e Finalização (Semanas 9-10)**
- [ ] Model `Relatorio` (com seção de desistências)
- [ ] Endpoint: Gerar Relatório de Recebimentos
- [ ] **Parser de EPR** (formato .xls, engine xlrd)
- [ ] Lógica de filtro (FINANCIADO + Não Pago + cruza EPR)
- [ ] Lógica de seção 2 (DESISTIU)
- [ ] Geração de arquivo Excel com 2 abas
- [ ] Marcação automática de "Já Pago"
- [ ] Frontend: Tela "Análise de Recebimentos"
- [ ] Frontend: Histórico de Relatórios
- [ ] **Testes com planilhas reais**
- [ ] Testes finais e correções de bugs
- [ ] Deploy em ambiente de produção

---

## 10. Requisitos Técnicos Específicos

### 10.1 Bibliotecas Python Necessárias

```txt
# Backend
Django==5.0+
djangorestframework==3.14+
psycopg2-binary==2.9+
pandas==2.0+
openpyxl==3.1+       # Para .xlsx (Acompanhamento, Gestores, WeboPay)
xlrd==2.0+           # Para .xls (EPR)
celery==5.3+
redis==4.5+
python-decouple==3.8+

# Validação e Serialização
pydantic==2.0+

# Testes
pytest==7.4+
pytest-django==4.5+
```

### 10.2 Configurações Django

```python
# settings.py

# Tamanho máximo de upload (10MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB

# Formatos de arquivo aceitos
ALLOWED_UPLOAD_EXTENSIONS = ['.xlsx', '.xls']

# Mapeamento de valores FORMA
FORMA_MAPPING = {
    'PIX': 'PAGO',
    'pix': 'PAGO',
    'FIN + IMOB': 'FINANCIADO',
    'FIN': 'FINANCIADO',
    'FINANCIADO': 'FINANCIADO',
    'fin + imob': 'FINANCIADO',
    'fin': 'FINANCIADO',
    'DESCONTO': 'DESCONTO',
    'desconto': 'DESCONTO',
    'QUITADO': 'ALERTA',
    'quitado': 'ALERTA',
}

# Mapeamento de valores STATUS
STATUS_MAPPING = {
    'DISTRATO': 'DESISTIU',
    'distrato': 'DESISTIU',
    'DESCONTO': 'DESCONTO',
    'desconto': 'DESCONTO',
    'ENTROU': 'ENTROU',
    'EM ABERTO': 'ABERTO',
}
```

---

## 11. Glossário (ATUALIZADO)

**Acompanhamento:** Planilha com ~5.500 clientes da construtora (ACOMPANHAMENTO_SKILL_2025.xlsx)

**Base de Clientes:** Conjunto de clientes de um período específico (mês/ano)

**Controle de Clientes:** Processo de atualizar status e valores através do cruzamento com Gestores e WeboPay

**DESCONTO:** Status de cliente que recebeu desconto de comissão (não será faturado)

**DESISTIU:** Status de cliente que fez distrato (desistiu da compra, não será faturado)

**DISTRATO:** Situação em que o cliente desiste da compra (coluna STATUS da planilha Gestores)

**EPR:** Planilha com ~6.100 clientes que assinaram contrato (EPR_03-11-25.xls)

**FINANCIADO:** Status de cliente que financiou (FIN + IMOB)

**FORMA:** Coluna da planilha Gestores indicando método de pagamento (valores reais: PIX, FIN + IMOB, QUITADO, DESCONTO)

**Gestores:** Planilha com ~270 registros onde gestores cadastram clientes com FORMA e STATUS (COMISSÕES_GESTORES.xlsx)

**Header Automático:** Detecção automática da linha que contém os nomes das colunas

**Já Pago:** Campo booleano indicando se comissão foi faturada

**NULO:** Status padrão de cliente sem informação adicional

**PAGO:** Status de cliente que pagou via PIX (confirmado no WeboPay)

**Primeira Parcela:** No WeboPay, considera-se apenas a linha com Numero_parcela = 1

**QUITADO:** Forma de pagamento desconhecida que gera alerta TIPO 9

**REQUER_ANALISE:** Status de cliente com forma de pagamento desconhecida (ex: QUITADO)

**STATUS (Planilha Gestores):** Coluna indicando situação do pagamento (valores reais: ENTROU, EM ABERTO, DESCONTO, DISTRATO)

**WeboPay:** Plataforma de controle de pagamentos PIX com ~3.400 parcelas (relatorio-comissoes_WebroPay.xlsx)

---

## 12. Aprovações

| Stakeholder | Papel | Data | Assinatura |
|-------------|-------|------|------------|
| Diretor | Product Owner | ___ / ___ / 2025 | ___________ |
| [Seu Nome] | Desenvolvedor | 03/11/2025 | ___________ |

---

**Fim do PRD v2.2 (FINAL)**

**CHANGELOG v2.2:**
- ✅ Análise completa das 4 planilhas reais
- ✅ Mapeamento exato dos valores FORMA e STATUS
- ✅ Novo status: REQUER_ANALISE
- ✅ Novo alerta TIPO 9: Forma Desconhecida (QUITADO)
- ✅ Parser automático de headers (pula linhas vazias)
- ✅ Tratamento de múltiplas parcelas no WeboPay (considera apenas primeira)
- ✅ Validação dupla no WeboPay (Status_parcela E Status_comissão)
- ✅ Busca exata por nome (sem fuzzy matching)
- ✅ Uso de Valor_original do WeboPay
- ✅ 6 casos de teste baseados em dados reais
- ✅ Código Python completo para parsers
- ✅ Configurações Django específicas
