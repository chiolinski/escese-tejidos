import { WebpayPlus, Environment, Options, IntegrationCommerceCodes, IntegrationApiKeys } from 'transbank-sdk'

export function webpay() {
  const commerce = process.env.WEBPAY_COMMERCE_CODE
  const key = process.env.WEBPAY_API_KEY
  if (process.env.WEBPAY_ENV === 'production') {
    if (process.env.WEBPAY_LIVE_ENABLED !== 'true' || !process.env.APP_URL?.startsWith('https://') || !commerce || !key) {
      throw new Error('Webpay de producción requiere habilitación, HTTPS y credenciales')
    }
    return new WebpayPlus.Transaction(new Options(commerce, key, Environment.Production, 15000))
  }
  return new WebpayPlus.Transaction(new Options(
    commerce || IntegrationCommerceCodes.WEBPAY_PLUS, key || IntegrationApiKeys.WEBPAY, Environment.Integration, 15000,
  ))
}