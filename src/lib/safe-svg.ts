const unsafeSvgPatterns = [
  /<\s*script\b/i,
  /javascript:/i,
  /\son[a-z]+\s*=/i,
  /<\s*foreignObject\b/i,
  /<\s*(?:iframe|object|embed)\b/i,
  /\b(?:href|xlink:href|src)\s*=\s*["']\s*(?:https?:)?\/\//i,
];

export function validateSafeSvgBuffer(buffer: Buffer) {
  const content = buffer.toString("utf8");

  if (!/<svg[\s>]/i.test(content)) {
    return false;
  }

  return !unsafeSvgPatterns.some((pattern) => pattern.test(content));
}
