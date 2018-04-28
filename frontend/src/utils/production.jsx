var fetch = require('fetch-retry');

export const getMinSellValue = (regionID, solarSystemID, stationID, typeID) => {
  return fetch('https://esi.tech.ccp.is/latest/markets/' + regionID + '/orders/?order_type=sell&type_id=' + typeID, {
    retryOn: [500, 502],
    retryDelay: 250,
    method: 'GET',
    headers: {
      "Content-Type": "application/json"
    }
  }).then(response => {
    if (response.ok){
      return response.json()
    }
  }).then(json => {

    //get minimum price or set 0 if no price available
    let minPrice = 0.0;
    if (json.length > 0){
      minPrice = json[0].price;
      if(stationID){
        for (let j = 1, len=json.length; j < len; j++){
          if(json[j].location_id != stationID) continue;
          let curPrice = json[j].price;
          minPrice = (curPrice < minPrice) ? curPrice : minPrice;
        }
      } else {
        for (let j = 1, len=json.length; j < len; j++){
          let curPrice = json[j].price;
          minPrice = (curPrice < minPrice) ? curPrice : minPrice;
        }
      }

    }

    return minPrice;
  });
}

export const getCostIndices = (caller) => {
    let costIndices = {};
    fetch('https://esi.tech.ccp.is/latest/industry/systems/?datasource=tranquility', {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'GET',
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => {
      if (response.ok){
        return response.json();
      }
    }).then(json => {
      for (let i = 0; i < json.length; i++){
        costIndices[json[i].solar_system_id] = {costIndices: {}};
        for (let j = 0; j < json[i].cost_indices.length; j++){
          costIndices[json[i].solar_system_id].costIndices[json[i].cost_indices[j].activity] = json[i].cost_indices[j].cost_index;
        }
      }
      caller.setState({
        costIndices: costIndices
      })
    });
  }

  export const getTypeValues = (caller) => {
    let typeValues = {};
    fetch('https://esi.tech.ccp.is/latest/markets/prices/?datasource=tranquility', {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'GET',
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => {
      if (response.ok){
        return response.json()
      }
    }).then(json => {
      for (let i = 0; i < json.length; i++){
        typeValues[json[i].type_id] = {
          averagePrice: json[i].average_price,
          adjustedPrice: json[i].adjusted_price
        };

      }
      caller.setState({
        typeValues: typeValues
      })
    });
  }

  export const calculateJobGrossCost = (blueprintTypeID, costIndices, typeValues, blueprintBuildMaterials, runs, selectedSystem, activity) => {
    let jobGrossCost = 0;
    if(blueprintTypeID && costIndices != {} && typeValues != {}){
      let totalExpectedValue = 0;
      for(let i = 0; i < blueprintBuildMaterials.length; i ++){
        totalExpectedValue += typeValues[blueprintBuildMaterials[i].materialTypeID].adjustedPrice * blueprintBuildMaterials[i].quantity;
      }
      jobGrossCost = costIndices[selectedSystem].costIndices[activity] * totalExpectedValue;
    }
    return jobGrossCost * runs
  }
