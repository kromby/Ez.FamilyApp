// Alphabet excludes ambiguous chars: 0, O, 1, I, L
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateFamilyCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
