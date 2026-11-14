param(
    [Parameter(Position=0)]
    [ValidateSet("check", "init", "plan", "up", "deploy", "all", "status", "logs", "stop-vm", "start-vm", "destroy")]
    [string]$Action = "all"
)

# Usa Continue para que mensagens informativas em stderr (do ssh e docker compose) não interrompam o PowerShell 5.1
$ErrorActionPreference = "Continue"

# Recarrega o PATH atualizado do Registro do Windows (garante que az, terraform e make recém-instalados sejam encontrados)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Adiciona caminhos padrão do Winget e Azure CLI por segurança extra
$extraPaths = @(
    "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin",
    "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Links"
)
foreach ($p in $extraPaths) {
    if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
        $env:Path += ";$p"
    }
}

# Localiza binários nos pacotes do Winget caso o symlink não esteja no PATH
if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    $tfPkg = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "terraform.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($tfPkg) { $env:Path += ";$($tfPkg.DirectoryName)" }
}

$RESOURCE_GROUP = "ugb-group"
$DEFAULT_LOCATION = "mexicocentral"
$VM_NAME = "vm-eduschedule"
$SSH_USER = "azureuser"
$SSH_KEY = "terraform/id_rsa"
$REMOTE_DIR = "/opt/eduschedule"
$BUNDLE_NAME = "deploy_bundle.tar.gz"

function Invoke-Check {
    Write-Host "==> [1/4] Verificando ferramentas (az, terraform, ssh, tar)..." -ForegroundColor Cyan
    az --version | Select-Object -First 1
    terraform -version | Select-Object -First 1
    Write-Host "==> Verificando grupo de recursos '$RESOURCE_GROUP'..." -ForegroundColor Cyan
    $exists = (az group exists --name $RESOURCE_GROUP).Trim()
    if ($exists -eq "true") {
        Write-Host "[OK] Grupo '$RESOURCE_GROUP' encontrado na assinatura!" -ForegroundColor Green
    } else {
        Write-Host "==> Criando grupo '$RESOURCE_GROUP' em '$DEFAULT_LOCATION'..." -ForegroundColor Yellow
        az group create --name $RESOURCE_GROUP --location $DEFAULT_LOCATION -o none
    }
}

