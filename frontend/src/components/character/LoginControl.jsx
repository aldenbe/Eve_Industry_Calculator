import * as React from 'react';
import { connect } from 'react-redux';
import Login from './Login';
import CharacterManager from './CharacterManager';



class LoginController extends React.Component {

  render() {
    let isLoggedIn = this.props.user.isLoggedIn
    const componentToDisplay = isLoggedIn ? (<CharacterManager />) : (<Login />);
     return (
       <div>
         {componentToDisplay}
       </div>

    )
  }
}

const mapStateToProps = state => {
  return {
    user: state.userReducer
  }
}

const mapDispatchToProps = dispatch => {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginController);
