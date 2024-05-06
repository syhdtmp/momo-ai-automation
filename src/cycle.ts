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

    console.log(`--------------------------------------------------`);
    console.log(`[-] Profile state ${userState.name}`);
    console.log(`[-] Level ${userState.level}`);
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
  await getToken(async (token) => {
    const userState = globalState.getState<UserState>(token, 'user');

    const signedIn = await postSignIn(token);
    console.log(`[+] ${userState.name} - Doing daily sign in`);
    if (signedIn) {
      console.log(`[+] ${userState.name} - Daily sign in completed`);
    } else {
      console.log(`[+] ${userState.name} - Already signed in`);
    }

    let stopInterval: boolean = false;
    const claimKiwisHour = 5 * 60 * 60

    while (stopInterval != true) {
      const currentUserState = globalState.getState<UserState>(token, 'user');
      const claimLeft =
        currentUserState.claimChances - currentUserState.claimedDaily;

      const obtainedCards = await postClaimKiwis(token);
      if (obtainedCards != 0) {
        globalState.setState(token, 'user', {
          claimedDaily: currentUserState.claimedDaily + 1,
          cardsLeft: currentUserState.cardsLeft + obtainedCards,
        });
        console.log(
          `[+] ${currentUserState.name} - ${currentUserState.claimedDaily}x claim kiwis (${claimLeft}x left)`,
        );
        await refreshState();
      } else {
        console.log(
          `[+] ${userState.name} - Claim chances used up, stopping kiwis claim soon`,
        );
        stopInterval = true;
      }

      if (currentUserState.luckyBoxQuantities > 0) {
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

      const cardsLeft = globalState.getState<number>(token, 'user.cardsLeft');
      for (let i = 0; i < cardsLeft; i++) {
        const points = await postDrawCards(token, 1);
        console.log(`[+] ${userState.name} - Draw cards get ${points} points`);
        await wait(1)
      }

      await refreshState();
      const nextTreeState = globalState.getState<NextTreeState>(
        token,
        'nextTree',
      );

      if (
        globalState.getState<number>(token, 'user.currentPoints') >=
        nextTreeState.upgradePoint
      ) {
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

      if (stopInterval) {
        console.log(`[+] ${userState.name} - Stopping kiwis claim`);
      } else {
        console.log(`[+] ${userState.name} - Waiting another 4 hours`);
        await wait(claimKiwisHour)
      }
    }
  });
};
