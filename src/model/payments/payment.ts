export type Payment = {
  amount: number;
  currency: string;
  paidAt: Date;
  paymentMethod: string | null;
  transactionRef: string | null;
};
