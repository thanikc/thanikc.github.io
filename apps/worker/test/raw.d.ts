declare module '*.sql?raw' {
  const sql: string;
  export default sql;
}

declare module '*.jsonc?raw' {
  const text: string;
  export default text;
}
