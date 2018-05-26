import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { login, logout } from 'actions/UserActions';
import { eveProvider } from 'providers/eve';
import RSA from 'react-simple-auth';
import { Button } from 'semantic-ui-react';
import { getNewToken } from 'utils/user';


var fetch = require('fetch-retry');
class Login extends React.Component {
  componentDidMount() {
    let session = RSA.restoreSession(eveProvider)
    if(session){
      this.getCharacterDetailsAndLogin(session)
    }
  }



  getCharacterDetailsAndLogin = async(session, retrys = 0) => {
    try{
      let characterInformation = await this.getCharacterInformation(session.access_token);
      let characterPortrait = await this.getCharacterPortrait(characterInformation.CharacterID);
      this.props.login(characterInformation.CharacterID, characterInformation.CharacterName, characterInformation.Scopes.split(' '), session.access_token, session.refresh_token, characterPortrait.px64x64, characterPortrait.px128x128, characterPortrait.px256x256, characterPortrait.px512x512, characterInformation.ExpiresOn)
    } catch(error) {
      if(error === 'invalid_token'){
        console.log(error)
        //in weird cases let's just make sure the app doesn't recursively try to get a new access token and login forever.
        if(retrys < 3){
          session = await getNewToken(session.refresh_token);
          retrys++;
          this.getCharacterDetailsAndLogin(session, retrys);
        } else {
          this.props.logout();
        }
      }
    }

  }
  getCharacterPortrait = async(characterID) => {
    let json;
    let response = await fetch('https://esi.tech.ccp.is/latest/characters/' + characterID + '/portrait/', {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
      }
    })
    if (response.ok){
      json = await response.json();
    }
    return json
  }
  getCharacterInformation = async(access_token) => {
    let json;
    let response = await fetch('https://esi.tech.ccp.is/verify/', {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + access_token
      }
    })
    if (response.ok){
      json = await response.json();
    } else if (response.status === 400) {
      json = await response.json();
    }
    if(json.error){
      throw json.error;
    }
    return json
  }
  onClickLogin = async() => {
    try {
        let session = await RSA.acquireTokenAsync(eveProvider)
        this.getCharacterDetailsAndLogin(session)
    } catch (error) {
        throw error
    }
  }
  render() {
      return (
        <div className="login">
          <input type="image" className="login-button" onClick={this.onClickLogin} src="./images/eve-sso-login-black-small.png" />
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {}
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators({
    login,
    logout
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);
