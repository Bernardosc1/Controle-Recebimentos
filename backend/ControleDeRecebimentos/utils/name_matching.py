"""
Módulo de matching de nomes por similaridade.

Permite encontrar correspondências entre nomes mesmo com pequenas variações como:
- Acentos diferentes (José vs Jose)
- Espaços extras
- Caracteres especiais

IMPORTANTE: O algoritmo prioriza a PRECISÃO para evitar falsos positivos.
É melhor NÃO encontrar um match do que encontrar o match ERRADO.

Casos que NÃO devem dar match:
- "MARINA FERREIRA DOS SANTOS" vs "MARINA FERREIRA ASSIS" (sobrenomes diferentes)
- "REBECA SANTOS SOUZA" vs "REBECA DE SANTOS SOUZA" (nomes muito similares mas pessoas diferentes)
"""

import unicodedata
import re
from difflib import SequenceMatcher


# Palavras comuns que não são sobrenomes significativos
CONECTIVOS = {"de", "da", "do", "das", "dos", "e"}


def normalizar_nome(nome: str) -> str:
    """
    Normaliza um nome para comparação:
    - Remove acentos
    - Converte para minúsculas
    - Remove espaços extras
    - Remove caracteres especiais

    Args:
        nome: Nome original

    Returns:
        Nome normalizado para comparação
    """
    if not nome:
        return ""

    # Remove acentos usando decomposição Unicode
    nome = unicodedata.normalize("NFKD", str(nome))
    nome = nome.encode("ASCII", "ignore").decode("ASCII")

    # Converte para minúsculas
    nome = nome.lower()

    # Remove caracteres especiais, mantém apenas letras e espaços
    nome = re.sub(r"[^a-z\s]", "", nome)

    # Remove espaços extras (múltiplos espaços viram um só)
    nome = " ".join(nome.split())

    return nome


def normalizar_nome_sem_conectivos(nome: str) -> str:
    """
    Normaliza um nome removendo também os conectivos (de, da, do, etc.).
    Usado para comparação mais estrita.

    Args:
        nome: Nome original

    Returns:
        Nome normalizado sem conectivos
    """
    nome_norm = normalizar_nome(nome)
    if not nome_norm:
        return ""

    # Remove conectivos
    partes = [p for p in nome_norm.split() if p not in CONECTIVOS]
    return " ".join(partes)


def calcular_similaridade(nome1: str, nome2: str) -> float:
    """
    Calcula similaridade entre dois nomes (0.0 a 1.0).
    Usa SequenceMatcher do Python (não requer dependências externas).

    Args:
        nome1: Primeiro nome
        nome2: Segundo nome

    Returns:
        Score de similaridade entre 0.0 e 1.0
    """
    n1 = normalizar_nome(nome1)
    n2 = normalizar_nome(nome2)

    if not n1 or not n2:
        return 0.0

    return SequenceMatcher(None, n1, n2).ratio()


def encontrar_melhor_match(nome_busca: str, candidatos: dict) -> tuple:
    """
    Encontra o melhor match para um nome em um dicionário de candidatos.

    IMPORTANTE: Só aceita match EXATO para evitar falsos positivos.
    Nomes como "REBECA SANTOS SOUZA" e "REBECA DE SANTOS SOUZA" são considerados
    DIFERENTES porque podem ser pessoas distintas.

    O algoritmo aceita apenas:
    1. Match exato após normalização (acentos, maiúsculas, espaços extras)

    NÃO aceita:
    - Diferenças em conectivos (de, da, do) - podem indicar pessoas diferentes
    - Similaridade parcial - muito arriscado

    Args:
        nome_busca: Nome a ser buscado
        candidatos: Dict {nome_normalizado: objeto}

    Returns:
        Tupla (objeto_encontrado, similaridade) ou (None, 0.0) se não encontrar
    """
    nome_normalizado = normalizar_nome(nome_busca)

    if not nome_normalizado:
        return None, 0.0

    # APENAS match exato com nome completo normalizado
    # Isso garante que só aceita diferenças de acentos/maiúsculas/espaços extras
    if nome_normalizado in candidatos:
        return candidatos[nome_normalizado], 1.0

    # Não encontrou match exato
    return None, 0.0


def criar_indice_por_nome_cliente(vendas) -> dict:
    """
    Cria um índice de vendas usando o nome do cliente normalizado como chave.

    Args:
        vendas: QuerySet de Venda com select_related("cliente")

    Returns:
        Dict {nome_normalizado: venda}
    """
    indice = {}
    for venda in vendas:
        if venda.cliente and venda.cliente.nome:
            nome_norm = normalizar_nome(venda.cliente.nome)
            if nome_norm:
                indice[nome_norm] = venda
    return indice
