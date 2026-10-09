/** Chilean RUT helpers (modulo 11), the number printed on boletas and facturas. Mirrors the backend check. */
export const cleanRut = (value: string) => String(value ?? "").replace(/[^0-9kK]/g, "").toUpperCase();

export function isValidRut(value: string): boolean {
  const rut = cleanRut(value);
  if (rut.length < 8 || rut.length > 9) return false;
  const body = rut.slice(0, -1), check = rut.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  let sum = 0, factor = 2;
  for (let index = body.length - 1; index >= 0; index--) { sum += Number(body[index]) * factor; factor = factor === 7 ? 2 : factor + 1; }
  const expected = 11 - (sum % 11);
  return check === (expected === 11 ? "0" : expected === 10 ? "K" : String(expected));
}

/** 123456785 → 12.345.678-5, while the shopper types. */
export function formatRut(value: string): string {
  const rut = cleanRut(value).slice(0, 9);
  if (rut.length < 2) return rut;
  return `${rut.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${rut.slice(-1)}`;
}
