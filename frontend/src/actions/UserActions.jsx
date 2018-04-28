import { USER_LOGIN, USER_LOGOUT } from '../actionTypes/UserActions'

export const login = (characterID, characterName, scopes, accessToken, refreshToken, portrait64, portrait128, portrait256, portrait512, expiration): ActionObject =>
    ({
      type: USER_LOGIN,
      characterID,
      characterName,
      scopes,
      accessToken,
      refreshToken,
      portrait64,
      portrait128,
      portrait256,
      portrait512,
      expiration
    })

export const logout = (): ActionObject =>
    ({
      type: USER_LOGOUT
    })
