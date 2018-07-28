import { UPDATE_ITEM_PRICE } from '../actionTypes/MarketActionTypes';


export const marketReducer = (state = {}, action) => {
  switch(action.type){
    case UPDATE_ITEM_PRICE:
      return {
        ...state,
        [action.structureID]: {
          ...state[action.structureID],
          [action.typeID]: action.itemPrice


        }
      }
      break;
    default:
      return state
      break;
  }
}
