import _ from 'lodash';
import { getToken, wait } from './utils.js';

export type UserState = {
  claimedKiwis?: number;
  claimedDaily?: number;
  level?: number;
  invitationCode?: string;
  name?: string;
  luckiness?: number;
  solAddress?: string;
  totalClaimed?: number;
  claimChances?: number;
  cardsLeft?: number;
  currentPoints?: number;
  luckyBoxQuantities?: number;
};

export type NextTreeState = {
  nextLevel?: number;
  upgradePoint?: number;
};

type GlobalState = {
  nextTree: NextTreeState;
  user: UserState;
};

export let tokens: string[] = [];
export const globalState = {
  getState: <T>(token: string, property: string): T => {
    const properties = property.split('.');
    let state = globalState[token];
    for (const prop of properties) {
      state = state[prop];
    }
    return state;
  },
  setState: <T>(token: string, property: string, value: T): void => {
    const updateProperty = (obj: any, props: string[], value: T): void => {
      const prop = props.shift();
      if (!prop) return;
      if (!obj[prop]) {
        _.merge(obj, { [prop]: {} });
      }
      if (props.length === 0) {
        _.merge(obj, { [prop]: value });
      } else {
        updateProperty(obj[prop], props, value);
      }
    };

    const props = property.split('.');
    if (!globalState[token]) {
      const state: GlobalState = {
        nextTree: {},
        user: {
          claimedDaily: 0,
        },
      };
      _.merge(globalState, {
        [token]: state,
      });
    }
    updateProperty(globalState[token], props, value);
  },
  resetState: async () => {
    await getToken(async (token) => {
      _.unset(globalState, token);
    });

    tokens = []
  },
};
