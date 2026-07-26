export interface OnlineUsersConfig {
  isSimulated: boolean;
  minCount: number;
  maxCount: number;
  updateIntervalSec: number;
  updatedAt?: number;
}

export const DEFAULT_ONLINE_CONFIG: OnlineUsersConfig = {
  isSimulated: false,
  minCount: 15,
  maxCount: 45,
  updateIntervalSec: 4,
};

export interface RegisteredUsersConfig {
  isCustomOverride: boolean;
  customCount: number;
  updatedAt?: number;
}

export const DEFAULT_REGISTERED_CONFIG: RegisteredUsersConfig = {
  isCustomOverride: false,
  customCount: 2458,
};
