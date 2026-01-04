export type Payment = {
  amount: number;
  paidAt: Date;
  currency: string;
  paymentMethod: string | null;
  transactionRef: string | null;
};
