import 'server-only'

import DodoPayments from 'dodopayments'

import { getDodoApiKey, getDodoServerEnvironment } from '@/lib/dodo/config'

let dodoClient: DodoPayments | null = null

export function getDodoClient() {
  if (!dodoClient) {
    dodoClient = new DodoPayments({
      bearerToken: getDodoApiKey(),
      environment: getDodoServerEnvironment(),
    })
  }

  return dodoClient
}
