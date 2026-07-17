/**
 * Escapes special regex characters in user input to prevent ReDoS (Regular Expression Denial of Service)
 * and catastrophic backtracking when building RegExp instances dynamically from external strings.
 */
function escapeRegExp(string) {
  if (typeof string !== "string") return "";
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { escapeRegExp };
