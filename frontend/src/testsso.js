import React, { Component } from 'react';
import LoginControl from './character/LoginControl';
import { connect } from 'react-redux'

class testsso extends React.Component {
  constructor(props){
    super(props);
  }
  myClick = () => {
    console.log(this.props);
  }
  render () {
    return (
      <div>
        <LoginControl />
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    reduxstate: state
  }
}

const mapDispatchToProps = dispatch => {
  return {}
}
export default connect(mapStateToProps, mapDispatchToProps)(testsso);
