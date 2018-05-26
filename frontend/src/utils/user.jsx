import { API_ROOT } from 'APIConfig';
import { pad } from 'utils/general';
export const getAccessToken = async(user, update_access_token) => {
  if (user.isLoggedIn) {
    let expiration = new Date(user.expiration)
    expiration = new Date(expiration.getTime() - (expiration.getTimezoneOffset() * 60 * 1000))

    //make sure there are at least 30 seconds before expiration or get new token
    let now = new Date();
    if ((now.getTime() + 30000) > expiration.getTime()){
      let session = await getNewToken(user.refreshToken);
      //create a new expiration time 19.5 minutes from now and store it with the new access token
      let newExpiration = new Date(now.getTime() + (19.5 * 60 * 1000))
      let newExpirationString = newExpiration.getUTCFullYear() + '-' + pad((newExpiration.getUTCMonth() + 1), 2) + '-' + pad(newExpiration.getUTCDate(), 2) + 'T' + pad(newExpiration.getUTCHours(), 2) + ':' +  pad(newExpiration.getUTCMinutes(), 2) + ':' + pad(newExpiration.getUTCSeconds(), 2) + '.' + newExpiration.getUTCMilliseconds();
      await update_access_token(session.access_token, newExpirationString);
      return session.access_token
    } else {
      return user.accessToken
    }
  } else {
    return undefined
  }


}
export const getNewToken = async(refreshToken) => {
  let json;
  let session;
  let response = await fetch(API_ROOT + 'auth.php', {
    retryOn: [500, 502],
    retryDelay: 250,
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "refreshToken": refreshToken
    }),

  });
  if (response.ok) {
    json = await response.json();
    session = updateSession(json);
  }
  return session
}

const updateSession = (session) => {
  window.localStorage.setItem('session', JSON.stringify(session));
  return session
}
