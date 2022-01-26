import strip from "strip-json-comments"

export function jsoncParse(data: string) {
  try {
    return new Function("return " + strip(data).trim())()
  } catch (_) {
    // Silently ignore any error
    // That's what tsc/jsonc-parser did after all
    return {}
  }
}
