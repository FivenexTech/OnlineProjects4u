import { describe, expect, it } from 'vitest'
import { calculateCouponDiscount } from '../src/services/coupons.js'

const items = [{ projectId: 'project-1', category: 'Web Development', unitPrice: 1000 }, { projectId: 'project-2', category: 'Python Projects', unitPrice: 500 }]

describe('coupon discount calculations', () => {
  it('calculates percentage discounts against eligible items', () => {
    const result = calculateCouponDiscount({ code: 'SAVE20', discountType: 'percentage', discountValue: 20, active: true, projectIds: [], categories: [], minimumOrderValue: 0 }, items)
    expect(result).toEqual({ eligibleSubtotal: 1500, discountAmount: 300 })
  })

  it('caps fixed discounts at the eligible purchase amount', () => {
    const result = calculateCouponDiscount({ code: 'SAVE2000', discountType: 'fixed', discountValue: 2000, active: true, projectIds: ['project-1'], categories: [], minimumOrderValue: 0 }, items)
    expect(result.discountAmount).toBe(1000)
  })

  it('rejects expired, inactive, minimum-value and inapplicable coupons', () => {
    expect(() => calculateCouponDiscount({ code: 'OLD', discountType: 'fixed', discountValue: 10, active: true, expiresAt: new Date('2020-01-01'), projectIds: [], categories: [], minimumOrderValue: 0 }, items)).toThrow('Coupon has expired')
    expect(() => calculateCouponDiscount({ code: 'OFF', discountType: 'fixed', discountValue: 10, active: false, projectIds: [], categories: [], minimumOrderValue: 0 }, items)).toThrow('Coupon is inactive')
    expect(() => calculateCouponDiscount({ code: 'MIN', discountType: 'fixed', discountValue: 10, active: true, projectIds: [], categories: [], minimumOrderValue: 2000 }, items)).toThrow('coupon minimum')
    expect(() => calculateCouponDiscount({ code: 'NOPE', discountType: 'fixed', discountValue: 10, active: true, projectIds: ['missing'], categories: [], minimumOrderValue: 0 }, items)).toThrow('does not apply')
  })
})
