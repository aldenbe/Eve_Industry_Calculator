import { UPDATE_STRUCTURES, UPDATE_SELECTED_LOCATION } from '../actionTypes/UniverseActionTypes';
import universe from 'constants/Universe.json';
const initialLocations = {
  selectedBuyLocation: {
    selectedRegion: "10000002",
    selectedSystem: "30000142",
    selectedStructure: "60003760",
  },
  selectedSellLocation: {
    selectedRegion: "10000002",
    selectedSystem: "30000142",
    selectedStructure: "60003760",
  },
  selectedBuildLocation: {
    selectedRegion: "10000002",
    selectedSystem: "30000142",
    selectedStructure: "60003760",
  },
}
const initialState = Object.assign(universe, initialLocations);

export const universeReducer = (state = initialState, action) => {
  switch(action.type){
    case UPDATE_STRUCTURES:
      console.log(action.systemID)
      return {
        ...state,
        [action.regionID]: {
          ...state[action.regionID],
          systems: {
            ...state[action.regionID].systems,
            [action.systemID]: {
              ...state[action.regionID].systems[action.systemID],
              structures: {
                ...state[action.regionID].systems[action.systemID].structures,
                ...action.structureObject
              }
            }
          }
        }
      }
      break;
    case UPDATE_SELECTED_LOCATION:
      return {
        ...state,
        [action.locationType]: {
          selectedRegion: action.regionID || state[action.locationType].selectedRegion,
          selectedSystem: action.systemID || state[action.locationType].selectedSystem,
          selectedStructure: action.structureID || '',
        }
      }
    default:
      return state
      break;
  }

}
