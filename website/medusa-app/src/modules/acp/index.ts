import { Module } from "@medusajs/framework/utils"
import AcpModuleService from "./service"

export const ACP_MODULE = "acp"

export default Module(ACP_MODULE, {
  service: AcpModuleService,
})
