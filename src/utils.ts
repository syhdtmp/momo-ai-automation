import { tokens } from './state.js';
import chalk from 'chalk';

export const killProcess = (error: Error): void => {
  console.error(`[ERROR] ${error.stack}`);
  process.exit(1);
};

export const getToken = async (
  callback: (token: string, index: number) => Promise<void>,
): Promise<void> => {
  for (let index = 0; index < tokens.length; index++) {
    await callback(tokens[index], index + 1);
  }
};

export const runPromisesWithDelay = async <T>(
  promises: Promise<T>[],
  delay: number,
): Promise<void[]> => {
  const delayedPromises = promises.map(async (promise: Promise<T>) => {
    await new Promise(resolve => setTimeout(resolve, delay));
  });
  return Promise.all(delayedPromises);
};

export const wait = (seconds: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
};

export function prettyLog(message: string, type: string = 'info'): void {
  const timestamp = chalk.gray(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour12: false }));
  const logTypes = {
    error: () => console.error(`[${timestamp}] ${chalk.red('[ERROR]')}: ${message}`),
    warning: () => console.warn(`[${timestamp}] ${chalk.yellow('[WARNING]')}: ${message}`),
    info: () => console.info(`[${timestamp}] ${chalk.blue('[INFO]')}: ${message}`)
  };
  (logTypes[type.toLowerCase()] || logTypes['info'])();
}

