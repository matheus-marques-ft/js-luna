module.exports = {
  // Maximum line length
  printWidth: 100,
  // Indentation width (tabs | spaces)
  tabWidth: 2,
  // Use tabs instead of spaces for indentation (true: tabs, false: spaces)
  useTabs: false,
  // No semicolon at the end (true: with semicolons, false: without)
  semi: true,
  // Use single quotes (true: single quotes, false: double quotes)
  singleQuote: true,
  // Whether to quote object literal property names, options "<as-needed|consistent|preserve>"
  quoteProps: "as-needed",
  // Use single quotes instead of double quotes in JSX (true: single quotes, false: double quotes)
  jsxSingleQuote: false,
  // Print trailing commas wherever possible when multi-line, options "<none|es5|all>"
  trailingComma: "none",
  // Add spaces between brackets and literals in objects/arrays, "{ foo: bar }" (true: yes, false: no)
  bracketSpacing: true,
  // Put the `>` of a multi-line element at the end of the last line instead of on its own line (true: at the end, false: on its own line)
  bracketSameLine: false,
  // Whether to include parens around a sole arrow function parameter (avoid: omit parens, always: keep parens)
  arrowParens: "avoid",
  // Which parser to use; no need to write the @prettier pragma at the top of the file
  requirePragma: false,
  // Insert a special marker at the top of the file specifying that the file has been formatted with Prettier
  insertPragma: false,
  // Controls whether/how prose text should be wrapped
  proseWrap: "preserve",
  // Whitespace sensitivity in HTML: "css" - respect CSS display property defaults, "strict" - whitespace is sensitive, "ignore" - whitespace is not sensitive
  htmlWhitespaceSensitivity: "css",
  // Controls how code inside <script> and <style> tags gets indented in Vue single-file components
  vueIndentScriptAndStyle: false,
  // Line ending style, options "<auto|lf|crlf|cr>"
  endOfLine: "auto",
  // These two options can be used to format code starting and ending at a given character offset (rangeStart: start, rangeEnd: end)
  rangeStart: 0,
  rangeEnd: Infinity
};
