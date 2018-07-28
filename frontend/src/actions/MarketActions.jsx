import { UPDATE_ITEM_PRICE } from '../actionTypes/MarketActionTypes'

export const update_item_price = (typeID, structureID, itemPrice): ActionObject =>
  ({
    type: UPDATE_ITEM_PRICE,
    typeID,
    structureID,
    itemPrice
  })
