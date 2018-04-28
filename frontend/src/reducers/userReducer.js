import { USER_LOGIN, USER_LOGOUT, } from '../actionTypes/UserActions'
import RSA from 'react-simple-auth'

const initialState = {isLoggedIn: false};

export const userReducer = (state = initialState, action) => {
  switch(action.type){
    case USER_LOGIN:
      return Object.assign({}, state, {
        characterId: action.characterID,
        characterName: action.characterName,
        scopes: action.scopes,
        accessToken: action.accessToken,
        refreshToken: action.refreshToken,
        expiration: action.expiration,
        portrait64: action.portrait64,
        portrait128: action.portrait128,
        portrait256: action.portrait256,
        portrait512: action.portrait512,
        expiration: action.expiration,
        isLoggedIn: true
      })
      break;
    case USER_LOGOUT:
      RSA.invalidateSession();
      return initialState
      break;
    default:
      return state
      break;
  }

}
