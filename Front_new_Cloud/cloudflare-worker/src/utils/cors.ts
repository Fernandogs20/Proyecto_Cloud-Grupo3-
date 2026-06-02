const allowedPatterns = [
  /^https:\/\/.*\.surge\.sh$/,
  /^https:\/\/.*\.pages\.dev$/,
  /^http:\/\/localhost:\d+$/,
];

export const corsOrigin = (origin: string): boolean => {
  return allowedPatterns.some((pattern) => pattern.test(origin));
};
