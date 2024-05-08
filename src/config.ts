type ConfigState = {
  baseUrl: string,
  autoUpgradeTree?: boolean,
  autoDraw?: boolean,
  autoOpenBox?: boolean,
  autoClaim?: boolean,
  autoCheckIn?: boolean,
  delaySeconds: number,
  maxDrawCount: number
}

export const configState: ConfigState = {
  baseUrl: 'https://api.momo.meme',
  delaySeconds: 1,
  maxDrawCount: 2
}