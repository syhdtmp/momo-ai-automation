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
import { getToken, wait } from './utils.js';

export const showProfileState = async (): Promise<void> => {
  await getToken(async (token) => {
    const userState = globalState.getState<UserState>(token, 'user');
    const nextTreeState = globalState.getState<NextTreeState>(token, 'nextTree');

    console.log(`--------------------------------------------------`);
    console.log(`[-] Profile state ${userState.name}`);
    console.log(`[-] Level ${userState.level}`);
    console.log(`[-] Current Points ${userState.currentPoints}`);
    console.log(`[-] Next Level Points ${nextTreeState.upgradePoint}`);
    console.log(`[-] Cards left ${userState.cardsLeft}`);
    console.log(`[-] Claimed kiwis ${userState.claimedKiwis}`);
    console.log(`[-] Claimed daily ${userState.claimedDaily}`);
    console.log(`--------------------------------------------------`);
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
  const claimKiwisHour = 5 * 60 * 60; // 5 hours in seconds
  let stopInterval: boolean[] = [];

  do {
    stopInterval = [];
    await executeDailyTasks(stopInterval);
    if (!stopInterval.every((condition) => condition == true)) {
      console.log(`[+] Waiting another ${claimKiwisHour / 3600} hours`);
      await wait(claimKiwisHour);
    }
  } while (!stopInterval.every((condition) => condition == true));
};

const executeDailyTasks = async (stopInterval: boolean[]): Promise<void> => {
  await getToken(async (token) => {
    const userState = globalState.getState<UserState>(token, 'user');
    let innerStopInterval: boolean = false;
    console.log(`[+] ${userState.name} - Starting daily tasks`);

    // Sign in
    const signedIn = await postSignIn(token);
    console.log(`[+] ${userState.name} - Doing daily sign in`);
    if (signedIn) {
      console.log(`[+] ${userState.name} - Daily sign in completed`);
    } else {
      console.log(`[+] ${userState.name} - Already signed in`);
    }

    // Claim Kiwis
    if (userState.drawCount < configState.maxDrawCount) {
      const obtainedCards = await postClaimKiwis(token);
      globalState.setState(token, 'user', {
        claimedDaily: userState.claimedDaily + 1,
        cardsLeft: userState.cardsLeft + obtainedCards,
      });
      await refreshState();
      console.log(`[+] ${userState.name} - Claimed ${obtainedCards} cards`);
    }

    if (userState.drawCount == configState.maxDrawCount) {
      console.log(
        `[+] ${userState.name} - Claim chances used up, stopping kiwis claim soon`,
      );
      innerStopInterval = true;
    }

    // Open Box and Share Cards
    await openBoxAndShareCards(token);
    await refreshState();

    // Draw Cards
    await drawCards(token);
    await refreshState();

    // Upgrade Tree if possible
    await upgradeTreeIfPossible(token);
    await refreshState();

    // Log status
    if (innerStopInterval) {
      console.log(`[+] ${userState.name} - Stopping kiwis claim`);
    }
    stopInterval.push(innerStopInterval);
  });
};

const openBoxAndShareCards = async (token: string): Promise<void> => {
  const userState = globalState.getState<UserState>(token, 'user');
  if (userState.luckyBoxQuantities > 0) {
    const openBox = await postOpenBox(token);
    console.log(`[+] ${userState.name} - Doing daily open box`);
    if (openBox) {
      console.log(`[+] ${userState.name} - Daily open box completed`);
    } else {
      console.log(`[+] ${userState.name} - Already opened the box`);
    }

    const shareCards = await postShareCards(token);
    console.log(`[+] ${userState.name} - Doing daily share`);
    if (shareCards) {
      console.log(`[+] ${userState.name} - Daily share completed`);
    } else {
      console.log(`[+] ${userState.name} - Already shared`);
    }
  }
};

const drawCards = async (token: string): Promise<void> => {
  const userState = globalState.getState<UserState>(token, 'user');
  for (let i = 0; i < userState.cardsLeft; i++) {
    const points = await postDrawCards(token, 1);
    console.log(`[+] ${userState.name} - Draw cards get ${points} points`);
    await wait(1);
  }
};

const upgradeTreeIfPossible = async (token: string): Promise<void> => {
  const userState = globalState.getState<UserState>(token, 'user');
  const nextTreeState = globalState.getState<NextTreeState>(token, 'nextTree');

  if (userState.currentPoints >= nextTreeState.upgradePoint) {
    const upgradeTree = await postUpgradeTree(token);
    console.log(`[+] ${userState.name} - Upgrading tree`);
    if (upgradeTree) {
      console.log(
        `[+] ${userState.name} - Tree upgraded to level ${nextTreeState.nextLevel}`,
      );
    } else {
      console.log(`[+] ${userState.name} - Unable to upgrade tree`);
    }
  }
};
