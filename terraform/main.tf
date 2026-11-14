# ============================================================
# Infraestrutura EduSchedule Timetabling — Microsoft Azure
# Grupo de Recursos: ugb-group | Região: mexicocentral | VM: Standard_B2ls_v2
# ============================================================

# Referencia o grupo de recursos ugb-group (preservando recursos compartilhados)
data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

# Sufixo aleatório curto para garantir unicidade global do DNS da Azure
resource "random_string" "dns_suffix" {
  length  = 5
  special = false
  upper   = false
}

# Geração automática de par de chaves SSH RSA 4096 bits para acesso à VM
resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "local_file" "private_key" {
  content         = tls_private_key.ssh_key.private_key_pem
  filename        = "${path.module}/id_rsa"
  file_permission = "0600"
}

resource "local_file" "public_key" {
  content         = tls_private_key.ssh_key.public_key_openssh
  filename        = "${path.module}/id_rsa.pub"
  file_permission = "0644"
}

# 1. Rede Virtual (VNet) e Sub-rede
resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-${var.project_name}"
  address_space       = ["10.10.0.0/16"]
  location            = var.location
  resource_group_name = data.azurerm_resource_group.rg.name

  tags = {
    Project     = "EduSchedule-Timetabling"
    Environment = "Production"
  }
}

resource "azurerm_subnet" "subnet" {
  name                 = "snet-${var.project_name}"
  resource_group_name  = data.azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.10.1.0/24"]
}

# 2. IP Público Estático + DNS Azure Gratuito
resource "azurerm_public_ip" "pip" {
  name                = "pip-${var.project_name}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
  domain_name_label   = "${var.project_name}-ugb-${random_string.dns_suffix.result}"

  tags = {
    Project = "EduSchedule-Timetabling"
  }
}

# 3. Network Security Group (Firewall: libera apenas SSH 22 e HTTP 80)
resource "azurerm_network_security_group" "nsg" {
  name                = "nsg-${var.project_name}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.rg.name

  security_rule {
    name                       = "Allow-SSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow-HTTP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = {
    Project = "EduSchedule-Timetabling"
  }
}

# 4. Interface de Rede (NIC) + Associação ao Firewall
resource "azurerm_network_interface" "nic" {
  name                = "nic-${var.project_name}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.pip.id
  }
}

resource "azurerm_network_interface_security_group_association" "nic_nsg" {
  network_interface_id      = azurerm_network_interface.nic.id
  network_security_group_id = azurerm_network_security_group.nsg.id
}

# 5. Máquina Virtual Ubuntu 24.04 LTS (Standard_B2ls_v2)
resource "azurerm_linux_virtual_machine" "vm" {
  name                  = "vm-${var.project_name}"
  location              = var.location
  resource_group_name   = data.azurerm_resource_group.rg.name
  size                  = var.vm_size
  admin_username        = var.admin_username
  network_interface_ids = [azurerm_network_interface.nic.id]

  admin_ssh_key {
    username   = var.admin_username
    public_key = tls_private_key.ssh_key.public_key_openssh
  }

  os_disk {
    name                 = "osdisk-${var.project_name}"
    caching              = "ReadWrite"
    storage_account_type = "StandardSSD_LRS"
    disk_size_gb         = 30
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }

  custom_data = filebase64("${path.module}/cloud-init.yaml")

  tags = {
    Project     = "EduSchedule-Timetabling"
    Environment = "Production"
  }
}
