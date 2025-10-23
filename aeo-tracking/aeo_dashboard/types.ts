
export interface EventLog {
  clientId: string;
  productName: string;
  productLink: string;
  occurredAt: Date;
  eventType: string;
  addToCart: boolean;
  checkout: boolean;
  source: string;
}
