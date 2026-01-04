/**
 * Depends On Expression Evaluator
 *
 * Evaluates Frappe depends_on expressions to determine field visibility,
 * required state, and read-only state based on document values.
 *
 * Supported expression formats:
 * - "doc.field_name == 'value'" (with or without prefix)
 * - "doc.field_name" (truthy check)
 * - "doc.field_name > 0"
 * - "doc.field_name != ''"
 * - "doc.field_name in ['a', 'b']"
 * - "field_name" (shortest form)
 *
 * Note: This is a SAFE parser - it does NOT use JavaScript's native code execution.
 * All expressions are parsed and computed manually.
 */

const EXPRESSION_PREFIX = "eval:"; // Frappe's expression prefix

/**
 * Check a depends_on expression against document values
 *
 * @param expression - The depends_on expression string
 * @param doc - Current document/form values
 * @returns boolean - Whether the condition is satisfied
 */
export function evaluateDependsOn(
  expression: string | undefined,
  doc: Record<string, unknown>
): boolean {
  // No expression means always visible/applicable
  if (!expression || expression.trim() === "") {
    return true;
  }

  try {
    // Clean up the expression
    let expr = expression.trim();

    // Remove Frappe's expression prefix if present
    if (expr.startsWith(EXPRESSION_PREFIX)) {
      expr = expr.slice(EXPRESSION_PREFIX.length).trim();
    }

    // Handle simple field reference (e.g., "doc.field_name" or "field_name")
    if (expr.startsWith("doc.")) {
      expr = expr.slice(4);
    }

    // If it's just a field name, check its truthiness
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expr)) {
      return isTruthy(doc[expr]);
    }

    // For complex expressions, use safe parsing
    return safeParseAndCompute(expression, doc);
  } catch (error) {
    console.warn(`Failed to parse depends_on expression: "${expression}"`, error);
    // On error, default to showing the field
    return true;
  }
}

/**
 * Check if a value is "truthy" in Frappe's context
 * - Empty strings, 0, null, undefined, false are falsy
 * - Everything else is truthy
 */
function isTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (value === "") return false;
  if (value === 0) return false;
  if (value === false) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Safely parse and compute a depends_on expression
 * Uses manual parsing - NO code execution
 */
function safeParseAndCompute(
  expression: string,
  doc: Record<string, unknown>
): boolean {
  let expr = expression.trim();

  // Remove Frappe prefix
  if (expr.startsWith(EXPRESSION_PREFIX)) {
    expr = expr.slice(EXPRESSION_PREFIX.length).trim();
  }

  // Replace doc.field_name with actual values
  expr = expr.replace(/doc\.([a-zA-Z_][a-zA-Z0-9_.]*)/g, (_, fieldPath) => {
    const value = getNestedValue(doc, fieldPath);
    return valueToString(value);
  });

  // Handle __islocal and other special Frappe variables
  expr = expr.replace(/__islocal/g, valueToString(doc.__islocal ?? doc.name === undefined));

  // Parse and compute common patterns safely
  return computeExpression(expr);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Convert a value to its string representation for expression building
 */
function valueToString(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify(value);
}

/**
 * Compute simple expressions safely without native code execution
 * Supports: ==, !=, >, <, >=, <=, in, &&, ||, !
 */
function computeExpression(expr: string): boolean {
  expr = expr.trim();

  // Handle parentheses by recursive computation
  while (expr.includes("(")) {
    expr = expr.replace(/\(([^()]+)\)/g, (_, inner) => {
      return computeExpression(inner) ? "true" : "false";
    });
  }

  // Handle logical OR (lowest precedence)
  if (expr.includes("||")) {
    const parts = expr.split("||");
    return parts.some((part) => computeExpression(part.trim()));
  }

  // Handle logical AND
  if (expr.includes("&&")) {
    const parts = expr.split("&&");
    return parts.every((part) => computeExpression(part.trim()));
  }

  // Handle NOT
  if (expr.startsWith("!")) {
    return !computeExpression(expr.slice(1).trim());
  }

  // Handle 'in' operator: value in [array]
  const inMatch = expr.match(/^(.+?)\s+in\s+\[(.+)\]$/);
  if (inMatch) {
    const value = parseValue(inMatch[1].trim());
    const arrayStr = inMatch[2];
    const array = arrayStr.split(",").map((s) => parseValue(s.trim()));
    return array.some((item) => item === value);
  }

  // Handle comparison operators
  const comparisonOps = ["===", "!==", "==", "!=", ">=", "<=", ">", "<"];
  for (const op of comparisonOps) {
    const idx = expr.indexOf(op);
    if (idx !== -1) {
      const left = parseValue(expr.slice(0, idx).trim());
      const right = parseValue(expr.slice(idx + op.length).trim());
      return compareValues(left, right, op);
    }
  }

  // Simple value - check truthiness
  const value = parseValue(expr);
  return isTruthy(value);
}

/**
 * Parse a string value into its actual type
 */
function parseValue(str: string): unknown {
  str = str.trim();

  // Handle quoted strings
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }

  // Handle null/undefined
  if (str === "null" || str === "undefined") return null;

  // Handle booleans
  if (str === "true") return true;
  if (str === "false") return false;

  // Handle numbers
  const num = Number(str);
  if (!isNaN(num)) return num;

  // Return as-is (shouldn't happen in well-formed expressions)
  return str;
}

/**
 * Compare two values with an operator
 */
function compareValues(left: unknown, right: unknown, op: string): boolean {
  switch (op) {
    case "===":
      return left === right;
    case "!==":
      return left !== right;
    case "==":
      // eslint-disable-next-line eqeqeq
      return left == right;
    case "!=":
      // eslint-disable-next-line eqeqeq
      return left != right;
    case ">":
      return (left as number) > (right as number);
    case "<":
      return (left as number) < (right as number);
    case ">=":
      return (left as number) >= (right as number);
    case "<=":
      return (left as number) <= (right as number);
    default:
      return false;
  }
}

/**
 * Field state computed from depends_on expressions
 */
export interface FieldDependsState {
  /** Whether the field should be visible */
  isVisible: boolean;
  /** Whether the field is required (considering mandatory_depends_on) */
  isRequired: boolean;
  /** Whether the field is read-only (considering read_only_depends_on) */
  isReadOnly: boolean;
}

/**
 * Compute field state from depends_on, mandatory_depends_on, read_only_depends_on
 */
export function computeFieldDependsState(
  field: {
    depends_on?: string;
    mandatory_depends_on?: string;
    read_only_depends_on?: string;
    reqd?: 0 | 1;
    read_only?: 0 | 1;
    hidden?: 0 | 1;
  },
  doc: Record<string, unknown>
): FieldDependsState {
  // Visibility: field is visible if depends_on is true (and not hidden)
  const isVisible = field.hidden !== 1 && evaluateDependsOn(field.depends_on, doc);

  // Required: base required OR mandatory_depends_on is true
  const isRequired =
    field.reqd === 1 ||
    (field.mandatory_depends_on
      ? evaluateDependsOn(field.mandatory_depends_on, doc)
      : false);

  // Read-only: base read_only OR read_only_depends_on is true
  const isReadOnly =
    field.read_only === 1 ||
    (field.read_only_depends_on
      ? evaluateDependsOn(field.read_only_depends_on, doc)
      : false);

  return {
    isVisible,
    isRequired: isVisible && isRequired, // Only required if visible
    isReadOnly,
  };
}
