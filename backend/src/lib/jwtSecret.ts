// Single place to read the JWT signing key.
// There is no built-in fallback: a known default would let anyone forge tokens.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") {
    throw new Error(
      "JWT_SECRET is not set. Add JWT_SECRET=<long random string> to backend/.env " +
        "(for example: openssl rand -hex 32) and restart the server."
    );
  }
  return secret;
}
