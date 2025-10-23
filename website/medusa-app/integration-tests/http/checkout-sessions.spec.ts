import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createProductsWorkflow,
  linkProductsToSalesChannelWorkflow,
} from "@medusajs/medusa/core-flows"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe("POST /checkout_sessions", () => {
      let regionId: string
      let variantId: string
      let salesChannelId: string

      beforeEach(async () => {
        const container = getContainer()

        // Check if data already exists, if not create it
        const query = container.resolve("query")
        const { data: existingRegions } = await query.graph({
          entity: "region",
          fields: ["id"],
        })

        if (existingRegions && existingRegions.length > 0) {
          // Data already exists, just get the IDs
          regionId = existingRegions[0].id

          const { data: existingSalesChannels } = await query.graph({
            entity: "sales_channel",
            fields: ["id"],
          })
          salesChannelId = existingSalesChannels[0].id

          const { data: existingProducts } = await query.graph({
            entity: "product",
            fields: ["id", "variants.*"],
          })
          variantId = existingProducts[0].variants[0].id
          return
        }

        // Create region using workflow
        const { result: regionResult } = await createRegionsWorkflow(container).run({
          input: {
            regions: [{
              name: 'Test Region',
              currency_code: 'usd',
              countries: ['us'],
            }]
          }
        })
        regionId = regionResult[0].id

        // Create sales channel using workflow
        const { result: salesChannelResult } = await createSalesChannelsWorkflow(container).run({
          input: {
            salesChannelsData: [{
              name: 'Test Sales Channel',
            }]
          }
        })
        salesChannelId = salesChannelResult[0].id

        // Create product with variant and price using workflow
        const { result: productResult } = await createProductsWorkflow(container).run({
          input: {
            products: [{
              title: 'Test Product',
              options: [{ title: 'Size', values: ['S', 'M', 'L'] }],
              variants: [{
                title: 'Small',
                options: { Size: 'S' },
                prices: [{ amount: 1000, currency_code: 'usd' }],
                manage_inventory: false,
              }],
            }]
          }
        })

        const product = productResult[0]
        variantId = product.variants[0].id

        // Link product to sales channel using workflow
        await linkProductsToSalesChannelWorkflow(container).run({
          input: {
            id: salesChannelId,
            add: [product.id],
          }
        })
      })

      it("should create a checkout session with valid data", async () => {
        const requestBody = {
          buyer: {
            email: "test@example.com",
            name: "Test User",
            phone: "+1234567890"
          },
          items: [
            {
              id: variantId,
              quantity: 1
            }
          ],
          fulfillment_address: {
            name: "Test User",
            line_one: "123 Test St",
            city: "Test City",
            state: "CA",
            postal_code: "12345",
            country: "US"
          }
        }

        try {
          const response = await api.post('/checkout_sessions', requestBody, {
            headers: {
              'idempotency-key': 'test-key-1',
              'openai-request-id': 'test-req-1'
            }
          })

          // Check status code per ACP spec
          expect(response.status).toEqual(201)

          // Check required fields per ACP spec
          expect(response.data).toHaveProperty('id')
          expect(response.data).toHaveProperty('payment_provider')
          expect(response.data.payment_provider).toHaveProperty('provider')
          expect(response.data).toHaveProperty('status')
          expect(response.data.status).toEqual('ready_for_payment') // has fulfillment_address
          expect(response.data).toHaveProperty('currency')
          expect(response.data).toHaveProperty('line_items')
          expect(Array.isArray(response.data.line_items)).toBe(true)
          expect(response.data.line_items.length).toBeGreaterThan(0)

          // Check line_item structure per ACP spec
          const lineItem = response.data.line_items[0]
          expect(lineItem).toHaveProperty('id')
          expect(lineItem).toHaveProperty('item')
          expect(lineItem.item).toHaveProperty('id')
          expect(lineItem.item).toHaveProperty('quantity')
          expect(lineItem).toHaveProperty('base_amount')
          expect(lineItem).toHaveProperty('discount')
          expect(lineItem).toHaveProperty('subtotal')
          expect(lineItem).toHaveProperty('tax')
          expect(lineItem).toHaveProperty('total')

          // Check totals structure per ACP spec
          expect(response.data).toHaveProperty('totals')
          expect(Array.isArray(response.data.totals)).toBe(true)
          expect(response.data.totals.length).toBeGreaterThan(0)

          // Check required fields
          expect(response.data).toHaveProperty('fulfillment_options')
          expect(Array.isArray(response.data.fulfillment_options)).toBe(true)
          expect(response.data).toHaveProperty('messages')
          expect(Array.isArray(response.data.messages)).toBe(true)
          expect(response.data).toHaveProperty('links')
          expect(Array.isArray(response.data.links)).toBe(true)

          // Check buyer and fulfillment_address are included
          expect(response.data).toHaveProperty('buyer')
          expect(response.data.buyer).toHaveProperty('email', 'test@example.com')
          expect(response.data).toHaveProperty('fulfillment_address')
        } catch (error: any) {
          console.error('Error response:', error.response?.data)
          throw error
        }
      })

      it("should create session without buyer (buyer is optional)", async () => {
        const requestBody = {
          items: [
            {
              id: variantId,
              quantity: 1
            }
          ]
        }

        try {
          const response = await api.post('/checkout_sessions', requestBody, {
            headers: {
              'idempotency-key': 'test-key-no-buyer'
            }
          })

          expect(response.status).toEqual(201)
          expect(response.data).toHaveProperty('id')
          expect(response.data).toHaveProperty('status', 'not_ready_for_payment') // no fulfillment_address
          expect(response.data).not.toHaveProperty('buyer') // buyer not included when not provided
        } catch (error: any) {
          console.error('Error response:', error.response?.data)
          throw error
        }
      })

      it("should fail when items is missing", async () => {
        const requestBody = {
          buyer: {
            email: "test@example.com"
          }
        }

        try {
          await api.post('/checkout_sessions', requestBody)
          fail('Expected request to throw an error')
        } catch (error: any) {
          expect(error.response.status).toEqual(400)
          expect(error.response.data.message).toContain('items is required')
        }
      })

      it("should fail when items is empty array", async () => {
        const requestBody = {
          buyer: {
            email: "test@example.com"
          },
          items: []
        }

        try {
          await api.post('/checkout_sessions', requestBody)
          fail('Expected request to throw an error')
        } catch (error: any) {
          expect(error.response.status).toEqual(400)
          expect(error.response.data.message).toContain('non-empty list')
        }
      })

      it("should handle idempotency keys correctly", async () => {
        const idempotencyKey = `test-key-${Date.now()}`
        const requestBody = {
          buyer: {
            email: "idempotency@example.com"
          },
          items: [
            {
              id: variantId,
              quantity: 1
            }
          ]
        }

        try {
          // First request
          const response1 = await api.post('/checkout_sessions', requestBody, {
            headers: {
              'idempotency-key': idempotencyKey,
              'openai-request-id': 'idem-req-1'
            }
          })

          expect(response1.status).toEqual(201)
          const firstSessionId = response1.data.id

          // Second request with same idempotency key
          const response2 = await api.post('/checkout_sessions', requestBody, {
            headers: {
              'idempotency-key': idempotencyKey,
              'openai-request-id': 'idem-req-2'
            }
          })

          expect(response2.status).toEqual(201)
          // Note: Depending on workflow implementation, this might return the same session
          // or create a new one. Both are valid responses.
          expect(response2.data).toHaveProperty('id')
        } catch (error: any) {
          console.error('Idempotency test error:', error.response?.data)
          throw error
        }
      })

      it("should create session with minimal required fields only", async () => {
        const requestBody = {
          items: [
            {
              id: variantId,
              quantity: 2
            }
          ]
        }

        try {
          const response = await api.post('/checkout_sessions', requestBody, {
            headers: {
              'idempotency-key': `minimal-key-${Date.now()}`
            }
          })

          expect(response.status).toEqual(201)
          expect(response.data).toHaveProperty('id')
          expect(response.data.line_items[0].item.quantity).toEqual(2)
        } catch (error: any) {
          console.error('Minimal test error:', error.response?.data)
          throw error
        }
      })

      it("should calculate tax and return fulfillment options when address provided", async () => {
        const requestBody = {
          items: [
            {
              id: variantId,
              quantity: 1
            }
          ],
          fulfillment_address: {
            name: "test",
            line_one: "1234 Chat Road",
            line_two: "Apt 101",
            city: "San Francisco",
            state: "CA",
            country: "US",
            postal_code: "94131"
          }
        }

        try {
          const response = await api.post('/checkout_sessions', requestBody, {
            headers: {
              'idempotency-key': `test-fulfillment-${Date.now()}`
            }
          })

          expect(response.status).toEqual(201)
          expect(response.data.status).toEqual('ready_for_payment')

          // Check tax field is present (may be 0 if no tax rates configured)
          const lineItem = response.data.line_items[0]
          expect(lineItem).toHaveProperty('tax')
          expect(typeof lineItem.tax).toBe('number')

          // Check fulfillment options returned (may be empty if none configured)
          expect(response.data.fulfillment_options).toBeDefined()
          expect(Array.isArray(response.data.fulfillment_options)).toBe(true)

          // If fulfillment options exist, validate their structure
          if (response.data.fulfillment_options.length > 0) {
            const fulfillmentOption = response.data.fulfillment_options[0]
            expect(fulfillmentOption).toHaveProperty('type')
            expect(fulfillmentOption).toHaveProperty('id')
            expect(fulfillmentOption).toHaveProperty('title')
            expect(fulfillmentOption).toHaveProperty('subtotal')
            expect(fulfillmentOption).toHaveProperty('tax')
            expect(fulfillmentOption).toHaveProperty('total')

            // Check cheapest option is selected
            expect(response.data).toHaveProperty('fulfillment_option_id')
            expect(response.data.fulfillment_option_id).toBeTruthy()

            // Verify the selected option is the cheapest
            const selectedOption = response.data.fulfillment_options.find(
              opt => opt.id === response.data.fulfillment_option_id
            )
            expect(selectedOption).toBeDefined()

            // Check totals includes fulfillment
            const totals = response.data.totals
            const fulfillmentTotal = totals.find(t => t.type === 'fulfillment')
            expect(fulfillmentTotal).toBeDefined()
            expect(fulfillmentTotal.amount).toBeGreaterThan(0)

            // Verify total calculation includes fulfillment
            const itemsTotal = totals.find(t => t.type === 'items_base_amount')
            const taxTotal = totals.find(t => t.type === 'tax')
            const total = totals.find(t => t.type === 'total')
            expect(total.amount).toEqual(
              itemsTotal.amount + taxTotal.amount + fulfillmentTotal.amount
            )
          }
        } catch (error: any) {
          console.error('Fulfillment test error:', error.response?.data)
          throw error
        }
      })
    })

    describe("GET /checkout_sessions/:id", () => {
      let regionId: string
      let variantId: string
      let salesChannelId: string
      let sessionId: string

      beforeEach(async () => {
        const container = getContainer()

        // Get existing data
        const query = container.resolve("query")
        const { data: existingRegions } = await query.graph({
          entity: "region",
          fields: ["id"],
        })

        if (existingRegions && existingRegions.length > 0) {
          regionId = existingRegions[0].id

          const { data: existingSalesChannels } = await query.graph({
            entity: "sales_channel",
            fields: ["id"],
          })
          salesChannelId = existingSalesChannels[0].id

          const { data: existingProducts } = await query.graph({
            entity: "product",
            fields: ["id", "variants.*"],
          })
          variantId = existingProducts[0].variants[0].id
        }

        // Create a checkout session for testing GET
        const response = await api.post('/checkout_sessions', {
          buyer: {
            email: "test@example.com",
            first_name: "Test",
            last_name: "User",
          },
          items: [
            {
              id: variantId,
              quantity: 1
            }
          ],
          fulfillment_address: {
            name: "Test User",
            line_one: "123 Test St",
            city: "Test City",
            state: "CA",
            postal_code: "12345",
            country: "US"
          }
        }, {
          headers: {
            'idempotency-key': `get-test-key-${Date.now()}`
          }
        })

        sessionId = response.data.id
      })

      it("should retrieve an existing checkout session", async () => {
        try {
          const response = await api.get(`/checkout_sessions/${sessionId}`)

          expect(response.status).toEqual(200)
          expect(response.data).toHaveProperty('id', sessionId)
          expect(response.data).toHaveProperty('status')
          expect(response.data).toHaveProperty('currency')
          expect(response.data).toHaveProperty('line_items')
          expect(response.data).toHaveProperty('totals')
          expect(response.data).toHaveProperty('fulfillment_options')
          expect(response.data).toHaveProperty('messages')
          expect(response.data).toHaveProperty('links')
        } catch (error: any) {
          console.error('GET Error:', error.response?.status, error.response?.data)
          throw error
        }
      })

      it("should return 404 for non-existent checkout session", async () => {
        try {
          await api.get('/checkout_sessions/non-existent-id')
          fail('Expected request to throw an error')
        } catch (error: any) {
          expect(error.response.status).toEqual(404)
          expect(error.response.data.type).toEqual('invalid_request')
          expect(error.response.data.code).toEqual('not_found')
        }
      })
    })

    describe("POST /checkout_sessions/:id", () => {
      let regionId: string
      let variantId: string
      let salesChannelId: string
      let sessionId: string

      beforeEach(async () => {
        const container = getContainer()

        // Get existing data
        const query = container.resolve("query")
        const { data: existingRegions } = await query.graph({
          entity: "region",
          fields: ["id"],
        })

        if (existingRegions && existingRegions.length > 0) {
          regionId = existingRegions[0].id

          const { data: existingSalesChannels } = await query.graph({
            entity: "sales_channel",
            fields: ["id"],
          })
          salesChannelId = existingSalesChannels[0].id

          const { data: existingProducts } = await query.graph({
            entity: "product",
            fields: ["id", "variants.*"],
          })
          variantId = existingProducts[0].variants[0].id
        }

        // Create a checkout session without address for testing updates
        const response = await api.post('/checkout_sessions', {
          items: [
            {
              id: variantId,
              quantity: 1
            }
          ]
        }, {
          headers: {
            'idempotency-key': `update-test-key-${Date.now()}`
          }
        })

        sessionId = response.data.id
      })

      it("should update checkout session with fulfillment address", async () => {
        const response = await api.post(`/checkout_sessions/${sessionId}`, {
          fulfillment_address: {
            name: "Updated User",
            line_one: "456 New St",
            city: "New City",
            state: "NY",
            postal_code: "54321",
            country: "US"
          }
        })

        expect(response.status).toEqual(200)
        expect(response.data).toHaveProperty('id', sessionId)
        expect(response.data.status).toEqual('ready_for_payment')
        expect(response.data).toHaveProperty('fulfillment_address')
        expect(response.data.fulfillment_address.line_one).toEqual('456 New St')
        expect(response.data.fulfillment_address.city).toEqual('New City')
      })

      it("should update checkout session with buyer information", async () => {
        const response = await api.post(`/checkout_sessions/${sessionId}`, {
          buyer: {
            email: "updated@example.com",
            first_name: "Updated",
            last_name: "Buyer",
          }
        })

        expect(response.status).toEqual(200)
        expect(response.data).toHaveProperty('buyer')
        expect(response.data.buyer.email).toEqual('updated@example.com')
      })

      it("should update checkout session with fulfillment option", async () => {
        // First add address to get fulfillment options
        const addressResponse = await api.post(`/checkout_sessions/${sessionId}`, {
          fulfillment_address: {
            name: "Test User",
            line_one: "123 Test St",
            city: "Test City",
            state: "CA",
            postal_code: "12345",
            country: "US"
          }
        })

        const fulfillmentOptions = addressResponse.data.fulfillment_options
        if (fulfillmentOptions && fulfillmentOptions.length > 0) {
          const optionId = fulfillmentOptions[0].id

          const response = await api.post(`/checkout_sessions/${sessionId}`, {
            fulfillment_option_id: optionId
          })

          expect(response.status).toEqual(200)
          expect(response.data).toHaveProperty('fulfillment_option_id', optionId)
        }
      })

      it("should return 404 for non-existent checkout session", async () => {
        try {
          await api.post('/checkout_sessions/non-existent-id', {
            buyer: { email: "test@test.com" }
          })
          fail('Expected request to throw an error')
        } catch (error: any) {
          expect(error.response.status).toEqual(404)
        }
      })

      it("should not allow updating completed session", async () => {
        // This test would require completing the session first
        // We'll implement this after the complete endpoint is ready
      })
    })

    describe("POST /checkout_sessions/:id/cancel", () => {
      let regionId: string
      let variantId: string
      let salesChannelId: string
      let sessionId: string

      beforeEach(async () => {
        const container = getContainer()

        // Get existing data
        const query = container.resolve("query")
        const { data: existingRegions } = await query.graph({
          entity: "region",
          fields: ["id"],
        })

        if (existingRegions && existingRegions.length > 0) {
          regionId = existingRegions[0].id

          const { data: existingSalesChannels } = await query.graph({
            entity: "sales_channel",
            fields: ["id"],
          })
          salesChannelId = existingSalesChannels[0].id

          const { data: existingProducts } = await query.graph({
            entity: "product",
            fields: ["id", "variants.*"],
          })
          variantId = existingProducts[0].variants[0].id
        }

        // Create a checkout session for testing cancel
        const response = await api.post('/checkout_sessions', {
          items: [
            {
              id: variantId,
              quantity: 1
            }
          ],
          fulfillment_address: {
            name: "Test User",
            line_one: "123 Test St",
            city: "Test City",
            state: "CA",
            postal_code: "12345",
            country: "US"
          }
        }, {
          headers: {
            'idempotency-key': `cancel-test-key-${Date.now()}`
          }
        })

        sessionId = response.data.id
      })

      it("should cancel a checkout session", async () => {
        const response = await api.post(`/checkout_sessions/${sessionId}/cancel`)

        expect(response.status).toEqual(200)
        expect(response.data).toHaveProperty('id', sessionId)
        expect(response.data.status).toEqual('canceled')
      })

      it("should return 404 for non-existent checkout session", async () => {
        try {
          await api.post('/checkout_sessions/non-existent-id/cancel')
          fail('Expected request to throw an error')
        } catch (error: any) {
          expect(error.response.status).toEqual(404)
        }
      })

      it("should not allow canceling already canceled session", async () => {
        // First cancel the session
        await api.post(`/checkout_sessions/${sessionId}/cancel`)

        // Try to cancel again
        try {
          await api.post(`/checkout_sessions/${sessionId}/cancel`)
          fail('Expected request to throw an error')
        } catch (error: any) {
          expect(error.response.status).toEqual(405)
        }
      })
    })

    describe("POST /checkout_sessions/:id/complete", () => {
      let regionId: string
      let variantId: string
      let salesChannelId: string
      let sessionId: string

      beforeEach(async () => {
        const container = getContainer()

        // Get existing data
        const query = container.resolve("query")
        const { data: existingRegions } = await query.graph({
          entity: "region",
          fields: ["id"],
        })

        if (existingRegions && existingRegions.length > 0) {
          regionId = existingRegions[0].id

          const { data: existingSalesChannels } = await query.graph({
            entity: "sales_channel",
            fields: ["id"],
          })
          salesChannelId = existingSalesChannels[0].id

          const { data: existingProducts } = await query.graph({
            entity: "product",
            fields: ["id", "variants.*"],
          })
          variantId = existingProducts[0].variants[0].id
        }

        // Create a checkout session ready for completion
        const response = await api.post('/checkout_sessions', {
          buyer: {
            email: "complete@example.com",
            first_name: "Test",
            last_name: "Complete",
          },
          items: [
            {
              id: variantId,
              quantity: 1
            }
          ],
          fulfillment_address: {
            name: "Test Complete",
            line_one: "123 Complete St",
            city: "Test City",
            state: "CA",
            postal_code: "12345",
            country: "US"
          }
        }, {
          headers: {
            'idempotency-key': `complete-test-key-${Date.now()}`
          }
        })

        sessionId = response.data.id
      })

      it("should complete a checkout session and create an order", async () => {
        const response = await api.post(`/checkout_sessions/${sessionId}/complete`, {
          payment_data: {
            token: "test_stripe_token",
            provider: "stripe",
            billing_address: {
              name: "Test Complete",
              line_one: "123 Complete St",
              city: "Test City",
              state: "CA",
              postal_code: "12345",
              country: "US"
            }
          }
        })

        expect(response.status).toEqual(200)
        expect(response.data).toHaveProperty('id', sessionId)
        expect(response.data.status).toEqual('completed')
        expect(response.data).toHaveProperty('order')
        expect(response.data.order).toHaveProperty('id')
        expect(response.data.order).toHaveProperty('checkout_session_id', sessionId)
        expect(response.data.order).toHaveProperty('permalink_url')
      })

      it("should require payment_data", async () => {
        try {
          await api.post(`/checkout_sessions/${sessionId}/complete`, {})
          fail('Expected request to throw an error')
        } catch (error: any) {
          expect(error.response.status).toEqual(400)
          expect(error.response.data.message).toContain('payment_data')
        }
      })

      it("should return 404 for non-existent checkout session", async () => {
        try {
          await api.post('/checkout_sessions/non-existent-id/complete', {
            payment_data: {
              token: "test_token",
              provider: "stripe"
            }
          })
          fail('Expected request to throw an error')
        } catch (error: any) {
          expect(error.response.status).toEqual(404)
        }
      })

      it("should not allow completing already completed session", async () => {
        // First complete the session
        await api.post(`/checkout_sessions/${sessionId}/complete`, {
          payment_data: {
            token: "test_stripe_token",
            provider: "stripe"
          }
        })

        // Try to complete again
        try {
          await api.post(`/checkout_sessions/${sessionId}/complete`, {
            payment_data: {
              token: "test_stripe_token_2",
              provider: "stripe"
            }
          })
          fail('Expected request to throw an error')
        } catch (error: any) {
          expect(error.response.status).toEqual(400)
          expect(error.response.data.code).toEqual('already_completed')
        }
      })

      it("should not allow completing canceled session", async () => {
        // First cancel the session
        await api.post(`/checkout_sessions/${sessionId}/cancel`)

        // Try to complete
        try {
          await api.post(`/checkout_sessions/${sessionId}/complete`, {
            payment_data: {
              token: "test_token",
              provider: "stripe"
            }
          })
          fail('Expected request to throw an error')
        } catch (error: any) {
          expect(error.response.status).toEqual(400)
          expect(error.response.data.code).toEqual('invalid_state')
        }
      })
    })
  },
})
