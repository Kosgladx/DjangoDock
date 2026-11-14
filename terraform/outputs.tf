output "resource_group_name" {
  description = "Grupo de recursos utilizado no deploy"
  value       = data.azurerm_resource_group.rg.name
}

output "location" {
  description = "Região do Azure onde os recursos foram alocados"
  value       = var.location
}

output "public_ip_address" {
  description = "Endereço IP Público estático da VM"
  value       = azurerm_public_ip.pip.ip_address
}

output "fqdn" {
  description = "Domínio DNS público gratuito da Azure"
  value       = azurerm_public_ip.pip.fqdn
}

output "application_url" {
  description = "URL de acesso direto ao sistema EduSchedule Timetabling"
  value       = "http://${azurerm_public_ip.pip.ip_address}"
}

output "application_dns_url" {
  description = "URL via DNS Azure para o sistema EduSchedule Timetabling"
  value       = "http://${azurerm_public_ip.pip.fqdn}"
}

output "ssh_command" {
  description = "Comando pronto para conectar via SSH na VM"
  value       = "ssh -i terraform/id_rsa ${var.admin_username}@${azurerm_public_ip.pip.ip_address}"
}
