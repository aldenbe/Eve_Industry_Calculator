import React from 'react';
import { Dropdown, Grid } from 'semantic-ui-react';
import { API_ROOT } from 'APIConfig';

var fetch = require('fetch-retry');

//FIXME: something has gone horribly wrong and I hate this implementation
//Everything about this feels wrong and terrible and like i am horribly abusing react
//I hope somebody can fix this unholy mess
class LocationSelection extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      regions: [],
      solarSystems: [],
      stations: [],

    }
    this.createDropdownArrays();
  }
  /* Nice to have a procedural method, but this data is in sde and faster to import from a json file
  getRegions = () => {
    fetch(API_ROOT + 'getlocations.php', {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
    }).then(response => {
      if (response.ok) {
        response.json().then(json => {
          console.log(json);
          console.log(Object.keys(json).length); //should be 65 once everything is correct
          for(let key in json){
            console.log(json[key].regionName);
          }
          let regions = [];
          let solarSystems = [];
          let stations = [];
          for (let key in json) {
            regions.push({
              key: key,
              value: key,
              text: json[key].regionName
            })
          }
          for (let key in json[this.props.selectedLocation.selectedRegion].systems){
            solarSystems.push({
              key: key,
              value: key,
              text: json[this.props.selectedLocation.selectedRegion].systems[key].solarSystemName
            })
          }
          for (let key in json[this.props.selectedLocation.selectedRegion].systems[this.props.selectedLocation.selectedSystem].stations){
            stations.push({
              key: key,
              value: key,
              text: json[this.props.selectedLocation.selectedRegion].systems[this.props.selectedLocation.selectedSystem].stations[key].stationName
            })
          }
          this.setState({
            universe: json,
            regions: regions,
            solarSystems: solarSystems,
            stations: stations
          });
        })
      }
    });

  }*/

  createDropdownArrays = () => {
    let regions = this.createRegionArray();
    let solarSystems = this.createSolarSystemArray(this.props.selectedLocation.selectedRegion);
    let stations = this.createStationArray(this.props.selectedLocation.selectedRegion, this.props.selectedLocation.selectedSystem);

    this.state = {
      regions: regions,
      solarSystems: solarSystems
    }
  }

  createRegionArray = () => {
    let regions = [];
    for (let regionID in this.props.universe) {
      regions.push({
        key: regionID,
        value: regionID,
        text: this.props.universe[regionID].regionName
      })
    }
    return regions;
  }

  createSolarSystemArray = (regionID) => {
    let solarSystems = [];
    for (let solarSystemID in this.props.universe[regionID].systems){
      solarSystems.push({
        value: solarSystemID,
        text: this.props.universe[regionID].systems[solarSystemID].solarSystemName
      })
    }
    return solarSystems;
  }

  createStationArray = (regionID, solarSystemID) => {
    let stations = [];
    let stationsToAdd = [];
    let stationDetailsPromises = [];

    fetch('https://esi.tech.ccp.is/latest/universe/systems/' + solarSystemID + '/?datasource=tranquility&language=en-us', {
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
      let numStations = 0;
      if (json.stations) numStations = json.stations.length;
      for(let i = 0; i < numStations; i++){
        let stationID = json.stations[i];
        if(!this.props.universe[regionID].systems[solarSystemID].stations[stationID]){
          let promise = fetch('https://esi.tech.ccp.is/latest/universe/stations/' + stationID + '/?datasource=tranquility', {
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
            stationsToAdd.push({
              stationID: json.station_id,
              name: json.name,
              corporationID: json.owner
            })
          })
          stationDetailsPromises.push(promise);
        }

      }
    }).then( () => {
      Promise.all(stationDetailsPromises).then(() => {
        this.props.updateUniverse(regionID, solarSystemID, stationsToAdd);
        for (let stationID in this.props.universe[regionID].systems[solarSystemID].stations) {
          stations.push({
            value: stationID,
            text: this.props.universe[regionID].systems[solarSystemID].stations[stationID].stationName,
          })
          if(this.props.selectedLocation.selectedStation === "" && stations.length) this.props.changeLocationSelection(this.props.locationType, stations[0].value);
        }
        this.setState({
          stations: stations
        })
      })
    })

  }

  handleChangeRegion = (e, { value }) => {
    let regionID = value;
    if(this.props.selectedLocation.selectedRegion !== regionID){
      let solarSystems = this.createSolarSystemArray(regionID);
      this.setState({
        solarSystems: solarSystems,
      })
      let stations = this.createStationArray(regionID, solarSystems[0].value);


      let solarSystemID = "";
      if (solarSystems[0]) solarSystemID = solarSystems[0].value;
      let stationID = "";
      if (stations) stationID = stations[0].value;
      this.props.changeLocationSelection(this.props.locationType, stationID, solarSystemID, value);
    }

  }

  handleChangeSystem = (e, { value }) => {
    let solarSystemID = value;
    if(this.props.selectedLocation.selectedSystem !== solarSystemID){
      let stations = this.createStationArray(this.props.selectedLocation.selectedRegion, solarSystemID);

      let stationID = "";
      if (stations) stationID = stations[0].value;
      this.props.changeLocationSelection(this.props.locationType, stationID, solarSystemID);
    }
  }

  handleChangeStation = (e, { value }) => {
    let stationID = value;
    if(this.props.selectedLocation.selectedStation !== stationID)
      this.props.changeLocationSelection(this.props.locationType, stationID);
  }

  render() {
    return (
      <Grid.Column>
        <Dropdown
          search
          selection
          options={this.state.regions}
          onChange={this.handleChangeRegion}
          value={this.props.selectedLocation.selectedRegion}
        />
        <Dropdown
          search
          selection
          options={this.state.solarSystems}
          onChange={this.handleChangeSystem}
          value={this.props.selectedLocation.selectedSystem}
        />
        <Dropdown
          search
          selection
          options={this.state.stations}
          onChange={this.handleChangeStation}
          value={this.props.selectedLocation.selectedStation}
        />
      </Grid.Column>
    )
  }
}
export default LocationSelection
