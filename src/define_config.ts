import { ShopkeeperConfig } from './types.js'

export function defineConfig(
  config: Omit<ShopkeeperConfig, 'calculateTaxes' | 'deactivatePastDue' | 'deactiveIncomplete'>
): ShopkeeperConfig {
  return {
    calculateTaxes: false,
    deactivatePastDue: false,
    deactiveIncomplete: false,
    ...config,
  }
}
