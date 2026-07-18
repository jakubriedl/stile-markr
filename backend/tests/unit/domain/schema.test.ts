import { getTableConfig } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";

import { importRequestKeys, results } from "../../../src/db/schema.ts";

describe("drizzle schema", () => {
  it("defines results with composite identity and required retained columns", () => {
    const config = getTableConfig(results);
    const columnNames = config.columns.map((column) => column.name);

    expect(config.name).toBe("results");
    expect(columnNames).toEqual(
      expect.arrayContaining([
        "test_id",
        "student_number",
        "obtained",
        "available",
        "first_name",
        "last_name",
        "scanned_on_ms",
        "created_at_ms",
        "updated_at_ms",
      ]),
    );
    expect(config.primaryKeys).toHaveLength(1);
    expect(config.checks.map((check) => check.name)).toEqual(
      expect.arrayContaining([
        "results_test_id_canonical",
        "results_student_number_safe",
        "results_available_positive",
        "results_obtained_bounded",
      ]),
    );
  });

  it("defines a temporary import request-key table with the same identity pair", () => {
    const config = getTableConfig(importRequestKeys);
    const columnNames = config.columns.map((column) => column.name);

    expect(config.name).toBe("import_request_keys");
    expect(columnNames).toEqual(["test_id", "student_number"]);
    expect(config.primaryKeys).toHaveLength(1);
  });
});
