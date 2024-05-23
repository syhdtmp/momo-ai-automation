import { configState } from './config.js';
import {
  getCurrentCardsDetail,
  getCurrentUserBoxes,
  getCurrentUserPoints,
  getCurrentUserTree,
  getNextTreeState,
  getProfile,
  postClaimKiwis,
  postDrawCards,
  postOpenBox,
  postShareCards,
  postSignIn,
  postUpgradeTree,
} from './requests.js';
import { globalState, NextTreeState, UserState } from './state.js';
import { getToken, wait, prettyLog } from './utils.js';

export const showProfileState = async (): Promise<void> => {
  await getToken(async (token) => {
    const userState = globalState.getState<UserState>(token, 'user');
    const nextTreeState = globalState.getState<NextTreeState>(
      token,
      'nextTree',
    );

    prettyLog(`--------------------------------------------------`, 'info');
    prettyLog(`[-] Profile state ${userState.name}`, 'info');
    prettyLog(`[-] Level ${userState.level}`, 'info');
    prettyLog(`[-] Current Points ${userState.currentPoints}`, 'info');
    prettyLog(`[-] Next Level Points ${nextTreeState.upgradePoint}`, 'info');
    prettyLog(`[-] Cards left ${userState.cardsLeft}`, 'info');
    prettyLog(`[-] Claimed kiwis ${userState.claimedKiwis}`, 'info');
    prettyLog(`[-] Claimed daily ${userState.drawCount}`, 'info');
    prettyLog(`--------------------------------------------------`, 'info');
  });
};

export const setProfileState = async (): Promise<void> => {
  await getToken(async (token) => {
    const profile = await getProfile(token);

    globalState.setState<UserState>(token, 'user', profile);
  });
};

export const setUserState = async (): Promise<void> => {
  await getToken(async (token) => {
    const currentTree = await getCurrentUserTree(token);
    const currentCards = await getCurrentCardsDetail(token);
    const currentPoints = await getCurrentUserPoints(token);
    const currentBoxes = await getCurrentUserBoxes(token);

    globalState.setState<UserState>(token, 'user', currentTree);
    globalState.setState<UserState>(token, 'user', currentCards);
    globalState.setState<UserState>(token, 'user', currentPoints);
    globalState.setState<UserState>(token, 'user', currentBoxes);
  });
};

export const setNextTreeState = async (): Promise<void> => {
  await getToken(async (token) => {
    const userState = globalState.getState<UserState>(token, 'user');
    const nextTree = await getNextTreeState(token, userState.level);
    globalState.setState<NextTreeState>(token, 'nextTree', nextTree);
  });
};

export const refreshState = async (): Promise<void> => {
  await setUserState();
  await setNextTreeState();
};

export const doDailyTasks = async (): Promise<void> => {
  const claimKiwisHour = 0.5 * 60 * 60; // 5 hours in seconds
  let stopInterval: number = 24;

  while (stopInterval > 0) {
    await executeDailyTasks();
    stopInterval--;
    if (stopInterval > 0) {
      prettyLog(`[+] Waiting another ${claimKiwisHour / 3600} hours`, 'info');
      await wait(claimKiwisHour);
    }
  }
};

const executeDailyTasks = async (): Promise<void> => {
  await getToken(async (token) => {
    const userState = globalState.getState<UserState>(token, 'user');
    prettyLog(`[+] ${userState.name} - Starting daily tasks`, 'info');

    // Sign in
    const signedIn = await postSignIn(token);
    prettyLog(`[+] ${userState.name} - Doing daily sign in`, 'info');
    if (signedIn) {
      prettyLog(`[+] ${userState.name} - Daily sign in completed`, 'info');
    } else {
      prettyLog(`[+] ${userState.name} - Already signed in`, 'info');
    }

    // Claim Kiwis
    const obtainedCards = await postClaimKiwis(token);
    await refreshState();
    prettyLog(`[+] ${userState.name} - Claimed ${obtainedCards} cards`, 'info');

    // Open Box and Share Cards
    await openBoxAndShareCards(token);
    await refreshState();

    // Draw Cards
    await drawCards(token);
    await refreshState();

    // Upgrade Tree if possible
    await upgradeTreeIfPossible(token);
    await refreshState();
  });
};

const openBoxAndShareCards = async (token: string): Promise<void> => {
  const userState = globalState.getState<UserState>(token, 'user');
  const openBox = await postOpenBox(token);
  prettyLog(`[+] ${userState.name} - Doing daily open box`, 'info');
  if (openBox) {
    prettyLog(`[+] ${userState.name} - Daily open box completed`, 'info');
  } else {
    prettyLog(`[+] ${userState.name} - Already opened the box`, 'info');
  }

  const shareCards = await postShareCards(token);
  prettyLog(`[+] ${userState.name} - Doing daily share`, 'info');
  if (shareCards) {
    prettyLog(`[+] ${userState.name} - Daily share completed`, 'info');
  } else {
    prettyLog(`[+] ${userState.name} - Already shared`, 'info');
  }
};

const drawCards = async (token: string): Promise<void> => {
  const userState = globalState.getState<UserState>(token, 'user');
  for (let i = 0; i < userState.cardsLeft; i++) {
    const points = await postDrawCards(token, 1);
    prettyLog(`[+] ${userState.name} - Draw cards get ${points} points`, 'info');
    await wait(1.5);
  }
};

const upgradeTreeIfPossible = async (token: string): Promise<void> => {
  const userState = globalState.getState<UserState>(token, 'user');

  const upgradeTree = await postUpgradeTree(token);
  await refreshState()

  const nextTreeState = globalState.getState<NextTreeState>(token, 'nextTree');
  prettyLog(`[+] ${userState.name} - Upgrading tree`, 'info');
  if (upgradeTree) {
    prettyLog(`[+] ${userState.name} - Tree upgraded to level ${nextTreeState.nextLevel}`, 'info');
  } else {
    prettyLog(`[+] ${userState.name} - Unable to upgrade tree`, 'info');
  }
};
