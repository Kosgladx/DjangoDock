variable "subscription_id" {
  description = "ID da Assinatura do Microsoft Azure (Azure for Students)"
  type        = string
  default     = "b71f94b8-4833-48ae-9102-9eb505779e27"
}

variable "resource_group_name" {
  description = "Nome do Grupo de Recursos existente (ou garantido via CLI) no Azure"
  type        = string
  default     = "ugb-group"
}

variable "location" {
  description = "Região autorizada pela Azure Policy da assinatura (Mexico Central)"
  type        = string
  default     = "mexicocentral"
}

variable "project_name" {
  description = "Prefixo identificador dos recursos do projeto EduSchedule"
  type        = string
  default     = "eduschedule"
}

variable "vm_size" {
  description = "SKU da Máquina Virtual no Azure (2 vCPUs e 4 GB RAM - cluster Intel Bv2 com capacidade física)"
  type        = string
  default     = "Standard_B2ls_v2"
}

variable "admin_username" {
  description = "Usuário administrador SSH da VM Linux"
  type        = string
  default     = "azureuser"
}
