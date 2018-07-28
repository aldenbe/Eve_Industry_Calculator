import { combineReducers } from 'redux';
import { userReducer } from './UserReducer';
import { universeReducer } from './UniverseReducer';
import { marketReducer } from './MarketReducer';

const rootReducer = combineReducers({
  userReducer,
  universeReducer,
  marketReducer
})

export default rootReducer
