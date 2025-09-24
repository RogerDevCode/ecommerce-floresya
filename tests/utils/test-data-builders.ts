/**
 * 🌸 FloresYa Advanced Test Data Builders - Silicon Valley Edition
 * Fluent builders for creating complex test data with relationships
 */

import { TestDataBuilder } from './mock-contracts';

// Base Builder Class
export abstract class BaseBuilder<T> implements TestDataBuilder<T> {
  protected data: Partial<T>;

  constructor(defaultData: T) {
    this.data = { ...defaultData };
  }

  with(overrides: Partial<T>): this {
    this.data = { ...this.data, ...overrides };
    return this;
  }

  build(): T {
    return this.data as T;
  }

  buildMany(count: number): T[] {
    return Array.from({ length: count }, () => this.build());
  }
}

// Product Builder
export class ProductBuilder extends BaseBuilder<any> {
  constructor() {
    super({
      id: 1,
      name: 'Rose Bouquet',
      summary: 'Beautiful red roses',
      description: 'A stunning bouquet of fresh red roses',
      price_usd: 75.00,
      price_ves: 37500.00,
      stock: 10,
      active: true,
      featured: false,
      carousel_order: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    });
  }

  withName(name: string): this {
    return this.with({ name });
  }

  withPrice(priceUsd: number): this {
    return this.with({ price_usd: priceUsd, price_ves: priceUsd * 500 });
  }

  withStock(stock: number): this {
    return this.with({ stock });
  }

  featured(): this {
    return this.with({ featured: true, carousel_order: 1 });
  }

  inactive(): this {
    return this.with({ active: false });
  }

  outOfStock(): this {
    return this.with({ stock: 0 });
  }

  withInvalidPrice(): this {
    return this.with({ price_usd: NaN });
  }
}

// Order Builder
export class OrderBuilder extends BaseBuilder<any> {
  private items: any[] = [];
  private payments: any[] = [];
  private statusHistory: any[] = [];

  constructor() {
    super({
      id: 1,
      user_id: 1,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+1234567890',
      total_amount_usd: 150.00,
      total_amount_ves: 75000.00,
      status: 'pending' as const,
      delivery_address: '123 Test Street',
      delivery_date: '2024-12-25',
      notes: 'Test order',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    });
  }

  withCustomerInfo(name: string, email: string, phone: string): this {
    return this.with({
      customer_name: name,
      customer_email: email,
      customer_phone: phone
    });
  }

  withDeliveryInfo(address: string, date: string): this {
    return this.with({
      delivery_address: address,
      delivery_date: date
    });
  }

  withStatus(status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'): this {
    return this.with({ status });
  }

  withTotalAmount(amount: number): this {
    return this.with({
      total_amount_usd: amount,
      total_amount_ves: amount * 500
    });
  }

  withItems(items: any[]): this {
    this.items = items;
    return this.with({
      total_amount_usd: items.reduce((sum, item) => sum + item.subtotal_usd, 0),
      total_amount_ves: items.reduce((sum, item) => sum + item.subtotal_ves, 0)
    });
  }

  addItem(productId: number, quantity: number, unitPrice: number): this {
    const item = {
      id: this.items.length + 1,
      order_id: this.data.id,
      product_id: productId,
      product_name: `Product ${productId}`,
      quantity,
      unit_price_usd: unitPrice,
      unit_price_ves: unitPrice * 500,
      subtotal_usd: quantity * unitPrice,
      subtotal_ves: quantity * unitPrice * 500,
      created_at: '2024-01-01T00:00:00Z'
    };

    this.items.push(item);
    return this.with({
      total_amount_usd: this.items.reduce((sum, item) => sum + item.subtotal_usd, 0),
      total_amount_ves: this.items.reduce((sum, item) => sum + item.subtotal_ves, 0)
    });
  }

  withPayments(payments: any[]): this {
    this.payments = payments;
    return this;
  }

  addPayment(amount: number, method: string, status: string = 'confirmed'): this {
    const payment = {
      id: this.payments.length + 1,
      order_id: this.data.id,
      amount_usd: amount,
      amount_ves: amount * 500,
      payment_method: method,
      status,
      transaction_id: `txn_${Date.now()}`,
      created_at: '2024-01-01T00:00:00Z'
    };

    this.payments.push(payment);
    return this;
  }

  withStatusHistory(history: any[]): this {
    this.statusHistory = history;
    return this;
  }

