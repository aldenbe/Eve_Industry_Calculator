import { combineReducers } from 'redux';
import { userReducer } from './UserReducer';
import { universeReducer } from './UniverseReducer'

const rootReducer = combineReducers({
  userReducer,
  universeReducer
})

export default rootReducer
