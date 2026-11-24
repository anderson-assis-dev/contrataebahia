import { onlyDigits } from './format';

const moduloOnze = (numeros, pesos) => {
  const soma = numeros.reduce((total, n, i) => total + n * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
};

const sequenciaRepetida = (n) => /^(\d)\1+$/.test(n);

export const cpfValido = (valor) => {
  const n = onlyDigits(valor);
  if (n.length !== 11 || sequenciaRepetida(n)) return false;
  const nums = n.split('').map(Number);
  if (moduloOnze(nums.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]) !== nums[9]) return false;
  return moduloOnze(nums.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === nums[10];
};

export const cnpjValido = (valor) => {
  const n = onlyDigits(valor);
  if (n.length !== 14 || sequenciaRepetida(n)) return false;
  const nums = n.split('').map(Number);
  if (moduloOnze(nums.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) !== nums[12]) return false;
  return moduloOnze(nums.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === nums[13];
};

export const tipoDoDocumento = (valor) => {
  const n = onlyDigits(valor);
  if (n.length === 11) return 'cpf';
  if (n.length === 14) return 'cnpj';
  return null;
};

export const lerDocumento = (valor) => {
  const numeros = onlyDigits(valor);
  const tipo = tipoDoDocumento(numeros);
  const valido = tipo === 'cpf' ? cpfValido(numeros) : tipo === 'cnpj' ? cnpjValido(numeros) : false;
  return { numeros, tipo, valido, vazio: numeros.length === 0 };
};
