import fs from 'fs';
import { postLogin } from './src/requests.js';
import { globalState, tokens } from './src/state.js';
import { killProcess, wait } from './src/utils.js';
import {
  doDailyTasks,
  refreshState,
  setProfileState,
  showProfileState,
} from './src/cycle.js';

let attempt: number = 0;

console.log(`[+] Reading data file`);
fs.readFile('data.json', 'utf8', async (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const mainIntervalHour = 12 * 60 * 60;
  while (true) {
    await main(data);
    await wait(mainIntervalHour);
  }
});

const main = async (data: string): Promise<void> => {
  try {
    attempt++;
    const jsonData: string[] = JSON.parse(data);
    const currentTime = new Date().toLocaleString();
    console.log(
      `============================Attempt-${attempt}============================`,
    );
    console.log(
      `[Scheduled Task] [${currentTime}] Executing code every 12 hours...`,
    );
    console.log(
      '=================================================================',
    );

    console.log(`[+] Found ${jsonData.length} user identity`);

    for (const [index, tgWebAppData] of jsonData.entries()) {
      const token = await postLogin(tgWebAppData);
      tokens.push(token);
    }

    console.log(`[+] ${tokens.length} tokens generated`);
    console.log(`[+] Getting profile state`);
    await setProfileState();
    await refreshState();
    await showProfileState();
    await doDailyTasks();
    await showProfileState()
    await globalState.resetState();

    console.log(
      `============================End Attempt-${attempt}============================`,
    );
    console.log(
      `[Scheduled Task] [${currentTime}] Waiting for another 12 hours...`,
    );
    console.log(
      '=================================================================',
    );
  } catch (error) {
    killProcess(error);
  }
};

process.on('SIGINT', () => {
  console.log('Exiting process...');
  process.exit(0);
});
