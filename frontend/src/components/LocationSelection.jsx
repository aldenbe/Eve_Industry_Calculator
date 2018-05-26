import React from 'react';
import { Dropdown, Grid } from 'semantic-ui-react';
import { API_ROOT } from 'APIConfig';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { update_structures, update_selected_location } from 'actions/UniverseActions';
import { update_access_token } from 'actions/UserActions';
import { getAccessToken } from 'utils/user';

var fetch = require('fetch-retry');

//FIXME: Even after significantly more effort expended designing this simple component than most other components and multiple refactorings I still hate this.
//I don't know why I think this component is particularly terrible and poorly designed anymore, but if anybody would like to fix it I'd appreciate it.

class LocationSelection extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      structureArray: []
    }
  }
  componentDidMount() {
    this.getStructureArray(this.props.universe[this.props.locationType].selectedRegion, this.props.universe[this.props.locationType].selectedSystem)
  }

  getStationsInSystem = async(regionID, systemID) => {
    let stations = [];
    let stationDetailsPromises = [];
    let stationObject = {};

    let systemResponse = await fetch('https://esi.tech.ccp.is/latest/universe/systems/' + systemID + '/?datasource=tranquility&language=en-us', {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'GET',
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (systemResponse.ok){
      let systemJson = await systemResponse.json();
      let numStations = 0;
      if (systemJson.stations) numStations = systemJson.stations.length;
      for(let i = 0; i < numStations; i++){
        let stationID = systemJson.stations[i];
        if(!this.props.universe[regionID].systems[systemID].structures[stationID]){
          let promise = fetch('https://esi.tech.ccp.is/latest/universe/stations/' + stationID + '/?datasource=tranquility', {
            retryOn: [500, 502],
            retryDelay: 250,
            method: 'GET',
            headers: {
              "Content-Type": "application/json"
            }
          }).then(stationResponse => {
            if (stationResponse.ok){
              return stationResponse.json()
            }
          }).then(stationJson => {
            stationObject[stationJson.station_id] = {
              name: stationJson.name,
              corporationID: stationJson.owner,
              typeID: stationJson.type_id
            }
          })
          stationDetailsPromises.push(promise);
        }
      }
      await Promise.all(stationDetailsPromises)
      return stationObject
    }
  }

  getCitadelsInSystem = async(regionID, systemID) => {
    let citadelObject = {};
    let citadelDetailsPromises = [];

    //check that there are at least 10 seconds before access token expires or get new token
    let accessToken = await getAccessToken(this.props.user, this.props.update_access_token)


    let systemName = this.props.universe[regionID].systems[systemID].systemName;
    let searchResponse = await fetch('https://esi.tech.ccp.is/latest/characters/' + this.props.user.characterID + '/search/?categories=structure&search=' + systemName, {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'GET',
      headers: {
        "Authorization": 'Bearer ' + accessToken
      }
    })
    if(searchResponse.ok){
      let searchJson = await searchResponse.json();
      let citadelIDs = searchJson.structure || [];
      for(let i = 0; i < citadelIDs.length; i++){
        let citadelID = citadelIDs[i];
        if(!this.props.universe[regionID].systems[systemID].structures[citadelID]){
          let promise = fetch('https://esi.tech.ccp.is/latest/universe/structures/' + citadelID + '/?datasource=tranquility', {
            retryOn: [500, 502],
            retryDelay: 250,
            method: 'GET',
            headers: {
              "Content-Type": "application/json",
              "Authorization": 'Bearer ' + this.props.user.accessToken
            }
          }).then(citadelResponse => {
            if (citadelResponse.ok){
              return citadelResponse.json()
            }
          }).then(citadelJson => {
            citadelObject[citadelID] = {
              name: citadelJson.name,
              typeID:citadelJson.type_id
            };
          })
          citadelDetailsPromises.push(promise);
        }
      }
      await Promise.all(citadelDetailsPromises)
      return citadelObject
    }
  }

  getRegionArray = () => {
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

  getSystemArray = (regionID) => {
    let systems = [];
    for (let systemID in this.props.universe[regionID].systems){
      systems.push({
        value: systemID,
        text: this.props.universe[regionID].systems[systemID].systemName
      })
    }
    return systems;
  }

  getStructureArray = async(regionID, systemID) => {
    let structures = [];
    let stationObject = await this.getStationsInSystem(regionID, systemID)
    let citadelObject = {};
    if(this.props.user.isLoggedIn){
      citadelObject = await this.getCitadelsInSystem(regionID, systemID)
    }
    let structureObject = await Object.assign(stationObject, citadelObject)
    //console.log(structureObject)
    await this.props.update_structures(structureObject, systemID, regionID)
    if(Object.keys(this.props.universe[regionID].systems[systemID].structures).length){
      for (let structureID in this.props.universe[regionID].systems[systemID].structures) {
        structures.push({
          key: this.props.locationType + structureID,
          value: structureID,
          text: this.props.universe[regionID].systems[systemID].structures[structureID].name,
        })
      }
    }
    this.setState({
      structureArray: structures
    })
    return structures
  }

  handleChangeRegion = async(e, { value }) => {
    let regionID = value;
    if(this.props.universe[this.props.locationType].selectedRegion !== regionID){

      let systemID = "";
      let structureID = "";
      let systems = this.getSystemArray(regionID);
      if (systems.length){
        systemID = systems[0].value;
        let structures = await this.getStructureArray(regionID, systemID)
        if (structures.length){
          structureID = structures[0].value;
        }

      }

      //if (stations) stationID = stations[0].value;
      await this.props.update_selected_location(this.props.locationType, structureID, systemID, regionID);
      this.props.triggerParentUpdate();
    }

  }

  handleChangeSystem = async(e, { value }) => {

    let systemID = value;
    if(this.props.universe[this.props.locationType].selectedSystem !== systemID){

      let structureID = "";
      let structures = await this.getStructureArray(this.props.universe[this.props.locationType].selectedRegion, systemID)
      if (structures.length){
        structureID = structures[0].value;
      }
      await this.props.update_selected_location(this.props.locationType, structureID, systemID);
      this.props.triggerParentUpdate();
    }
  }

  handleChangeStructure = async(e, { value }) => {
    let structureID = value;
    if(this.props.universe[this.props.locationType].selectedStructure !== structureID)
      await this.props.update_selected_location(this.props.locationType, structureID);
      this.props.triggerParentUpdate();
  }

  render() {
    return (
      <Grid.Column>
        <Dropdown
          search
          selection
          options={this.getRegionArray()}
          onChange={this.handleChangeRegion}
          value={this.props.universe[this.props.locationType].selectedRegion}
        />
        <Dropdown
          search
          selection
          options={this.getSystemArray(this.props.universe[this.props.locationType].selectedRegion)}
          onChange={this.handleChangeSystem}
          value={this.props.universe[this.props.locationType].selectedSystem}
        />
        <Dropdown
          search
          selection
          options={this.state.structureArray}
          onChange={this.handleChangeStructure}
          value={this.props.universe[this.props.locationType].selectedStructure}
        />
      </Grid.Column>
    )
  }
}

const mapStateToProps = state => {
  return {
    user: state.userReducer,
    universe: state.universeReducer
  }
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators({
    update_structures,
    update_selected_location,
    update_access_token
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LocationSelection);
