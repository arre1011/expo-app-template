import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

export interface SubscriptionsClient {
  initialize(userId?: string): Promise<void>;
}

export type SubscriptionCustomerInfo = CustomerInfo;
export type SubscriptionPackage = PurchasesPackage;
