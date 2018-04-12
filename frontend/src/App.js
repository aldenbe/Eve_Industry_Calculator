import React, { Component } from 'react';
import { Redirect, BrowserRouter, NavLink, Route, Switch } from 'react-router-dom';
import { Container } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import Manufacturing from './Manufacturing';
//import About from './About';
//import Reactions from './Reactions';

import './App.css';

class App extends Component {

  constructor (props) {
    super(props)
    this.state = {

    }
  }
  handleLink = (e) => {
    console.log(e);
  }

  render() {
    return (
      <BrowserRouter>
        <div style={{ height: '100%' }}>
          <h1 className="eic">EIC</h1>
          <ul className="top-menu">
            <li className="menu-li">
              <NavLink to="/manufacturing" activeClassName="active" className="menu-link menu-manufacturing" title="Manufacturing" />
            </li>
            <li className="menu-li">
              <NavLink to="/reactions" activeClassName="active" className="menu-link menu-reactions" title="Reactions" />
            </li>
            <li className="menu-li">
              <NavLink to="/about" activeClassName="active" className="menu-link menu-about" title="About" />
            </li>
          </ul>
          <Container className="eic-container">

            <Switch>
              <Redirect exact from="/" to="/Manufacturing" />
              <Route path="/Manufacturing" component={Manufacturing} />
              {/*
              <Route path="/Reactions" component={Reactions} />
              <Route path="/About" component={About} />
              */}
            </Switch>
          </Container>
        </div>
      </BrowserRouter>
    );
  }
}
export default App;
