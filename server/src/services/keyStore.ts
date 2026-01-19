import keytar from "keytar";

const SERVICE = "ccg-character-generator";

export type StoredKey = { id: string; name: string };

function normalizeName(nameOrId: string) {
  return nameOrId.trim();
}

export async function listKeys(): Promise<StoredKey[]> {
  const creds = await keytar.findCredentials(SERVICE);
  return creds.map((cred) => ({ id: cred.account, name: cred.account }));
}

export async function saveKey(name: string, secret: string): Promise<StoredKey> {
  const trimmedName = name.trim();
  const trimmedSecret = secret.trim();
  if (!trimmedName) throw new Error("Key name is required.");
  if (!trimmedSecret) throw new Error("Key value is required.");
  await keytar.setPassword(SERVICE, trimmedName, trimmedSecret);
  return { id: trimmedName, name: trimmedName };
}

export async function deleteKey(nameOrId: string): Promise<void> {
  const name = normalizeName(nameOrId);
  if (!name) return;
  await keytar.deletePassword(SERVICE, name);
}

export async function getKey(nameOrId: string): Promise<string | null> {
  const name = normalizeName(nameOrId);
  if (!name) return null;
  return keytar.getPassword(SERVICE, name);
}
