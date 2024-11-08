export interface avatar {
  public_id: string;
  url: string;
}

export interface ISignInDetail {
  ip?: string;
  city?: string;
  country?: string;
  timezone?: string;
  countryCode?: string;
  continent?: { code: string; name: string };
  browser?: string;
  version?: string;
  os?: string;
  platform?: string;
  signInDate: Date;
}
