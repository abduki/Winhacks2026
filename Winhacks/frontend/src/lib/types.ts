export type TxType = "expense" | "income";

export type Transaction = {
  id: string;
  ts: number;
  type: TxType;
  amount: number;
  category: string;
  note: string;
};

export type LimitsMap = Record<string, number>;