  addStatusChange(oldStatus: string, newStatus: string, notes: string, userId: number): this {
    const statusChange = {
      id: this.statusHistory.length + 1,
      order_id: this.data.id,
      old_status: oldStatus,
      new_status: newStatus,
      notes,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    this.statusHistory.push(statusChange);
    return this;
  }

  build(): any {
    return {
      ...this.data,
      items: this.items,
      payments: this.payments,
      status_history: this.statusHistory
    };
  }
}

// Order Item Builder
export class OrderItemBuilder extends BaseBuilder<any> {
  constructor() {
    super({
      id: 1,
      order_id: 1,
      product_id: 1,
      product_name: 'Rose Bouquet',
      product_summary: 'Beautiful red roses',
      quantity: 1,
      unit_price_usd: 75.00,
      unit_price_ves: 37500.00,
      subtotal_usd: 75.00,
      subtotal_ves: 37500.00,
      created_at: '2024-01-01T00:00:00Z'
    });
  }

  withProduct(productId: number, name: string, summary: string): this {
    return this.with({
      product_id: productId,
      product_name: name,
      product_summary: summary
    });
  }

  withQuantity(quantity: number): this {
    const unitPrice = this.data.unit_price_usd || 75.00;
    return this.with({
      quantity,
      subtotal_usd: quantity * unitPrice,
      subtotal_ves: quantity * unitPrice * 500
    });
  }

  withUnitPrice(price: number): this {
    const quantity = this.data.quantity || 1;
    return this.with({
      unit_price_usd: price,
      unit_price_ves: price * 500,
      subtotal_usd: quantity * price,
      subtotal_ves: quantity * price * 500
    });
  }
}

// User Builder
export class UserBuilder extends BaseBuilder<any> {
  constructor() {
    super({
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      phone: '+1234567890',
      role: 'customer' as const,
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    });
  }

  withRole(role: 'customer' | 'admin' | 'manager'): this {
    return this.with({ role });
  }

  admin(): this {
    return this.withRole('admin');
  }

  manager(): this {
    return this.withRole('manager');
  }

  inactive(): this {
    return this.with({ active: false });
  }
}

// Database State Builder
export class DatabaseStateBuilder {
  private state: Record<string, any[]> = {
    products: [],
    orders: [],
    users: [],
    order_items: [],
    payments: [],
    order_status_history: []
  };

  withProducts(products: any[]): this {
    this.state.products = products;
    return this;
  }

  withOrders(orders: any[]): this {
    this.state.orders = orders;
    return this;
  }

  withUsers(users: any[]): this {
    this.state.users = users;
    return this;
  }

  withOrderItems(items: any[]): this {
    this.state.order_items = items;
    return this;
  }

  withPayments(payments: any[]): this {
    this.state.payments = payments;
    return this;
  }

  withOrderStatusHistory(history: any[]): this {
    this.state.order_status_history = history;
    return this;
  }

  build(): Record<string, any[]> {
    return this.state;
  }
}

// Fluent Builder Factory
export class TestDataFactory {
  static product(): ProductBuilder {
    return new ProductBuilder();
  }

  static order(): OrderBuilder {
    return new OrderBuilder();
  }

  static orderItem(): OrderItemBuilder {
    return new OrderItemBuilder();
  }

  static user(): UserBuilder {
    return new UserBuilder();
  }

  static databaseState(): DatabaseStateBuilder {
    return new DatabaseStateBuilder();
  }

  // Pre-configured builders for common scenarios
  static validOrder(): OrderBuilder {
    return this.order()
      .addItem(1, 2, 75.00)
      .addPayment(150.00, 'credit_card');
  }

  static orderWithMultipleItems(): OrderBuilder {
    return this.order()
      .addItem(1, 1, 50.00)
      .addItem(2, 3, 25.00)
      .addItem(3, 1, 100.00)
      .addPayment(250.00, 'bank_transfer');
  }

  static orderWithStatusHistory(): OrderBuilder {
    return this.order()
      .addItem(1, 1, 75.00)
      .addStatusChange('pending', 'confirmed', 'Order confirmed', 1)
      .addStatusChange('confirmed', 'processing', 'Order is being prepared', 2);
  }

  static featuredProduct(): ProductBuilder {
    return this.product()
      .withPrice(100.00)
      .withStock(5)
      .featured();
  }

  static outOfStockProduct(): ProductBuilder {
    return this.product()
      .withPrice(50.00)
      .outOfStock();
  }
}