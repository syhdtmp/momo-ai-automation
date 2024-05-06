import { tokens } from './state.js';

export const killProcess = (error: Error): void => {
  console.log(`[ERROR] ${error.stack}`);
  process.kill(process.pid, 'SIGINT');
};

export const getToken = async (
  callback: (token: string, index: number) => Promise<void>,
): Promise<void> => {
  for (const [index, token] of tokens.entries()) {
    await callback(token, index + 1);
  }
};

export const runPromisesWithDelay = <T>(
  promises: Promise<T>[],
  delay: number,
): Promise<NodeJS.Timeout[]> => {
  const delayedPromises = promises.map((promise: Promise<T>) =>
    setTimeout(async (): Promise<void> => {
      await promise;
    }, delay),
  );
  return Promise.all(delayedPromises);
};

export const wait = (seconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};
