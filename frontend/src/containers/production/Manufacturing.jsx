import React from 'react';
import { Dropdown, Grid, Form, Checkbox, Input, Table, Button } from 'semantic-ui-react';
import './Manufacturing.css';
import manufacturingConstants from 'constants/ManufacturingConstants.json';
import universe from 'constants/Universe.json';
import { API_ROOT, ICON_ROOT } from 'APIConfig';
import LocationSelection from 'components/LocationSelection';
import { MaterialsTable, Totals } from 'components/production/MaterialsTable';
import BlueprintSelection from 'components/production/BlueprintSelection';
import OutputInformation from 'components/production/OutputInformation';
import { getMinSellValue, getCostIndices, getTypeValues, calculateJobGrossCost } from 'utils/production';
import { formatNumbersWithCommas, formatTime } from 'utils/general';

var fetch = require('fetch-retry');

class Manufacturing extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      constIndices: {},
      typeValues: {},
      universe: universe,
      productSellPrice: 0,
      blueprintTypes: manufacturingConstants.blueprintTypes,
      blueprints: [],
      selectedBlueprint: {
        typeID: null,
        rawBuildTime: 0,
        productTypeID: null,
        quantity: 0,
        maxProductionLimit: 0
      },
      selectedBlueprintTypeIndex: 0,
      blueprintBuildMaterials: [],
      regionID: '10000002',
      runs: 0,
      materialEfficiency: 0,
      timeEfficiency: 0,
      selectedBuyLocation: {
        selectedRegion: "10000002",
        selectedSystem: "30000142",
        selectedStation: "60003760",
      },
      selectedSellLocation: {
        selectedRegion: "10000002",
        selectedSystem: "30000142",
        selectedStation: "60003760",
      },
      selectedBuildLocation: {
        selectedRegion: "10000002",
        selectedSystem: "30000142",
        selectedStation: "60003760",
      },
    }

  }
  componentDidMount() {
    this.getBlueprints();
    getCostIndices(this);
    getTypeValues(this);
  }




  handleBlueprintSelection = (e, { value }) => {
    if(this.state.selectedBlueprint.typeID !== value){
      this.getBlueprintDetails(value);
      this.getBlueprintMaterials(value);
    }
  };

  handleBlueprintTypeSelectionChange = (e, {value}) => {
    if(this.state.selectedBlueprintTypeIndex !== value){
      this.setState({
        selectedBlueprintTypeIndex: value
      }, () => {this.getBlueprints();});
    }
  };

  getBlueprints = () => {
    fetch(API_ROOT + 'getblueprints.php', {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        //FIXME: shift backend handling of blueprint type to group ids to manufacturing constants and pass to backend
        selectedBlueprintType: this.state.blueprintTypes[this.state.selectedBlueprintTypeIndex].type
      }),
    }).then(response => {
      if (response.ok) {
        response.json().then(json => {
          this.setState({
            blueprints: json
          });
        })
      }
    });
  }
  getBlueprintDetails = (selectedBlueprint) => {
    if(selectedBlueprint != null){
      fetch(API_ROOT + 'getblueprintdetails.php', {
        retryOn: [500, 502],
        retryDelay: 250,
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedBlueprint: selectedBlueprint
        }),
      }).then(response => {
        if (response.ok) {
          response.json().then(blueprintResponse => {
            this.setState({
              selectedBlueprint: blueprintResponse,
              runs: blueprintResponse.maxProductionLimit,
            }, this.getProductPrice)

          })

        }
      });
    }
  }

  getJobGrossCost = () => {
    return calculateJobGrossCost(this.state.selectedBlueprint.typeID, this.state.costIndices, this.state.typeValues, this.state.blueprintBuildMaterials, this.state.runs, this.state.selectedBuildLocation.selectedSystem, 'manufacturing')
  }

  getJobInstallTax = () => {
    let jobGrossCost = this.getJobGrossCost();
    //FIXME: get actual station tax
    let tax = 0.1;
    return jobGrossCost * tax;
  }

  getProductPrice = () => {
    getMinSellValue(this.state.selectedSellLocation.selectedRegion, this.state.selectedSellLocation.selectedSystem, this.state.selectedSellLocation.selectedStation, this.state.selectedBlueprint.productTypeID).then(minSellPrice => {
      this.setState({
        productSellPrice: minSellPrice
      })
    })
  }

  getBlueprintMaterials = (selectedBlueprint) => {
    if(selectedBlueprint != null){
      fetch(API_ROOT + 'getblueprintmaterials.php', {
        retryOn: [500, 502],
        retryDelay: 250,
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedBlueprint: selectedBlueprint
        }),
      }).then(response => {
        if (response.ok) {
          response.json().then(materialArray => {
            this.getMaterialSellValues(materialArray);
            //console.log(blueprintBuildMaterials);

          })
        }
      });
    }
  }

  getMaterialQuantityAfterME = (materialIndex) => {
    let quantity = this.state.blueprintBuildMaterials[materialIndex].quantity;
    if(quantity === 1){
      return quantity * this.state.runs
    } else {
      quantity = Math.ceil((quantity) * this.state.runs * (1 - this.state.materialEfficiency / 100));
    }
    return quantity
  }

  getTotalMaterialVolume = () => {
    let totalVolume = 0;
    for (var i = 0; i < this.state.blueprintBuildMaterials.length; i++){
      totalVolume += (this.getMaterialQuantityAfterME(i) * this.state.blueprintBuildMaterials[i].volume);
    }
    return totalVolume
  }

  getTotalMaterialCost = () => {
    let totalCost = 0;
    for (var i = 0; i < this.state.blueprintBuildMaterials.length; i++){
      totalCost += (this.getMaterialQuantityAfterME(i) * this.state.blueprintBuildMaterials[i].costPerItem);
    }
    return totalCost
  }

  getMaterialSellValues = (blueprintBuildMaterials) => {
    let materialValuePromises = [];
    for (let i = 0; i < blueprintBuildMaterials.length; i++) {

      let promise = getMinSellValue(this.state.selectedBuyLocation.selectedRegion, this.state.selectedBuyLocation.selectedSystem, this.state.selectedBuyLocation.selectedStation, blueprintBuildMaterials[i].materialTypeID).then((minPrice) => {
        blueprintBuildMaterials[i].costPerItem = minPrice;
      });


      materialValuePromises.push(promise);
    }
    //after all prices are fetched update state
    Promise.all(materialValuePromises).then(() => {

      this.setState({
        blueprintBuildMaterials: blueprintBuildMaterials,
      })
    });

  }
  onInputChange = (e) => {
    let radix = 10;
    if (parseInt(e.target.value, radix) > parseInt(e.target.max, radix)) {
      e.target.value = e.target.max;
    } else if (parseInt(e.target.value, radix) < parseInt(e.target.min, radix)) {
      e.target.value = e.target.min;
    }
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  //FIXME: refactor location and universe
  changeLocationSelection = (locationType, station, system, region) => {
    let selectedLocation
    switch(locationType) {
      case 'buy':
        selectedLocation = 'selectedBuyLocation';
        break;
      case 'sell':
        selectedLocation = 'selectedSellLocation';
        break;
      case 'build':
        selectedLocation = 'selectedBuildLocation';
        break;
    }
    region = region || this.state[selectedLocation].selectedRegion;
    system = system || this.state[selectedLocation].selectedSystem;
    this.setState({
      [selectedLocation]: {
        selectedRegion: region,
        selectedSystem: system,
        selectedStation: station,
      }
    }, () => {
      if(this.state.selectedBlueprint.typeID){
        this.getProductPrice();
        this.getMaterialSellValues(this.state.blueprintBuildMaterials);

      }
    })
  }

  updateUniverse = (regionID, solarSystemID, stationsToAdd) => {
    let universe = this.state.universe;
    //let stations = this.state.universe[regionID].solarSystems[solarSystemID].stations;
    if(stationsToAdd.length > 0){
      for(let i = 0; i < stationsToAdd.length; i++){
        if(universe[regionID].systems[solarSystemID].stations.length == 0){
          universe[regionID].systems[solarSystemID].stations = {
            [stationsToAdd[i].stationID]: {
              stationName: stationsToAdd[i].name,
              corporationID: stationsToAdd[i].corporationID
            }
          };
        } else {
          universe[regionID].systems[solarSystemID].stations[stationsToAdd[i].stationID] = {
            stationName: stationsToAdd[i].name,
            corporationID: stationsToAdd[i].corporationID
          }
        }

      }
      this.setState({
        //universe[regionID].solarSystems[solarSystems].stations: stations
        universe: universe
      })
    }
  }

  render() {
    return (
      <div className="manufacturing-layout">
        <Grid>
          <Grid.Row> {/*First component row*/}
            <BlueprintSelection
              placeholder={'Select Blueprint'}
              blueprints={this.state.blueprints}
              handleBlueprintSelection={this.handleBlueprintSelection}
              blueprintTypes={this.state.blueprintTypes}
              selectedBlueprintTypeIndex={this.state.selectedBlueprintTypeIndex}
              handleBlueprintTypeSelectionChange={this.handleBlueprintTypeSelectionChange}
            />
            <Grid.Column width={6}>
              <Grid>
                <Grid.Row>
                  <Grid.Column width={6}>
                    <img className="bordered-icon" src={ICON_ROOT + this.state.selectedBlueprint.typeID + '_64.png'} alt=""></img>
                  </Grid.Column>
                  <Grid.Column width={10}>
                    <Grid>
                      <Grid.Row>
                        <Grid.Column>
                          <label htmlFor='runsInput'>Runs: </label>
                          <Input
                          style={{width:'70%'}}
                          id="runsInput"
                          min="1"
                          name="runs"
                          max={this.state.selectedBlueprint.maxProductionLimit}
                          value={this.state.runs}
                          onChange={this.onInputChange}
                          />

                        </Grid.Column>

                      </Grid.Row>
                      <Grid.Row columns='equal'>
                        <Grid.Column>
                          <label htmlFor="meInput">ME: </label>
                            <Input
                            style={{width:'40px'}}
                            id="meInput"
                            min="0"
                            name="materialEfficiency"
                            max="10"
                            value={this.state.materialEfficiency}
                            onChange={this.onInputChange}
                            />
                        </Grid.Column>
                        <Grid.Column>
                          <label htmlFor="teInput">TE: </label>
                            <Input
                              style={{width:'40px'}}
                            id="teInput"
                            min="0"
                            name="timeEfficiency"
                            max="10"
                            value={this.state.timeEfficiency}
                            onChange={this.onInputChange}
                            />
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>


                  </Grid.Column>
                </Grid.Row>

              </Grid>

            </Grid.Column>
            <Grid.Column width={4}>
              <OutputInformation
                productSellPrice={this.state.productSellPrice}
                runs={this.state.runs}
                quantityProduced={this.state.selectedBlueprint.quantity}
                getTotalMaterialCost={this.getTotalMaterialCost}
                rawBuildTime={this.state.selectedBlueprint.rawBuildTime}
                materialEfficiency={this.state.materialEfficiency}
                timeEfficiency={this.state.timeEfficiency}
                getJobGrossCost={this.getJobGrossCost}
                getJobInstallTax={this.getJobInstallTax}
              />
            </Grid.Column>

          </Grid.Row>
          <Grid.Row>
            Buy:
            <LocationSelection
              changeLocationSelection={this.changeLocationSelection}
              selectedLocation={this.state.selectedBuyLocation}
              universe={this.state.universe}
              updateUniverse={this.updateUniverse}
              locationType="buy"
            />
          </Grid.Row>
          <Grid.Row>
            Sell:
            <LocationSelection
              changeLocationSelection={this.changeLocationSelection}
              selectedLocation={this.state.selectedSellLocation}
              universe={this.state.universe}
              updateUniverse={this.updateUniverse}
              locationType="sell"
            />
          </Grid.Row>
          <Grid.Row>
            Build:
            <LocationSelection
              changeLocationSelection={this.changeLocationSelection}
              selectedLocation={this.state.selectedBuildLocation}
              universe={this.state.universe}
              updateUniverse={this.updateUniverse}
              locationType="build"
            />
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <MaterialsTable
                getMaterialQuantityAfterME={this.getMaterialQuantityAfterME}
                blueprintBuildMaterials={this.state.blueprintBuildMaterials}
                runs={this.state.runs}
              />
            </Grid.Column>

          </Grid.Row>
          <Totals
            runs={this.state.runs}
            totalMaterialCost={this.getTotalMaterialCost()}
            totalMaterialVolume={this.getTotalMaterialVolume()}
          />
        </Grid>
      </div>
    )
  }
}

export default Manufacturing