function Invoke-Init {
    Invoke-Check
    Write-Host "==> [2/4] Inicializando Terraform em './terraform'..." -ForegroundColor Cyan
    terraform "-chdir=terraform" init -upgrade
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

function Invoke-Plan {
    Write-Host "==> Gerando plano do Terraform..." -ForegroundColor Cyan
    terraform "-chdir=terraform" plan
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

function Invoke-Up {
    # Limpa eventual registro órfão de VM que falhou por AllocationFailed em tentativa anterior
    $stateList = terraform "-chdir=terraform" state list
    if ($stateList -notcontains "azurerm_linux_virtual_machine.vm") {
        Write-Host "==> Removendo registro orfao de VM anterior (AllocationFailed) no Azure..." -ForegroundColor Yellow
        az vm delete --resource-group $RESOURCE_GROUP --name $VM_NAME --yes | Out-Null
        az disk delete --resource-group $RESOURCE_GROUP --name "osdisk-eduschedule" --yes | Out-Null
    }

    Write-Host "==> [3/4] Provisionando infraestrutura no Azure (VM Standard_B2ls_v2 em $DEFAULT_LOCATION)..." -ForegroundColor Cyan
    terraform "-chdir=terraform" apply -auto-approve
    if ($LASTEXITCODE -ne 0) { exit 1 }

    # Ajusta permissões da chave privada SSH no Windows para o OpenSSH não reclamar de permissões abertas
    if (Test-Path $SSH_KEY) {
        icacls $SSH_KEY /inheritance:r /grant:r "$($env:USERNAME):(R)" | Out-Null
    }
}

function Invoke-Deploy {
    $VM_IP = (terraform "-chdir=terraform" output -raw public_ip_address).Trim()
    $VM_FQDN = (terraform "-chdir=terraform" output -raw fqdn).Trim()

    if (Test-Path $SSH_KEY) {
        icacls $SSH_KEY /inheritance:r /grant:r "$($env:USERNAME):(R)" | Out-Null
    }

    Write-Host "==> Aguardando a VM ($VM_IP) concluir a instalacao do Docker via cloud-init..." -ForegroundColor Cyan
    $maxRetries = 40
    $retry = 0
    while ($retry -lt $maxRetries) {
        ssh -o LogLevel=ERROR -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -o ConnectTimeout=10 -i $SSH_KEY "$SSH_USER@$VM_IP" "test -f $REMOTE_DIR/.cloud-init-ready"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] VM pronta e Docker instalado com sucesso!" -ForegroundColor Green
            break
        }
        $retry++
        Write-Host "    [Tentativa $retry/$maxRetries] Cloud-init ainda configurando Docker e Swap na VM... (aguardando 10s)" -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
    if ($retry -ge $maxRetries) {
        Write-Host "[ERRO] Timeout aguardando cloud-init na VM $VM_IP" -ForegroundColor Red
        exit 1
    }

    Write-Host "==> [4/4] Empacotando codigo da aplicacao para deploy em $VM_IP..." -ForegroundColor Cyan
    if (Test-Path $BUNDLE_NAME) { Remove-Item $BUNDLE_NAME -Force }

    tar --exclude=".git" `
        --exclude=".venv" `
        --exclude="venv" `
        --exclude="node_modules" `
        --exclude="frontend/node_modules" `
        --exclude="frontend/dist" `
        --exclude="backend/__pycache__" `
        --exclude="backend/db.sqlite3" `
        --exclude="backend/staticfiles" `
        --exclude="terraform/.terraform" `
        --exclude="terraform/*.tfstate*" `
        --exclude="terraform/id_rsa*" `
        --exclude="$BUNDLE_NAME" `
        -czf $BUNDLE_NAME .

    Write-Host "==> Enviando pacote ($BUNDLE_NAME) via SCP para a VM..." -ForegroundColor Cyan
    scp -o LogLevel=ERROR -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -i $SSH_KEY $BUNDLE_NAME "$SSH_USER@${VM_IP}:$REMOTE_DIR/$BUNDLE_NAME"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao enviar pacote via SCP" -ForegroundColor Red
        exit 1
    }
    Remove-Item $BUNDLE_NAME -Force

    Write-Host "==> Extraindo aplicacao, configurando .env de producao e subindo containers Docker..." -ForegroundColor Cyan
    $remoteCmd = "cd $REMOTE_DIR && tar -xzf $BUNDLE_NAME && rm -f $BUNDLE_NAME && printf 'DJANGO_DEBUG=False\nDJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,$VM_IP,$VM_FQDN\nDJANGO_CSRF_TRUSTED_ORIGINS=http://$VM_IP,http://$VM_FQDN\nDB_NAME=timetabling\nDB_USER=postgres\nDB_PASSWORD=postgres\n' > .env && sudo docker compose -f docker-compose.prod.yml up -d --build --remove-orphans"
    ssh -o LogLevel=ERROR -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -i $SSH_KEY "$SSH_USER@$VM_IP" $remoteCmd
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao subir containers Docker na VM" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host "  DEPLOY CONCLUIDO COM SUCESSO NO MICROSOFT AZURE!" -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host "  Acesso por IP:   http://$VM_IP"
    Write-Host "  Acesso por DNS:  http://$VM_FQDN"
    Write-Host "  API REST:        http://$VM_IP/api/"
    Write-Host "  Django Admin:    http://$VM_IP/admin/"
    Write-Host "======================================================================" -ForegroundColor Green
}

switch ($Action) {
    "check"    { Invoke-Check }
    "init"     { Invoke-Init }
    "plan"     { Invoke-Plan }
    "up"       { Invoke-Up }
    "deploy"   { Invoke-Deploy }
    "all"      { Invoke-Init; Invoke-Up; Invoke-Deploy }
    "status"   {
        $VM_IP = (terraform "-chdir=terraform" output -raw public_ip_address).Trim()
        ssh -o LogLevel=ERROR -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -i $SSH_KEY "$SSH_USER@$VM_IP" "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod.yml ps && echo '' && free -h"
    }
    "logs"     {
        $VM_IP = (terraform "-chdir=terraform" output -raw public_ip_address).Trim()
        ssh -o LogLevel=ERROR -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -i $SSH_KEY "$SSH_USER@$VM_IP" "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod.yml logs --tail=100"
    }
    "stop-vm"  { az vm deallocate --resource-group $RESOURCE_GROUP --name $VM_NAME }
    "start-vm" { az vm start --resource-group $RESOURCE_GROUP --name $VM_NAME }
    "destroy"  { terraform "-chdir=terraform" destroy -auto-approve }
}
