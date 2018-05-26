import React, { Component } from 'react';
import LoginControl from 'components/character/LoginControl';
import { connect } from 'react-redux'

class testsso extends React.Component {
  myClick = () => {
    console.log(this.props);
  }
  render () {
    return (
      <div>
        <LoginControl />
        <button onClick={this.myClick}>log props</button>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    user: state.userReducer,
    universe: state.universeReducer
  }
}

const mapDispatchToProps = dispatch => {
  return {}
}
export default connect(mapStateToProps, mapDispatchToProps)(testsso);
