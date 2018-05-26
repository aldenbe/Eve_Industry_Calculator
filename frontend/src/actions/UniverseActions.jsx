import { UPDATE_STRUCTURES, UPDATE_SELECTED_LOCATION } from '../actionTypes/UniverseActionTypes'

export const update_structures = (structureObject, systemID, regionID): ActionObject =>
    ({
      type: UPDATE_STRUCTURES,
      regionID,
      systemID,
      structureObject
    })


  export const update_selected_location = (locationType, structureID, systemID, regionID): ActionObject =>
    ({
      type: UPDATE_SELECTED_LOCATION,
      regionID,
      systemID,
      structureID,
      locationType
    })
