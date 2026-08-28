terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region for deployment."
  type        = string
  default     = "us-east-1"
}

variable "service_name" {
  description = "Service name used for tags and naming."
  type        = string
  default     = "my-app-dashboard"
}

locals {
  common_tags = {
    Service     = var.service_name
    ManagedBy   = "terraform"
    Environment = "production"
  }
}
