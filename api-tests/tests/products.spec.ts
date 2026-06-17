import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Catalog - Products API Lifecycle Specs', () => {

  test('POST /products -> Should create a new entity successfully', async ({ request }) => {
    allure.epic('Catalog Management');
    allure.feature('Product Creation');
    allure.severity('critical');

    const payload = { name: 'Mechanical Keyboard', price: 89.99 };

    const response = await test.step('Dispatch POST request with raw item details', async () => {
      return await request.post('/products', { data: payload });
    });

    await allure.attachment('Create Request Payload', JSON.stringify(payload, null, 2), 'application/json');
    const body = await response.json();
    await allure.attachment('Create Response Body', JSON.stringify(body, null, 2), 'application/json');

    expect(response.status()).toBe(201);
    expect(body).toMatchObject(payload);
    expect(body.id).toBeDefined();
  });

  test('Full CRUD Lifecycle: Create -> Read -> Update -> Delete', async ({ request }) => {
    allure.epic('Catalog Management');
    allure.feature('Data Integrity Lifecycle');
    allure.severity('blocker');

    let productId: number;
    const initialItem = { name: 'Wireless Mouse', price: 25.50 };
    const updatedFields = { price: 19.99 };

    // 1. CREATE
    await test.step('Step 1: Provision temporary test item tracking identifiers', async () => {
      const res = await request.post('/products', { data: initialItem });
      expect(res.status()).toBe(201);
      const data = await res.json();
      productId = data.id;
    });

    // 2. READ
    await test.step('Step 2: Pull object back to assert persistence match', async () => {
      const res = await request.get(`/products/${productId}`);
      expect(res.status()).toBe(200);
      expect(await res.json()).toMatchObject({ id: productId, ...initialItem });
    });

    // 3. UPDATE (PATCH)
    await test.step('Step 3: Modify contextual details and update records', async () => {
      const res = await request.patch(`/products/${productId}`, { data: updatedFields });
      expect(res.status()).toBe(200);
      expect((await res.json()).price).toBe(19.99);
    });

    // 4. DELETE
    await test.step('Step 4: Clean up trace components and wipe database records', async () => {
      const res = await request.delete(`/products/${productId}`);
      expect(res.status()).toBe(200);
    });

    // 5. CONFIRM GONE
    await test.step('Step 5: Verify entity query response throws 404', async () => {
      const res = await request.get(`/products/${productId}`);
      expect(res.status()).toBe(404);
    });
  });

  test('Negative Verification -> Throw 404 on non-existent records', async ({ request }) => {
    allure.epic('Error Handling');
    allure.feature('Input Validation Integrity');
    allure.severity('normal');

    const response = await test.step('Query structural records on index out of range bounds', async () => {
      return await request.get('/products/99999');
    });

    const body = await response.json();
    await allure.attachment('Negative Response Schema Error Trace', JSON.stringify(body, null, 2), 'application/json');

    expect(response.status()).toBe(404);
    expect(body.message).toContain('Product with ID 99999 not found');
  });
});