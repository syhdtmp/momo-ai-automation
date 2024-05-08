import _ from 'lodash';
import { configState } from './config.js';
import { NextTreeState, UserState } from './state.js';
import { wait } from './utils.js';

const basicHeaders = {
  accept: 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  'sec-ch-ua':
    '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99", "Microsoft Edge WebView2";v="124"',
  'accept-language': 'en-US,en;q=0.9',
  'sec-ch-ua-platform': '"Windows"',
  referer: 'https://mini.momo.meme/',
};

export const postLogin = async (
  tgWebAppData: string,
  invitationCode: string = '',
): Promise<string> => {
  await wait(configState.delaySeconds)
  const response = await fetch(
    `${configState.baseUrl}/accounts/telegram/login`,
    {
      method: 'post',
      headers: basicHeaders,
      body: JSON.stringify({
        tgWebAppData,
        invitationCode,
      }),
    },
  );
  const json = await response.json();
  if (json['code'] != 200) {
    return '';
  } else {
    return json['data']['token'];
  }
};

export const getProfile = async (token: string): Promise<UserState> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/accounts/current`, {
    method: 'get',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
  });
  const json = await response.json();
  const userState: UserState = {};

  if (json['code'] != 200) {
    return {
      solAddress: '',
      luckiness: 0,
      name: '',
      invitationCode: '',
    };
  }

  _.merge(userState, {
    solAddress: json['data']['solAddress'],
    luckiness: json['data']['luckiness'],
    name: (json['data']['name'] as string).trim(),
    invitationCode: json['data']['invitationCode'],
  });

  return userState;
};

export const getCurrentUserTree = async (token: string): Promise<UserState> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/userTree/current`, {
    method: 'get',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
  });
  const json = await response.json();
  const userState: UserState = {};

  if (json['code'] != 200) {
    return {
      claimedKiwis: 0,
      level: 0,
      drawCount: 0,
    };
  }

  _.merge(userState, {
    claimedKiwis: json['data']['claimedNumber'],
    level: json['data']['level'],
    drawCount: json['data']['dailyClaimDrawCount'],
  });

  return userState;
};

export const getNextTreeState = async (
  token: string,
  level: number,
): Promise<NextTreeState> => {
  await wait(configState.delaySeconds)
  const response = await fetch(
    `${configState.baseUrl}/userTree/upgradeData/${level + 1}`,
    {
      method: 'get',
      headers: _.merge({}, basicHeaders, {
        'x-access-token': token,
      }),
    },
  );
  const json = await response.json();
  const nextTreeState: NextTreeState = {};

  if (json['code'] != 200) {
    return {
      nextLevel: 0,
      upgradePoint: 0,
    };
  }

  _.merge(nextTreeState, {
    nextLevel: json['data']['nextLevel'],
    upgradePoint: json['data']['upgradePoint'],
  });

  return nextTreeState;
};

export const postSignIn = async (token: string): Promise<boolean> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/signInRecord/signIn`, {
    method: 'post',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
  });

  const json = await response.json();

  return json['code'] == 200;
};

export const postOpenBox = async (token: string): Promise<boolean> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/userBoxes/open`, {
    method: 'post',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
    body: JSON.stringify({ type: 'LUCKY_BOX' }),
  });

  const json = await response.json();

  return json['code'] == 200;
};

export const getCurrentCardsDetail = async (
  token: string,
): Promise<UserState> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/cards/current`, {
    method: 'get',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
  });

  const json = await response.json();
  const userState: UserState = {};

  if (json['code'] != 200) {
    return {
      cardsLeft: 0,
    };
  }

  _.merge(userState, {
    cardsLeft: json['data']['obtainedCounts'] - json['data']['usedCounts'],
  });

  return userState;
};

export const getCurrentUserPoints = async (
  token: string,
): Promise<UserState> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/points/current`, {
    method: 'get',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
  });

  const json = await response.json();
  const userState: UserState = {};

  if (json['code'] != 200) {
    return {
      currentPoints: 0,
    };
  }

  _.merge(userState, {
    currentPoints: json['data'],
  });

  return userState;
};

export const getCurrentUserBoxes = async (
  token: string,
): Promise<UserState> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/userBoxes/current`, {
    method: 'get',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
  });

  const json = await response.json();
  const userState: UserState = {};

  if (json['code'] != 200) {
    return {
      luckyBoxQuantities: 0,
    };
  }

  _.merge(userState, {
    luckyBoxQuantities: (json['data'] as []).filter(
      (row) => row['type'] == 'LUCKY_BOX',
    )[0]['quantity'],
  });

  return userState;
};

export const postClaimKiwis = async (token: string): Promise<number> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/userTree/claim`, {
    method: 'post',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
    body: JSON.stringify({ telegram: true }),
  });

  const json = await response.json();

  if (json['code'] != 200) {
    return 0;
  }

  return json['data']['obtainedCounts'];
};

export const postShareCards = async (token: string): Promise<boolean> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/cards/shared`, {
    method: 'post',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
  });

  const json = await response.json();

  return json['code'] == 200;
};

export const postDrawCards = async (
  token: string,
  quantity: number,
): Promise<number> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/cards/use`, {
    method: 'post',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
    body: JSON.stringify({ drawCardCounts: quantity }),
  });

  const json = await response.json();
  if (json['code'] != 200) {
    return 0;
  }

  return (json['data'] as []).reduce(
    (a: number, b) => a + (b['points'] as number),
    0,
  );
};

export const postUpgradeTree = async (token: string): Promise<boolean> => {
  await wait(configState.delaySeconds)
  const response = await fetch(`${configState.baseUrl}/userTree/upgrade`, {
    method: 'post',
    headers: _.merge({}, basicHeaders, {
      'x-access-token': token,
    }),
    body: JSON.stringify({}),
  });

  const json = await response.json();
  return json['code'] == 200;
};
