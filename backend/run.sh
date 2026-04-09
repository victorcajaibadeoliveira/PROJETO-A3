# ========================================
# Como rodar o backend WearIA
# ========================================

# 1. Crie um ambiente virtual (recomendado)
python -m venv venv
venv\Scripts\activate

# 2. Instale as dependências
pip install -r backend/requirements.txt

# 3. Rode o servidor
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# O backend ficará disponível em http://localhost:8000
# Docs interativas: http://localhost:8000/docs

# ========================================
# Frontend
# ========================================
# Abra o index.html no navegador diretamente
# Ou use um servidor local:
#   python -m http.server 8080
#   Acesse: http://localhost:8080
