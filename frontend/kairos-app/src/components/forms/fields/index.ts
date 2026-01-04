/**
 * Form Fields Index
 *
 * Export all field components for dynamic form rendering
 */

// Basic input fields
export { DataField } from "./data-field";
export { TextField } from "./text-field";
export { IntField } from "./int-field";
export { FloatField } from "./float-field";
export { CurrencyField } from "./currency-field";

// Selection fields
export { SelectField } from "./select-field";
export { CheckField } from "./check-field";
export { LinkField } from "./link-field";

// Date/Time fields
export { DateField } from "./date-field";
export { DatetimeField } from "./datetime-field";

// Contact fields
export { EmailField } from "./email-field";
export { PhoneField, formatPhoneNumber } from "./phone-field";

// Field type to component mapping for Frappe field types
export const FieldComponents = {
  Data: DataField,
  Select: SelectField,
  Date: DateField,
  Link: LinkField,
  Check: CheckField,
  Int: IntField,
  Float: FloatField,
  Currency: CurrencyField,
  Text: TextField,
  "Small Text": TextField,
  "Long Text": TextField,
  "Text Editor": TextField,
  Datetime: DatetimeField,
  Email: EmailField,
  Phone: PhoneField,
  // Password field can use DataField with type="password" styling
  // or create a dedicated PasswordField component
} as const;

// Type for Frappe field types
export type FrappeFieldType = keyof typeof FieldComponents;

// Helper to get component for a field type
export function getFieldComponent(fieldType: string) {
  return FieldComponents[fieldType as FrappeFieldType] ?? DataField;
}

// Legacy mapping (string-based) for backward compatibility
export const fieldComponentMap = {
  Data: "DataField",
  Select: "SelectField",
  Date: "DateField",
  Link: "LinkField",
  Check: "CheckField",
  Int: "IntField",
  Float: "FloatField",
  Currency: "CurrencyField",
  Text: "TextField",
  "Small Text": "TextField",
  "Long Text": "TextField",
  "Text Editor": "TextField",
  Datetime: "DatetimeField",
  Email: "EmailField",
  Phone: "PhoneField",
} as const;

// Import component types for proper re-exports
import { DataField } from "./data-field";
import { TextField } from "./text-field";
import { IntField } from "./int-field";
import { FloatField } from "./float-field";
import { CurrencyField } from "./currency-field";
import { SelectField } from "./select-field";
import { CheckField } from "./check-field";
import { LinkField } from "./link-field";
import { DateField } from "./date-field";
import { DatetimeField } from "./datetime-field";
import { EmailField } from "./email-field";
import { PhoneField } from "./phone-field";
