/**
 * Blocksquare TVL Adapter
 *
 * This adapter calculates the TVL of Blocksquare property tokens.
 * Data source: Envio GraphQL API
 * - Each PropertyToken has a `propertyValuation` field, denominated in DAI (wei units).
 * - TVL is the sum of all active property valuations where propertyValuation > 0.
 */

const ADDRESSES = require('../helper/coreAssets.json')
const axios = require('axios')

// ----------------------------
// Constants
// ----------------------------

// GraphQL endpoint for fetching property tokens
const ENDPOINT = 'https://indexer.hyperindex.xyz/d32ae7c/v1/graphql'

// Query: fetch active property tokens with non-zero valuations
const ACTIVE_PROPERTIES_QUERY = `
  query ActivePropertyTokens {
    PropertyToken(
      where: { propertyValuation: { _gt: "0" } }
    ) {
      id
      contractAddress
      countryCode
      name
      symbol
      propertyValuation
    }
  }
`

// ----------------------------
// Helpers
// ----------------------------

/**
 * Fetch property tokens from Envio GraphQL endpoint
 * @returns {Promise<Array>} Array of property tokens
 */
async function fetchProperties() {
  const payload = {
    query: ACTIVE_PROPERTIES_QUERY,
    headers: { "Content-Type": "application/json" },
  }

  const response = await axios.post(ENDPOINT, payload)
  return response.data.data.PropertyToken
}

/**
 * Calculate TVL on Ethereum for Blocksquare property tokens.
 * Each property's valuation is already denominated in DAI.
 *
 * @returns {Promise<Object>} Balances object with DAI as the key
 */
async function ethereumTvl() {
  const properties = await fetchProperties()

  // Sum all active property valuations
  const totalValuation = properties.reduce(
    (acc, property) => acc + BigInt(property.propertyValuation),
    0n
  )

  // Return balances object (DAI address -> amount in wei as string)
  return {
    [ADDRESSES.ethereum.DAI]: totalValuation.toString(),
  }
}

// ----------------------------
// Module Exports
// ----------------------------

module.exports = {
  methodology: `TVL is calculated by summing the DAI-denominated valuations of all active Blocksquare property tokens fetched from the Envio GraphQL API.`,
  ethereum: {
    tvl: ethereumTvl,
  },
}


/*
Example PropertyToken object returned by API:

{
  "id": "1-0x071e599531F502c071Ba9F18298425178BAE2bd2",
  "contractAddress": "0x071e599531F502c071Ba9F18298425178BAE2bd2",
  "countryCode": "SI",
  "name": "Student house Vrhovci, Ljubljana, Slovenia",
  "symbol": "BSPT-OCN-15"
  "propertyValuation": "764000000000000000000000",
}
*/
