# ==============================================================================
# Makefile — Automação de Infraestrutura (Terraform) e Deploy (Microsoft Azure)
# Projeto: EduSchedule Timetabling
# Plano Alvo: Azure for Students | Resource Group: ugb-group | Região: mexicocentral
# ==============================================================================

TF_DIR           := terraform
RESOURCE_GROUP   := ugb-group
DEFAULT_LOCATION := mexicocentral
VM_NAME          := vm-eduschedule
SSH_USER         := azureuser
SSH_KEY          := terraform/id_rsa
SSH_OPTS         := -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10
REMOTE_DIR       := /opt/eduschedule
BUNDLE_NAME      := deploy_bundle.tar.gz

.PHONY: help check-env ensure-rg infra-init infra-plan infra-up wait-vm app-deploy deploy-all ssh logs status stop-vm start-vm destroy

help:
	@echo "======================================================================"
	@echo "  EduSchedule Timetabling — Automação de Deploy no Microsoft Azure"
	@echo "======================================================================"
	@echo "Comandos Principais:"
	@echo "  make deploy-all   -> Fluxo completo: Valida + Provisiona VM + Faz Deploy"
	@echo "  make infra-init   -> Garante o grupo '$(RESOURCE_GROUP)' e inicializa o Terraform"
	@echo "  make infra-plan   -> Visualiza o plano de infraestrutura no Azure"
	@echo "  make infra-up     -> Cria/atualiza a VM ($(VM_NAME) - Standard_B2als_v2)"
	@echo "  make app-deploy   -> Empacota o código, envia via SSH e sobe o Docker Compose"
	@echo ""
	@echo "Operação e Economia de Créditos (Azure for Students):"
	@echo "  make status       -> Exibe o status dos containers na VM da Azure"
	@echo "  make logs         -> Acompanha os logs do Django/Nginx/Postgres na VM"
	@echo "  make ssh          -> Conecta no terminal da VM via SSH"
	@echo "  make stop-vm      -> Desaloca a VM (pausa cobrança de vCPU/RAM mantendo dados)"
	@echo "  make start-vm     -> Liga novamente a VM desalocada"
	@echo "  make destroy      -> Destrói os recursos da aplicação preservando o '$(RESOURCE_GROUP)'"
	@echo "======================================================================"

# 1. Verifica pré-requisitos locais (Azure CLI, Terraform, SSH e Login)
check-env:
	@echo "==> [1/4] Verificando ferramentas instaladas (az, terraform, ssh)..."
	@command -v az >/dev/null 2>&1 || { echo "[ERRO] Azure CLI (az) não encontrado."; exit 1; }
	@command -v terraform >/dev/null 2>&1 || { echo "[ERRO] Terraform não encontrado."; exit 1; }
	@command -v ssh >/dev/null 2>&1 || { echo "[ERRO] Cliente OpenSSH (ssh) não encontrado."; exit 1; }
	@echo "==> Verificando sessão ativa no Microsoft Azure..."
	@az account show >/dev/null 2>&1 || { echo "[AVISO] Sessão Azure expirada ou inexistente. Abrindo 'az login'..."; az login; }
	@echo "[OK] Ambiente local validado com sucesso!"

# 2. Garante que o grupo de recursos ugb-group existe (sem sobrescrever se já existir)
ensure-rg:
	@echo "==> Verificando Grupo de Recursos '$(RESOURCE_GROUP)' no Azure..."
	@if [ "$$(az group exists --name $(RESOURCE_GROUP) | tr -d '\r')" = "true" ]; then \
		echo "[OK] Grupo de recursos '$(RESOURCE_GROUP)' já existe na assinatura. Reutilizando!"; \
	else \
		echo "==> Criando grupo de recursos '$(RESOURCE_GROUP)' na região '$(DEFAULT_LOCATION)'..."; \
		az group create --name $(RESOURCE_GROUP) --location $(DEFAULT_LOCATION) -o none; \
		echo "[OK] Grupo de recursos '$(RESOURCE_GROUP)' criado com sucesso!"; \
	fi

# 3. Inicializa o Terraform
infra-init: check-env ensure-rg
	@echo "==> [2/4] Inicializando Terraform em './$(TF_DIR)'..."
	terraform -chdir=$(TF_DIR) init

# 4. Planeja a infraestrutura
infra-plan: ensure-rg
	@echo "==> Gerando plano de execução do Terraform..."
	terraform -chdir=$(TF_DIR) plan

# 5. Provisiona a infraestrutura no Azure
infra-up: ensure-rg
	@echo "==> [3/4] Provisionando infraestrutura no Azure (VM Standard_B2als_v2 em $(DEFAULT_LOCATION))..."
	terraform -chdir=$(TF_DIR) apply -auto-approve

# 6. Aguarda o cloud-init terminar de instalar o Docker e configurar o Swap na VM
wait-vm:
	@VM_IP=$$(terraform -chdir=$(TF_DIR) output -raw public_ip_address | tr -d '\r'); \
	echo "==> Aguardando a VM ($$VM_IP) concluir a instalação do Docker via cloud-init..."; \
	until ssh $(SSH_OPTS) -i $(SSH_KEY) $(SSH_USER)@$$VM_IP "test -f $(REMOTE_DIR)/.cloud-init-ready" >/dev/null 2>&1; do \
		echo "    [Aguardando] Cloud-init ainda configurando Docker e Swap na VM... (nova tentativa em 10s)"; \
		sleep 10; \
	done; \
	echo "[OK] VM pronta e Docker instalado com sucesso!"

