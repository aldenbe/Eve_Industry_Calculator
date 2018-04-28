import React, { Component } from 'react';

class About extends React.Component {
  constructor(props){
    super(props);
  }
  render () {
    return (
      <div>
        <p>
          Eve Industry Calculator is a simple industry calculator Web app designed in React.
          <br/><br/>
          Eve Industry Calculator is open source, if you would like to contribute please visit the github page. <a href="https://github.com/aldenbe/Eve_Industry_Calculator">https://github.com/aldenbe/Eve_Industry_Calculator</a>
        </p>
      </div>
    );
  }
}

export default About;
