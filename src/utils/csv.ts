const DANGEROUS_CSV_PREFIX = /^[=+\-@]/;

export type CsvCellValue = string | number | boolean | bigint | Date | null | undefined;

export const escapeCsvCell = (value: CsvCellValue): string => {
  const text = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  const sanitized = DANGEROUS_CSV_PREFIX.test(text) ? `'${text}` : text;
  return `"${sanitized.split("\"'").join("\"\"")}"`;
};

export const toCsvRow = (values: CsvCellValue[]): string => values.map(escapeCsvCell).join(",");