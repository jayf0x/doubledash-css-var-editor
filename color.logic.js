"use strict";

const HEX_PATTERN = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
const RGB_PATTERN = /^rgba?\([^()]+\)$/i;
const HSL_PATTERN = /^hsla?\([^()]+\)$/i;
const VAR_PATTERN = /^var\((.*)\)$/i;
const SIMPLE_NAMED_COLORS = new Set([
  "transparent",
  "currentcolor",
  "black",
  "white",
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "pink",
  "gray",
  "grey",
  "brown"
]);

function extractVarNames(value) {
  const input = String(value || "");
  const out = new Set();
  const regex = /var\(\s*(--[A-Za-z0-9_-]+)/g;
  let match;

  while ((match = regex.exec(input)) !== null) {
    out.add(match[1]);
  }

  return Array.from(out);
}

function splitTopLevelComma(input) {
  let depth = 0;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (ch === "," && depth === 0) {
      return [input.slice(0, i), input.slice(i + 1)];
    }
  }
  return [input, ""];
}

function parseVarCall(value) {
  const input = String(value || "").trim();
  const match = input.match(VAR_PATTERN);
  if (!match) {
    return null;
  }

  const inner = match[1].trim();
  if (!inner) {
    return null;
  }

  const [rawName, rawFallback] = splitTopLevelComma(inner);
  const name = rawName.trim();
  const fallback = rawFallback.trim();

  if (!/^--[A-Za-z0-9_-]+$/.test(name)) {
    return null;
  }

  return { name, fallback };
}

function resolveCssVar(value, options) {
  const opts = options || {};
  const resolveVar = typeof opts.resolveVar === "function" ? opts.resolveVar : () => null;
  const maxDepth = Number.isFinite(opts.maxDepth) ? opts.maxDepth : 12;
  const stack = opts.stack instanceof Set ? opts.stack : new Set();

  if (maxDepth <= 0) {
    return null;
  }

  const parsed = parseVarCall(value);
  if (!parsed) {
    return null;
  }

  const { name, fallback } = parsed;
  if (stack.has(name)) {
    return null;
  }

  stack.add(name);

  const candidate = resolveVar(name);
  if (typeof candidate === "string" && candidate.trim()) {
    const result = getColor(candidate, {
      resolveVar,
      maxDepth: maxDepth - 1,
      stack
    });
    if (result) {
      stack.delete(name);
      return result;
    }
  }

  if (fallback) {
    const fallbackResult = getColor(fallback, {
      resolveVar,
      maxDepth: maxDepth - 1,
      stack
    });
    stack.delete(name);
    return fallbackResult;
  }

  stack.delete(name);
  return null;
}

function getColor(value, options) {
  const input = typeof value === "string" ? value.trim() : "";
  if (!input) {
    return null;
  }

  if (HEX_PATTERN.test(input)) {
    return input.toLowerCase();
  }

  if (RGB_PATTERN.test(input) || HSL_PATTERN.test(input)) {
    return input;
  }

  if (SIMPLE_NAMED_COLORS.has(input.toLowerCase())) {
    return input.toLowerCase();
  }

  if (input.toLowerCase().startsWith("var(")) {
    return resolveCssVar(input, options);
  }

  return null;
}

function isColorLike(value, options) {
  return Boolean(getColor(value, options));
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getColor,
    isColorLike,
    extractVarNames,
    resolveCssVar
  };
}
