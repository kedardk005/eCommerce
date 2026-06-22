import { test, describe, before, after } from 'node:test'
import assert from 'node:assert'
import { PrismaClient, OrderStatus, PaymentStatus, Role } from '@prisma/client'

const prisma = new PrismaClient()
const baseUrl = 'http://localhost:5001/api'

describe('Toy Cabin Integration Tests', () => {
  // Test globals to pass data between test cases
  let customerToken = ''
  let adminToken = ''
  let testUserEmail = ''
  let testUserPhone = ''
  let testUserId = ''
  let variantId = ''
  let productId = ''
  let addressId = ''
  let couponCode = ''
  let orderId1 = ''
  let orderId2 = ''
  let orderId3 = ''
  let orderItemId3 = ''
  let returnId3 = ''
  let initialStock = 0

  // Admin login details
  const adminEmail = 'owner@toycabin.com'
  const adminPassword = 'password123'

  before(async () => {
    // Generate unique email/phone for the test run
    const timestamp = Date.now()
    testUserEmail = `test-user-${timestamp}@example.com`
    testUserPhone = `+1555${String(timestamp).slice(-7)}`

    // Log in as admin to get admin token
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: adminEmail, password: adminPassword })
    })
    
    assert.strictEqual(res.status, 200, 'Admin login request failed')
    const data = await res.json() as any
    adminToken = data.accessToken
    assert.ok(adminToken, 'Admin login failed to return access token')

    // Find an in-stock variant to run catalog tests on
    const variant = await prisma.productVariant.findFirst({
      where: {
        stock: { gte: 10 },
        product: { status: { not: 'archived' } }
      },
      include: { product: true }
    })
    assert.ok(variant, 'No in-stock variant found in the database. Run seed script first.')
    variantId = variant.id
    productId = variant.productId
    initialStock = variant.stock
  })

  after(async () => {
    console.log('Cleaning up integration test data from DB...')
    try {
      if (returnId3) {
        await prisma.returnItem.deleteMany({ where: { returnId: returnId3 } })
        await prisma.return.delete({ where: { id: returnId3 } }).catch(() => {})
      }
      const orderIds = [orderId1, orderId2, orderId3].filter(Boolean)
      if (orderIds.length > 0) {
        await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
      }
      if (addressId) {
        await prisma.address.delete({ where: { id: addressId } }).catch(() => {})
      }
      if (couponCode) {
        await prisma.couponUsage.deleteMany({ where: { coupon: { code: couponCode } } })
        await prisma.coupon.delete({ where: { code: couponCode } }).catch(() => {})
      }
      if (testUserId) {
        await prisma.activityLog.deleteMany({ where: { actorId: testUserId } })
        await prisma.notificationPreference.deleteMany({ where: { userId: testUserId } })
        await prisma.cart.delete({ where: { userId: testUserId } }).catch(() => {})
        await prisma.wishlist.delete({ where: { userId: testUserId } }).catch(() => {})
        await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
      }
      await prisma.contactMessage.deleteMany({
        where: { name: 'Automated Contact Tester' }
      }).catch(() => {})
    } catch (err) {
      console.error('Error during cleanup:', err)
    } finally {
      await prisma.$disconnect()
    }
  })

  // 1. Signup -> OTP Verify -> Login -> Protected Route succeeds
  test('Authentication: Signup -> OTP Verify -> Login -> Get Protected Addresses', async () => {
    const signupPassword = 'test-password-123'
    
    // 1. Signup
    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Tester',
        email: testUserEmail,
        phone: testUserPhone,
        password: signupPassword
      })
    })
    assert.strictEqual(signupRes.status, 201, 'Signup should succeed')
    const signupData = await signupRes.json() as any
    assert.strictEqual(signupData.status, 'success')

    // Query DB for user ID
    const user = await prisma.user.findUnique({ where: { email: testUserEmail } })
    assert.ok(user, 'User should exist in database')
    testUserId = user.id

    // 2. Request OTP
    const otpReqRes = await fetch(`${baseUrl}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: testUserEmail })
    })
    assert.strictEqual(otpReqRes.status, 200, 'OTP request should succeed')

    // 3. Verify OTP using testing bypass code
    const otpVerifyRes = await fetch(`${baseUrl}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: testUserEmail, otp: '123456' })
    })
    assert.strictEqual(otpVerifyRes.status, 200, 'OTP verify should succeed')
    const verifyData = await otpVerifyRes.json() as any
    assert.ok(verifyData.accessToken, 'Verify should return access token')

    // 4. Log in
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: testUserEmail, password: signupPassword })
    })
    assert.strictEqual(loginRes.status, 200, 'Login should succeed')
    const loginData = await loginRes.json() as any
    customerToken = loginData.accessToken
    assert.ok(customerToken, 'Login should return customer JWT')

    // 5. Protected Request
    const protectedRes = await fetch(`${baseUrl}/addresses`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    })
    assert.strictEqual(protectedRes.status, 200, 'Protected address GET request should succeed')
  })

  // 2. Add to cart -> apply coupon -> checkout (COD) -> stock decrements -> appears in order history
  test('Checkout Flow: Add to cart -> Apply Coupon -> Checkout (COD) -> Verify stock decrement & Order history', async () => {
    // 1. Add address for the test user
    const addressRes = await fetch(`${baseUrl}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        line1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        phone: testUserPhone,
        isDefault: true
      })
    })
    assert.strictEqual(addressRes.status, 201, 'Address creation should succeed')
    const addressData = await addressRes.json() as any
    addressId = addressData.id
    assert.ok(addressId, 'Should return created address ID')

    // 2. Add item to cart
    const cartAddRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        productId,
        variantId,
        quantity: 1
      })
    })
    assert.strictEqual(cartAddRes.status, 200, 'Cart item add should succeed')

    // 3. Create a coupon in the database
    couponCode = `INTEGRATION-TEST-${Date.now()}`
    await prisma.coupon.create({
      data: {
        code: couponCode,
        type: 'flat',
        value: 1000,
        minOrder: 0,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true
      }
    })

    // 4. Apply Coupon to cart
    const couponApplyRes = await fetch(`${baseUrl}/cart/apply-coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ code: couponCode })
    })
    assert.strictEqual(couponApplyRes.status, 200, 'Coupon application should succeed')

    // 5. Checkout (COD)
    const checkoutRes = await fetch(`${baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        addressId,
        paymentMethod: 'cod',
        couponCode
      })
    })
    assert.strictEqual(checkoutRes.status, 201, 'Checkout should succeed')
    const checkoutData = await checkoutRes.json() as any
    orderId1 = checkoutData.id
    assert.ok(orderId1, 'Should return created Order ID')

    // 6. Verify Stock Decremented
    const updatedVariant = await prisma.productVariant.findUnique({ where: { id: variantId } })
    assert.ok(updatedVariant)
    assert.strictEqual(updatedVariant.stock, initialStock - 1, 'Stock should decrement by 1')

    // 7. Verify Order Appears in Order History
    const historyRes = await fetch(`${baseUrl}/orders`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    })
    assert.strictEqual(historyRes.status, 200, 'Orders list should load')
    const historyData = await historyRes.json() as any
    const orderExists = historyData.items.some((o: any) => o.id === orderId1)
    assert.ok(orderExists, 'Created order should exist in customer order history')
  })

  // 3. Place order -> cancel -> stock restores
  test('Order Cancellation: Place order -> Cancel -> Stock restores', async () => {
    // 1. Add item to cart
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ productId, variantId, quantity: 1 })
    })

    // 2. Checkout
    const checkoutRes = await fetch(`${baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ addressId, paymentMethod: 'cod' })
    })
    const checkoutData = await checkoutRes.json() as any
    orderId2 = checkoutData.id
    assert.ok(orderId2)

    // Stock should have decremented twice (once in test 2, once in test 3)
    const stockAfterCheckout = await prisma.productVariant.findUnique({ where: { id: variantId } })
    assert.strictEqual(stockAfterCheckout?.stock, initialStock - 2)

    // 3. Cancel Order
    const cancelRes = await fetch(`${baseUrl}/orders/${orderId2}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      }
    })
    assert.strictEqual(cancelRes.status, 200, 'Order cancellation should succeed')

    // 4. Verify Stock Restored
    const stockAfterCancel = await prisma.productVariant.findUnique({ where: { id: variantId } })
    assert.strictEqual(stockAfterCancel?.stock, initialStock - 1, 'Stock should restore after cancellation')
  })

  // 4. Place order -> mark delivered -> request return -> approve -> refund -> stock restores
  test('Return & Refund Lifecycle: Place order -> Transition to Delivered -> Create Return -> Approve -> Refund -> Stock restores', async () => {
    // 1. Add item to cart
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ productId, variantId, quantity: 1 })
    })

    // 2. Checkout
    const checkoutRes = await fetch(`${baseUrl}/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ addressId, paymentMethod: 'cod' })
    })
    const checkoutData = await checkoutRes.json() as any
    orderId3 = checkoutData.id
    assert.ok(orderId3)

    // Verify order items to get orderItemId
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId3 },
      include: { items: true }
    })
    assert.ok(dbOrder && dbOrder.items.length > 0)
    orderItemId3 = dbOrder.items[0].id

    // 3. Transition order status step-by-step to reach 'delivered' (requires admin authorization)
    const transitions = [
      OrderStatus.confirmed,
      OrderStatus.packed,
      OrderStatus.shipped,
      OrderStatus.out_for_delivery,
      OrderStatus.delivered
    ]
    for (const status of transitions) {
      const patchRes = await fetch(`${baseUrl}/admin/orders/${orderId3}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status })
      })
      assert.strictEqual(patchRes.status, 200, `Failed status transition to "${status}"`)
    }

    // 4. Request Return (Customer)
    const returnRes = await fetch(`${baseUrl}/orders/${orderId3}/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        items: [
          {
            orderItemId: orderItemId3,
            quantity: 1,
            reason: 'Defective toy'
          }
        ],
        comments: 'Integrations testing return comment'
      })
    })
    assert.strictEqual(returnRes.status, 201, 'Return request creation should succeed')
    const returnData = await returnRes.json() as any
    returnId3 = returnData.id
    assert.ok(returnId3)

    // 5. Approve Return (Admin)
    const approveRes = await fetch(`${baseUrl}/admin/returns/${returnId3}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ notes: 'Approve test' })
    })
    assert.strictEqual(approveRes.status, 200, 'Return approval should succeed')

    // Check stock before refund - stock should still be decremented
    const stockBeforeRefund = await prisma.productVariant.findUnique({ where: { id: variantId } })
    assert.strictEqual(stockBeforeRefund?.stock, initialStock - 2)

    // 6. Process Refund (Admin)
    const refundRes = await fetch(`${baseUrl}/admin/returns/${returnId3}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    })
    assert.strictEqual(refundRes.status, 200, 'Issuing refund should succeed')

    // 7. Verify Stock Restored
    const stockAfterRefund = await prisma.productVariant.findUnique({ where: { id: variantId } })
    assert.strictEqual(stockAfterRefund?.stock, initialStock - 1, 'Stock should restore after successful refund processing')
  })

  // 5. Unauthorized access attempts return 403/404
  test('Authorization Gating: Unauthorized and cross-user resource access validation', async () => {
    // 1. Customer token tries to hit an admin route (GET /api/admin/orders)
    const adminRouteRes = await fetch(`${baseUrl}/admin/orders`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    })
    assert.ok([401, 403].includes(adminRouteRes.status), 'Customer accessing admin orders should return 401/403')

    // 2. Fetch another user's order details by ID
    // Create a second test user to login and try accessing orderId1
    const timestamp = Date.now() + 1000
    const user2Email = `test-user2-${timestamp}@example.com`
    const user2Phone = `+1555${String(timestamp).slice(-7)}`
    
    await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tester 2',
        email: user2Email,
        phone: user2Phone,
        password: 'password123'
      })
    })

    const login2Res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: user2Email, password: 'password123' })
    })
    const login2Data = await login2Res.json() as any
    const customer2Token = login2Data.accessToken
    assert.ok(customer2Token)

    // Access orderId1 owned by first user using customer2Token
    const crossOrderRes = await fetch(`${baseUrl}/orders/${orderId1}`, {
      headers: { 'Authorization': `Bearer ${customer2Token}` }
    })
    assert.ok([403, 404].includes(crossOrderRes.status), 'Cross-user order access should return 403/404')

    // Cleanup second user
    const user2 = await prisma.user.findUnique({ where: { email: user2Email } })
    if (user2) {
      await prisma.activityLog.deleteMany({ where: { actorId: user2.id } })
      await prisma.notificationPreference.deleteMany({ where: { userId: user2.id } })
      await prisma.cart.delete({ where: { userId: user2.id } }).catch(() => {})
      await prisma.wishlist.delete({ where: { userId: user2.id } }).catch(() => {})
      await prisma.user.delete({ where: { id: user2.id } }).catch(() => {})
    }
  })

  // 6. Contact messages: submit publicly, retrieve as admin, delete as admin
  test('Contact Messages API: Submit publicly -> Retrieve as Admin -> Delete as Admin', async () => {
    // 1. Submit contact message publicly (unauthenticated)
    const submitRes = await fetch(`${baseUrl}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Contact Tester',
        email: 'contact-test@example.com',
        subject: 'Product Question',
        message: 'Hello, this is a programmatic test query.'
      })
    })
    assert.strictEqual(submitRes.status, 201, 'Public contact submission should return 201')
    const submitData = await submitRes.json() as any
    const createdMsgId = submitData.id
    assert.ok(createdMsgId, 'Response should contain message ID')

    // 2. Fetch contact messages as admin
    const listRes = await fetch(`${baseUrl}/admin/contact-messages`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    assert.strictEqual(listRes.status, 200, 'Admin contact message list retrieval should succeed')
    const listData = await listRes.json() as any
    const foundMsg = listData.find((m: any) => m.id === createdMsgId)
    assert.ok(foundMsg, 'Created contact message should be in retrieved admin list')
    assert.strictEqual(foundMsg.name, 'Automated Contact Tester')

    // 3. Delete contact message as admin
    const deleteRes = await fetch(`${baseUrl}/admin/contact-messages/${createdMsgId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    assert.strictEqual(deleteRes.status, 200, 'Admin contact message delete should succeed')

    // 4. Verify message no longer exists
    const checkRes = await fetch(`${baseUrl}/admin/contact-messages`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    const checkData = await checkRes.json() as any
    const exists = checkData.some((m: any) => m.id === createdMsgId)
    assert.ok(!exists, 'Deleted contact message should not exist in list')
  })

  // 7. Admin Notifications: verify fetching alerts
  test('Admin Notifications API: Fetch dynamic alerts', async () => {
    const alertsRes = await fetch(`${baseUrl}/admin/notifications`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    assert.strictEqual(alertsRes.status, 200, 'Admin alerts retrieval should succeed')
    const alertsData = await alertsRes.json() as any
    assert.ok(Array.isArray(alertsData.items), 'Alerts should contain items array')
    assert.ok(alertsData.total >= 0, 'Should return total counter')
    
    // Check elements format
    if (alertsData.items.length > 0) {
      const alert = alertsData.items[0]
      assert.ok(alert.id, 'Alert should have id')
      assert.ok(alert.type, 'Alert should have type')
      assert.ok(alert.title, 'Alert should have title')
      assert.ok(alert.message, 'Alert should have message')
      assert.ok(alert.targetUrl, 'Alert should have targetUrl')
    }
  })
})
