import React, { Component } from 'react';
import { Container, Dropdown, Grid, Form, Checkbox, Input, Table } from 'semantic-ui-react';
import { API_ROOT, ICON_ROOT } from 'APIConfig';
import LocationSelection from 'components/LocationSelection';
import BlueprintSelection from 'components/production/BlueprintSelection';
import manufacturingConstants from 'constants/ManufacturingConstants.json';
import universe from 'constants/Universe.json';
import { MaterialsTable, Totals } from 'components/production/MaterialsTable';
import { getMinSellValue, getCostIndices, getTypeValues, calculateJobGrossCost } from 'utils/production';
import { formatNumbersWithCommas, formatTime } from 'utils/general';
import OutputInformation from 'components/production/OutputInformation';


class Reactions extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      costIndices: {},
      typeValues: {},
      productSellPrice: 0,
      universe: universe,
      reactionTypes: manufacturingConstants.reactionTypes,
      reactions: [],
      selectidReactionTypeIndex: 0,
      selectedReaction: {
        typeID: null,
        rawProductionTime: 0,
        productTypeID: null,
        quantity: 0
      },
      selectedReactionTypeIndex: 0,
      reactionBuildMaterials: [],
      runs: 1,
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
    this.getReactions();
    getCostIndices(this);
    getTypeValues(this);
  }
  getReactions = () => {
    fetch(API_ROOT + 'getreactions.php', {
      retryOn: [500, 502],
      retryDelay: 250,
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        selectedReactionType: 'all', //FIXME: this.state.blueprintTypes[this.state.selectedReactionTypeIndex].type
      }),
    }).then(response => {
      if (response.ok) {
        response.json().then(json => {
          this.setState({
            reactions: json
          });
        })
      }
    });
  }

  getTotalMaterialVolume = () => {
    let totalVolume = 0;
    for (var i = 0; i < this.state.reactionBuildMaterials.length; i++){
      totalVolume += (this.state.reactionBuildMaterials[i].quantity * this.state.runs * this.state.reactionBuildMaterials[i].volume);
    }
    return totalVolume
  }

  getTotalMaterialCost = () => {
    let totalCost = 0;
    for (var i = 0; i < this.state.reactionBuildMaterials.length; i++){
      console.log(this.state.reactionBuildMaterials[i].costPerItem)
      totalCost += (this.state.reactionBuildMaterials[i].quantity * this.state.runs * this.state.reactionBuildMaterials[i].costPerItem);
      console.log(totalCost);
    }
    return totalCost
  }

  handleReactionSelection = (e, {value}) => {
    if(this.state.selectedReaction.typeID !== value){
      this.getReactionDetails(value);
      this.getReactionMaterials(value);
    }
  };

  handleReactionTypeSelectionChange = (e, {value}) => {
    if(this.state.selectedReactionTypeIndex !== value){
      this.setState({
        selectedReactionTypeIndex: value
      }, () => {this.getReactions();});
    }
  };

  getReactionDetails = (selectedReaction) => {
    if(selectedReaction != null){
      fetch(API_ROOT + 'getreactiondetails.php', {
        retryOn: [500, 502],
        retryDelay: 250,
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedReaction: selectedReaction
        }),
      }).then(response => {
        if (response.ok) {
          response.json().then(reactionResponse => {
            this.setState({
              selectedReaction: reactionResponse,
            })
            this.getProductPrice();

          })
        }
      });
    }
  }
  getReactionMaterials = (selectedReaction) => {
    if(selectedReaction != null){
      fetch(API_ROOT + 'getreactionmaterials.php', {
        retryOn: [500, 502],
        retryDelay: 250,
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedReaction: selectedReaction
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

  getJobGrossCost = () => {
    return calculateJobGrossCost(this.state.selectedReaction.typeID, this.state.costIndices, this.state.typeValues, this.state.reactionBuildMaterials, this.state.runs, this.state.selectedBuildLocation.selectedSystem, 'reaction')
  }

  getJobInstallTax = () => {
    let jobGrossCost = this.getJobGrossCost();
    //FIXME: get actual station tax
    let tax = 0.1;
    return jobGrossCost * tax;
  }

  getProductPrice = () => {
    getMinSellValue(this.state.selectedSellLocation.selectedRegion, this.state.selectedSellLocation.selectedSystem, this.state.selectedSellLocation.selectedStation, this.state.selectedReaction.productTypeID).then(minSellPrice => {
      this.setState({
        productSellPrice: minSellPrice
      })
    })
  }

  //FIXME: refactor this
  getMaterialQuantityAfterME = (materialIndex) => {
    let quantity = this.state.reactionBuildMaterials[materialIndex].quantity;
    return quantity * this.state.runs
  }

  getMaterialSellValues = (reactionBuildMaterials) => {
    var promises = [];
    for (let i = 0; i < reactionBuildMaterials.length; i++) {

      var promise = getMinSellValue(this.state.selectedBuyLocation.selectedRegion, this.state.selectedBuyLocation.selectedSystem, this.state.selectedBuyLocation.selectedStation, reactionBuildMaterials[i].materialTypeID).then((minPrice) => {
        reactionBuildMaterials[i].costPerItem = minPrice;
      });


      promises.push(promise);
    }
    //after all prices are fetched update state
    Promise.all(promises).then((values) => {

      let totalCost = 0.00;
      let totalVolume = 0.00;
      for (let i = 0; i < reactionBuildMaterials.length; i++){
        totalVolume += (reactionBuildMaterials[i].volume * reactionBuildMaterials[i].quantity);
        totalCost += (reactionBuildMaterials[i].costPerItem * reactionBuildMaterials[i].quantity);
      }
      totalCost = totalCost.toFixed(2);
      totalVolume = totalVolume.toFixed(2);
      this.setState({
        reactionBuildMaterials: reactionBuildMaterials,
      })
    });
  }

  onRunsInputChange = (e) => {
    let radix = 10;
    if (parseInt(e.target.value, radix) < parseInt(e.target.min, radix)) {
      e.target.value = e.target.min;
    }
    this.setState({
      runs: e.target.value,
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
      if(this.state.selectedReaction.typeID){
        this.getProductPrice();
        this.getMaterialSellValues(this.state.reactionBuildMaterials);

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

  render () {
    return (
      <div className='reactions-layout'>
        <Grid>
          <Grid.Row>
            <BlueprintSelection
              placeholder={'Select Reaction'}
              blueprints={this.state.reactions}
              handleBlueprintSelection={this.handleReactionSelection}
              blueprintTypes={this.state.reactionTypes}
              selectedBlueprintTypeIndex={this.state.selectedReactionTypeIndex}
              handleBlueprintTypeSelectionChange={this.handleReactionTypeSelectionChange}
            />
            <Grid.Column width={6}>
              <Grid>
                <Grid.Row>
                  <Grid.Column width={6}>
                    <img className="bordered-icon" src={ICON_ROOT + this.state.selectedReaction.typeID + '_64.png'} alt=""></img>
                  </Grid.Column>
                  <Grid.Column width={10}>
                    <Grid>
                      <Grid.Row>
                        <Grid.Column width={6}>
                          <p>Runs: </p>
                        </Grid.Column>
                        <Grid.Column width={10}>
                          <Input
                          style={{width:'100%'}}
                          min="1"
                          name="runs"
                          value={this.state.runs}
                          onChange={this.onRunsInputChange}
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
                quantityProduced={this.state.selectedReaction.quantity}
                getTotalMaterialCost={this.getTotalMaterialCost}
                rawBuildTime={this.state.selectedReaction.rawProductionTime}
                materialEfficiency={0}
                timeEfficiency={0}
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
                blueprintBuildMaterials={this.state.reactionBuildMaterials}
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

export default Reactions;
