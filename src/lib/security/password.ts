// Isomórfico (Web Crypto: browser + Node 19+). Sem Math.random — aleatoriedade
// criptográfica em todos os caracteres.
export function generateSecurePassword(length = 16): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  const randInt = (max: number) => crypto.getRandomValues(new Uint32Array(1))[0] % max;
  const pick = (set: string) => set[randInt(set.length)];

  // Garante ao menos 1 de cada classe.
  let password = pick(upper) + pick(lower) + pick(digits) + pick(special);

  const array = new Uint32Array(Math.max(0, length - 4));
  crypto.getRandomValues(array);
  for (let i = 0; i < array.length; i++) {
    password += all[array[i] % all.length];
  }

  const chars = password.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
