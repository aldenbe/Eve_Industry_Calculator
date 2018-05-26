import { USER_LOGIN, USER_LOGOUT, UPDATE_ACCESS_TOKEN } from '../actionTypes/UserActionTypes'

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

export const update_access_token = (accessToken, expiration): ActionObject =>
  ({
    type: UPDATE_ACCESS_TOKEN,
    accessToken,
    expiration
  })
