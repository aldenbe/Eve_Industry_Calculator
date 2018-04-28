import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Provider } from 'react-redux'
import registerServiceWorker from './registerServiceWorker';
import { unregister } from './registerServiceWorker';
import { createStore, combineReducers } from 'redux';
import rootReducer from './reducers';

const store = createStore(rootReducer);


ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>
  , document.getElementById('root'));
//registerServiceWorker();
unregister();
