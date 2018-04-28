import * as React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { logout } from 'actions/UserActions'

class CharacterManager extends React.Component {

  render() {
    return (
      <button onClick={this.props.logout} >log out</button>
    )

  }
}

const mapStateToProps = state => {
  return {
    user: state.userReducer
  }
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators({
    logout
  }, dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(CharacterManager);
