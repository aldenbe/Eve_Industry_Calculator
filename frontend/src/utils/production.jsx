var fetch = require('fetch-retry');


//FIXME pull this info from db at some point
const stationTypeIDs = [54, 56, 57, 58, 59, 1529, 1530, 1531, 1926, 1927, 1928, 1929, 1930, 1931, 1932, 2071, 2496, 2497, 2498, 2499, 2500, 2501, 2502, 3864, 3865, 3866, 3867, 3868, 3869, 3870, 3871, 3872, 4023, 4024, 9856, 9857, 9867, 9868, 9873, 10795, 12242, 12294, 12295, 19757, 21642, 21644, 21645, 21646, 22296, 22297, 22298, 29323, 29387, 29388, 29389, 29390, 34325, 34326];
const structureTypeIDs = [35825, 35826, 35827, 35828, 35829, 35830, 35835, 35836, 35838, 35839, 37533, 35837, 35840, 35841, 37534, 35842, 35843, 35844, 35845, 37535, 37536, 35832, 35833, 35834, 40340, 47512, 47513, 47514, 47515, 47516, 45006, 46363, 46364];

//FIXME: handle multiple pages
export const getMinSellValue = async(regionID, systemID, structureID, structureTypeID, typeID, accessToken) => {
  let minPrice = 'N/A';
  let numPages;
  //if structure is station
  if (stationTypeIDs.indexOf(parseInt(structureTypeID)) != -1){
    return fetch('https://esi.tech.ccp.is/latest/markets/' + regionID + '/orders/?order_type=sell&type_id=' + typeID, {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'GET',
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => {
      //FIXME: response errors 403 if no access
      numPages = response.headers.get('x-pages');
      return response.json();
    }).then(json => {
      if(numPages > 1){
        let allOrders = [];
        let promises = [];
        allOrders = allOrders.concat(json)
        for (let i = 2; i <= numPages; i++){
          let promise = fetch('https://esi.tech.ccp.is/latest/markets/' + regionID + '/orders/?order_type=sell&type_id=' + typeID + '&page=' + i, {
            retryOn: [500, 502],
            retryDelay: 250,
            method: 'GET',
            headers: {
              "Content-Type": "application/json",
            }
          }).then(response => {
            if(response.ok){
              return response.json();
            }
            else
              return []
          }).then(json => {
            allOrders = allOrders.concat(json);
          })
          promises.push(promise);

        }
        return Promise.all(promises).then(() => {
          return allOrders;
        })
      }
      else
        return json
    }).then(json => {
      //get minimum price or leave 'N/A' if no price available
      if (json.length > 0){
        if(structureID){
          for (let j = 0; j < json.length; j++){
            if(json[j].location_id != structureID) continue;
            let curPrice = json[j].price;

            minPrice = (curPrice < minPrice || minPrice == 'N/A') ? curPrice : minPrice;
          }
        } else {
          for (let j = 0; j < json.length; j++){
            let curPrice = json[j].price;
            minPrice = (curPrice < minPrice || minPrice == 'N/A') ? curPrice : minPrice;
          }
        }

      }

      return minPrice;
    });
  }
  //if structure is non station structure
  else if (structureTypeIDs.indexOf(parseInt(structureTypeID)) != -1) {
    let headers = {
      "Content-Type": "application/json",
    }
    if(accessToken){
      headers.Authorization = "Bearer " + accessToken;
    }
    return fetch('https://esi.evetech.net/latest/markets/structures/' + structureID + '/', {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'GET',
      headers: headers
    }).then(response => {
      numPages = response.headers.get('x-pages');
      return response.json()
    }).then(json => {
      if(numPages > 1){
        let allOrders = [];
        let promises = [];
        allOrders = allOrders.concat(json)
        for (let i = 2; i <= numPages; i++){
          let promise = fetch('https://esi.evetech.net/latest/markets/structures/' + structureID + '/?page=' + i, {
            retryOn: [500, 502],
            retryDelay: 250,
            method: 'GET',
            headers: headers
          }).then(response => {
            if(response.ok){
              return response.json()
            }
            else
              return []
          }).then(json => {
            allOrders = allOrders.concat(json);
          })
          promises.push(promise);
        }
        return Promise.all(promises).then(() => {
          return allOrders;
        })
      }
      else
        return json
    }).then(json => {
      if (json.length > 0){
        for (let j = 0; j < json.length; j++){
          if(json[j].type_id != typeID) continue;
          if(!json[j].is_buy_order) {
            let curPrice = json[j].price;
            minPrice = (curPrice < minPrice || minPrice == 'N/A') ? curPrice : minPrice;
          }
        }
      }
      return minPrice
    })
  }

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
