import fs from 'fs';
import { postLogin } from './src/requests.js';
import { globalState, tokens } from './src/state.js';
import { killProcess, prettyLog } from './src/utils.js';
import {
  doDailyTasks,
  refreshState,
  setProfileState,
  showProfileState,
} from './src/cycle.js';

let attempt: number = 0;

prettyLog(`[+] Reading data file`, 'info');

fs.readFile('data.json', 'utf8', async (err, data) => {
  if (err) {
    prettyLog(`Error reading file: ${err.message}`, 'error');
    return;
  }

  while (true) {
    await main(data);
  }
});

const main = async (data: string): Promise<void> => {
  try {
    attempt++;
    const jsonData: string[] = JSON.parse(data);
    const startTime = new Date();
    const currentTime = startTime.toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour12: false  });

    prettyLog(`============================Attempt-${attempt}============================`, 'info');
    prettyLog(`[Scheduled Task] [${currentTime}] Executing code...`, 'info');
    prettyLog('=================================================================', 'info');

    prettyLog(`[+] Found ${jsonData.length} user identities`, 'info');

    for (const [index, tgWebAppData] of jsonData.entries()) {
      const token = await postLogin(tgWebAppData);
      tokens.push(token);
    }

    prettyLog(`[+] ${tokens.length} tokens generated`, 'info');
    prettyLog(`[+] Getting profile state`, 'info');
    await setProfileState();
    await refreshState();
    await showProfileState();
    await doDailyTasks();
    await showProfileState();
    await globalState.resetState();

    const endTime = new Date();
    const elapsedTime = (endTime.getTime() - startTime.getTime()) / 1000; // Convert milliseconds to seconds
    const endTimeString = endTime.toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour12: false });

    prettyLog(`============================End Attempt-${attempt}============================`, 'info');
    prettyLog(`[Scheduled Task] [${endTimeString}] Waiting for another 12 hours...`, 'info');
    prettyLog(`[+] Elapsed time: ${elapsedTime} seconds`, 'info');
    prettyLog('=================================================================', 'info');
  } catch (error) {
    killProcess(error);
  }
};

process.on('SIGINT', () => {
  prettyLog('Exiting process...', 'info');
  process.exit(0);
});
