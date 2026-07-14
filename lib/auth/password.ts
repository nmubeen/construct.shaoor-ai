import bcrypt from "bcrypt";
import { AUTH } from "@/lib/constants";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, AUTH.BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
) {
  return bcrypt.compare(password, hash);
}