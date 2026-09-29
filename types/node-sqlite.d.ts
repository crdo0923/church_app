/**
 * Minimal typings for the `node:sqlite` builtin (Node 22.5+).
 * @types/node@20 does not ship these, and we intentionally add
 * no new npm dependencies for the embedded tracker database.
 */

declare module "node:sqlite" {
  export type SQLiteValue =
    | string
    | number
    | bigint
    | boolean
    | null
    | Uint8Array;

  export type SQLInputValue = SQLiteValue | Record<string, SQLiteValue>;

  export interface RunResult {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export interface StatementSync {
    get<T = Record<string, unknown>>(
      ...params: SQLInputValue[]
    ): T | undefined;
    all<T = Record<string, unknown>>(...params: SQLInputValue[]): T[];
    run(...params: SQLInputValue[]): RunResult;
    toString(): string;
  }

  export class DatabaseSync {
    constructor(path?: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
