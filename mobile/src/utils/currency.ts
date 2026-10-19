// Accepts Turkish ("1.250,50", "1.500") and plain ("1250.50") input.
export const parseAmount = (input: string): number => {
  const v = input.replace(/\s|₺|TL/gi, '');
  if (!v) return NaN;
  let normalized = v;
  if (v.includes(',')) normalized = v.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(v)) normalized = v.replace(/\./g, '');
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? parseFloat(normalized) : NaN;
};

export const formatCurrency = (amount: number): string =>
  `${amount.toLocaleString('tr-TR', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })} ₺`;