# 7. Empacota o projeto, transfere para a VM e sobe os containers em produção
app-deploy: wait-vm
	@VM_IP=$$(terraform -chdir=$(TF_DIR) output -raw public_ip_address | tr -d '\r'); \
	VM_FQDN=$$(terraform -chdir=$(TF_DIR) output -raw fqdn | tr -d '\r'); \
	echo "==> [4/4] Empacotando código da aplicação para deploy em $$VM_IP..."; \
	tar --exclude='.git' \
	    --exclude='.venv' \
	    --exclude='venv' \
	    --exclude='node_modules' \
	    --exclude='frontend/node_modules' \
	    --exclude='frontend/dist' \
	    --exclude='backend/__pycache__' \
	    --exclude='backend/db.sqlite3' \
	    --exclude='backend/staticfiles' \
	    --exclude='terraform/.terraform' \
	    --exclude='terraform/*.tfstate*' \
	    --exclude='terraform/id_rsa*' \
	    --exclude='$(BUNDLE_NAME)' \
	    -czf $(BUNDLE_NAME) .; \
	echo "==> Enviando pacote ($(BUNDLE_NAME)) via SCP para a VM..."; \
	scp $(SSH_OPTS) -i $(SSH_KEY) $(BUNDLE_NAME) $(SSH_USER)@$$VM_IP:$(REMOTE_DIR)/$(BUNDLE_NAME); \
	rm -f $(BUNDLE_NAME); \
	echo "==> Extraindo aplicação, configurando variáveis de produção e subindo containers Docker..."; \
	ssh $(SSH_OPTS) -i $(SSH_KEY) $(SSH_USER)@$$VM_IP "\
		cd $(REMOTE_DIR) && \
		tar -xzf $(BUNDLE_NAME) && \
		rm -f $(BUNDLE_NAME) && \
		printf 'DJANGO_DEBUG=False\nDJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,%s,%s\nDJANGO_CSRF_TRUSTED_ORIGINS=http://%s,http://%s\nDB_NAME=timetabling\nDB_USER=postgres\nDB_PASSWORD=postgres\n' \"$$VM_IP\" \"$$VM_FQDN\" \"$$VM_IP\" \"$$VM_FQDN\" > .env && \
		sudo docker compose -f docker-compose.prod.yml up -d --build --remove-orphans \
	"; \
	echo ""; \
	echo "======================================================================"; \
	echo "  DEPLOY CONCLUIDO COM SUCESSO NO MICROSOFT AZURE!"; \
	echo "======================================================================"; \
	echo "  🌐 Acesso por IP:   http://$$VM_IP"; \
	echo "  🌐 Acesso por DNS:  http://$$VM_FQDN"; \
	echo "  ⚙️  API REST:        http://$$VM_IP/api/"; \
	echo "  🔐 Django Admin:    http://$$VM_IP/admin/"; \
	echo "======================================================================"

# 8. Pipeline Completo em 1 Comando
deploy-all: infra-init infra-up app-deploy

# 9. Utilitários de Operação Remota e Economia de Custos
ssh:
	@VM_IP=$$(terraform -chdir=$(TF_DIR) output -raw public_ip_address | tr -d '\r'); \
	ssh $(SSH_OPTS) -i $(SSH_KEY) $(SSH_USER)@$$VM_IP

logs:
	@VM_IP=$$(terraform -chdir=$(TF_DIR) output -raw public_ip_address | tr -d '\r'); \
	ssh $(SSH_OPTS) -i $(SSH_KEY) $(SSH_USER)@$$VM_IP "cd $(REMOTE_DIR) && sudo docker compose -f docker-compose.prod.yml logs -f --tail=100"

status:
	@VM_IP=$$(terraform -chdir=$(TF_DIR) output -raw public_ip_address | tr -d '\r'); \
	ssh $(SSH_OPTS) -i $(SSH_KEY) $(SSH_USER)@$$VM_IP "cd $(REMOTE_DIR) && sudo docker compose -f docker-compose.prod.yml ps && echo '' && free -h"

stop-vm:
	@echo "==> Desalocando a VM '$(VM_NAME)' no grupo '$(RESOURCE_GROUP)' para economizar créditos..."
	az vm deallocate --resource-group $(RESOURCE_GROUP) --name $(VM_NAME)
	@echo "[OK] VM desalocada! Cobrança de computação (vCPU/RAM) pausada."

start-vm:
	@echo "==> Iniciando a VM '$(VM_NAME)' no grupo '$(RESOURCE_GROUP)'..."
	az vm start --resource-group $(RESOURCE_GROUP) --name $(VM_NAME)
	@echo "[OK] VM iniciada! Os containers Docker subirão automaticamente."

destroy:
	@echo "==> Destruindo recursos do EduSchedule no Azure (preservando o grupo '$(RESOURCE_GROUP)')..."
	terraform -chdir=$(TF_DIR) destroy -auto-approve
