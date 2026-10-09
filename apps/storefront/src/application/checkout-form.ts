import type { CheckoutContact } from "@/domain/commerce";
import { isValidRut, formatRut } from "./rut";

export type CheckoutForm = {
  name: string; lastName: string; phone: string; address: string; address2: string; region: string; city: string; branch: string; notes: string;
  document: "boleta" | "factura"; rut: string; companyRut: string; companyName: string; companyActivity: string; companyAddress: string; companyComuna: string;
};
export const emptyCheckoutForm: CheckoutForm = {
  name: "", lastName: "", phone: "", address: "", address2: "", region: "", city: "", branch: "", notes: "",
  document: "boleta", rut: "", companyRut: "", companyName: "", companyActivity: "", companyAddress: "", companyComuna: "",
};

export type FieldError = "required" | "phone" | "rut";
export type CheckoutErrors = Partial<Record<keyof CheckoutForm, FieldError>>;

const filled = (value: string) => value.trim().length > 0;

/** Which fields are missing or wrong. Company fields only count for a factura. */
export function validateCheckoutForm(form: CheckoutForm): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const key of ["name", "lastName", "address", "region", "city"] as const) if (!filled(form[key])) errors[key] = "required";
  if (form.phone.replace(/\D/g, "").length < 8) errors.phone = filled(form.phone) ? "phone" : "required";
  if (form.document === "boleta") {
    if (!filled(form.rut)) errors.rut = "required"; else if (!isValidRut(form.rut)) errors.rut = "rut";
  } else {
    if (!filled(form.companyRut)) errors.companyRut = "required"; else if (!isValidRut(form.companyRut)) errors.companyRut = "rut";
    for (const key of ["companyName", "companyActivity", "companyAddress", "companyComuna"] as const) if (!filled(form[key])) errors[key] = "required";
  }
  return errors;
}

/** The contact sent to the store. */
export function toCheckoutContact(form: CheckoutForm): CheckoutContact {
  const text = (value: string) => value.trim();
  return {
    name: text(form.name), lastName: text(form.lastName), phone: text(form.phone), address: text(form.address), address2: text(form.address2) || undefined,
    city: text(form.city), region: form.region, branch: text(form.branch) || undefined, notes: text(form.notes) || undefined, shipping: "starken",
    document: form.document,
    ...(form.document === "boleta"
      ? { rut: formatRut(form.rut) }
      : { company: { rut: formatRut(form.companyRut), name: text(form.companyName), activity: text(form.companyActivity), address: text(form.companyAddress), comuna: text(form.companyComuna) } }),
  };
}
