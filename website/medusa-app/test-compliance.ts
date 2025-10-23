/**
 * Test script to verify compliance checking with test-import-unique.json
 */
import * as fs from 'fs'
import * as path from 'path'
import { ShopifyImportSchema } from './src/lib/shopify-data-util'
import {
    generateComplianceReport,
    ACP_PRODUCT_COMPLIANCE_FIELDS,
    ACP_VARIANT_COMPLIANCE_FIELDS,
    ACP_PERFORMANCE_COMPLIANCE_FIELDS,
    ACP_SHIPPING_COMPLIANCE_FIELDS,
    ACP_MERCHANT_COMPLIANCE_FIELDS,
    ACP_RETURNS_COMPLIANCE_FIELDS,
} from './src/lib/compliance-data-util'

// Read test file
const testFilePath = path.join(__dirname, 'test-import-unique.json')
const testData = JSON.parse(fs.readFileSync(testFilePath, 'utf-8'))

console.log('='.repeat(80))
console.log('COMPLIANCE TEST - Loading test data')
console.log('='.repeat(80))
console.log('Test file:', testFilePath)
console.log('Has data.products:', !!testData.data?.products)
console.log('Has data.shop:', !!testData.data?.shop)
console.log('Product count:', testData.data?.products?.edges?.length || 0)
console.log('')

// Validate schema
console.log('='.repeat(80))
console.log('COMPLIANCE TEST - Validating schema')
console.log('='.repeat(80))
const validatedData = ShopifyImportSchema.parse(testData)
console.log('✓ Schema validation passed')
console.log('')

// Extract products and shop
const products = validatedData.products
const shop = validatedData.shop_info

console.log('='.repeat(80))
console.log('COMPLIANCE TEST - Shop data extraction')
console.log('='.repeat(80))
console.log('Shop name:', shop?.name)
console.log('Shop URL:', shop?.primaryDomain?.url || shop?.url)
console.log('Privacy policy:', shop?.shopPolicies?.find(p => p.type === "PRIVACY_POLICY")?.url)
console.log('Terms of service:', shop?.shopPolicies?.find(p => p.type === "TERMS_OF_SERVICE")?.url)
console.log('Shipping rates count:', shop?.shippingRates?.length || 0)
console.log('First shipping rate:', shop?.shippingRates?.[0])
console.log('')

// Generate compliance report
console.log('='.repeat(80))
console.log('COMPLIANCE TEST - Generating compliance report')
console.log('='.repeat(80))
const report = generateComplianceReport(products, shop)

console.log('Total products:', report.total_products)
console.log('Overall score:', report.overall_score)
console.log('Compliant products:', report.compliant_products)
console.log('Needs improvement:', report.needs_improvement)
console.log('Non-compliant:', report.non_compliant)
console.log('')

// Test first product
if (report.product_scores.length > 0) {
    const firstProduct = report.product_scores[0]
    console.log('='.repeat(80))
    console.log('COMPLIANCE TEST - First product analysis')
    console.log('='.repeat(80))
    console.log('Product:', firstProduct.title)
    console.log('Compliance score:', firstProduct.compliance_score)
    console.log('Status:', firstProduct.status)
    console.log('Total fields:', firstProduct.total_fields)
    console.log('Filled fields:', firstProduct.filled_fields)
    console.log('Missing field count:', firstProduct.missing_fields.length)
    console.log('Variant count:', firstProduct.variants.length)
    console.log('')

    if (firstProduct.warnings.length > 0) {
        console.log('Warnings:')
        firstProduct.warnings.forEach(w => console.log(`  - ${w}`))
        console.log('')
    }

    if (firstProduct.missing_fields.length > 0) {
        console.log('Missing fields:')
        firstProduct.missing_fields.forEach(f => {
            console.log(`  - ${f.displayName} (${f.field})${f.critical ? ' [CRITICAL]' : ''} [weight: ${f.weight}]`)
        })
        console.log('')
    }

    if (firstProduct.variants.length > 0) {
        const firstVariant = firstProduct.variants[0]
        console.log('First variant:')
        console.log('  Title:', firstVariant.variant_title)
        console.log('  SKU:', firstVariant.sku)
        console.log('  Missing field count:', firstVariant.missing_fields.length)
        if (firstVariant.missing_fields.length > 0) {
            console.log('  Missing fields:')
            firstVariant.missing_fields.forEach(f => {
                console.log(`    - ${f.displayName} (${f.field})${f.critical ? ' [CRITICAL]' : ''}`)
            })
        }
        console.log('  Variant data:', firstVariant.variant_data)
        console.log('')
    }
}

// Show field coverage
console.log('='.repeat(80))
console.log('COMPLIANCE TEST - Field Coverage')
console.log('='.repeat(80))

// Group by source
const productFields = Object.values(report.field_coverage).filter(f => ACP_PRODUCT_COMPLIANCE_FIELDS.find(r => r.field === f.field))
const variantFields = Object.values(report.field_coverage).filter(f => ACP_VARIANT_COMPLIANCE_FIELDS.find(r => r.field === f.field))
const performanceFields = Object.values(report.field_coverage).filter(f => ACP_PERFORMANCE_COMPLIANCE_FIELDS.find(r => r.field === f.field))
const shippingFields = Object.values(report.field_coverage).filter(f => ACP_SHIPPING_COMPLIANCE_FIELDS.find(r => r.field === f.field))
const merchantFields = Object.values(report.field_coverage).filter(f => ACP_MERCHANT_COMPLIANCE_FIELDS.find(r => r.field === f.field))
const returnsFields = Object.values(report.field_coverage).filter(f => ACP_RETURNS_COMPLIANCE_FIELDS.find(r => r.field === f.field))

console.log('\nProduct Fields:')
productFields.forEach(f => {
    console.log(`  ${f.displayName}: ${f.percentage}% (${f.filled}/${f.filled + f.missing})${f.critical ? ' [CRITICAL]' : ''}`)
})

console.log('\nVariant Fields:')
variantFields.forEach(f => {
    console.log(`  ${f.displayName}: ${f.percentage}% (${f.filled}/${f.filled + f.missing})${f.critical ? ' [CRITICAL]' : ''}`)
})

console.log('\nPerformance Fields:')
performanceFields.forEach(f => {
    console.log(`  ${f.displayName}: ${f.percentage}% (${f.filled}/${f.filled + f.missing})${f.critical ? ' [CRITICAL]' : ''}`)
    if (f.value) {
        console.log(`    Value: ${f.value}`)
    }
})

console.log('\nShipping/Fulfillment Fields:')
shippingFields.forEach(f => {
    console.log(`  ${f.displayName}: ${f.percentage}% (${f.filled}/${f.filled + f.missing})${f.critical ? ' [CRITICAL]' : ''}`)
    if (f.value) {
        console.log(`    Value: ${f.value}`)
    }
})

console.log('\nMerchant/Seller Fields:')
merchantFields.forEach(f => {
    console.log(`  ${f.displayName}: ${f.percentage}% (${f.filled}/${f.filled + f.missing})${f.critical ? ' [CRITICAL]' : ''}`)
    if (f.value) {
        console.log(`    Value: ${f.value}`)
    }
})

console.log('\nReturns Fields:')
returnsFields.forEach(f => {
    console.log(`  ${f.displayName}: ${f.percentage}% (${f.filled}/${f.filled + f.missing})${f.critical ? ' [CRITICAL]' : ''}`)
    if (f.value) {
        console.log(`    Value: ${f.value}`)
    }
})

console.log('='.repeat(80))
console.log('COMPLIANCE TEST - Complete')
console.log('='.repeat(80))
