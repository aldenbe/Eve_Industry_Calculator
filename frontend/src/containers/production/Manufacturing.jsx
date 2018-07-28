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
import { getMinSellValue, getCostIndices, getTypeValues, calculateJobGrossCost, getPriceFromReduxStore } from 'utils/production';
import { formatNumbersWithCommas, formatTime } from 'utils/general';
import LoginControl from 'components/character/LoginControl';
import { connect } from 'react-redux';
import { getAccessToken } from 'utils/user';
import { bindActionCreators } from 'redux';
import { update_access_token } from 'actions/UserActions';
import { update_item_price } from 'actions/MarketActions';

var fetch = require('fetch-retry');

class Manufacturing extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      constIndices: {},
      typeValues: {},
      blueprintTypes: manufacturingConstants.blueprintTypes,
      blueprints: [],
      selectedBlueprintTypeIndex: 0,
      selectedBlueprint: {
        typeID: null,
        rawBuildTime: 0,
        productTypeID: null,
        quantity: 0,
        maxProductionLimit: 0
      },
      blueprintBuildMaterials: [],
      regionID: '10000002',
      runs: 0,
      materialEfficiency: 0,
      timeEfficiency: 0,
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
    if(this.state.costIndices !== undefined){
      return calculateJobGrossCost(this.state.selectedBlueprint.typeID, this.state.costIndices, this.state.typeValues, this.state.blueprintBuildMaterials, this.state.runs, this.props.universe.selectedBuildLocation.selectedSystem, 'manufacturing');
    }
    //FIXME: temporary solution to prevent crash if user selects blueprint before this.state.costIndices can fill
    //not a big enough deal for me to care about compared to other things, but definitely not an acceptable solution.
    //maybe it doesn't even matter since when costindices updates it will rerender anyway?
    return 0;
  }

  getJobInstallTax = () => {
    let jobGrossCost = this.getJobGrossCost();
    //FIXME: get actual station tax
    //stations no longer of settable taxes
    //return .1 for station, check for citadel and fetch/return proper tax
    let tax = 0.1;
    return jobGrossCost * tax;
  }

  getProductPrice = async() => {
    let regionID = this.props.universe.selectedSellLocation.selectedRegion
    let systemID = this.props.universe.selectedSellLocation.selectedSystem
    let structureID = this.props.universe.selectedSellLocation.selectedStructure
    let structureTypeID = this.props.universe[regionID].systems[systemID].structures[structureID].typeID
    let accessToken = await getAccessToken(this.props.user, this.props.update_access_token);
    getMinSellValue(this.props.market, regionID, systemID, structureID, structureTypeID, this.state.selectedBlueprint.productTypeID, accessToken, this.props.update_item_price)
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
          response.json().then(blueprintBuildMaterials => {
            this.getMaterialSellValues(blueprintBuildMaterials);
            for(let i = 0; i < blueprintBuildMaterials.length; i++){
              if(blueprintBuildMaterials[i].componentMaterials !== undefined){
                this.getMaterialSellValues(blueprintBuildMaterials[i].componentMaterials);
              }
            }
            this.setState({
              blueprintBuildMaterials: blueprintBuildMaterials,
            })

          })
        }
      });
    }
  }

  //FIXME: refactor material quantity after me functions together.
  getComponentMaterialQuantityAfterME = (quantity, runs, materialEfficiency) => {
    if(quantity === 1){
      return quantity * runs
    } else {
      return Math.ceil(quantity * runs * (1 - materialEfficiency / 100));
    }
  }

  getMaterialQuantityAfterME = (materialIndex) => {
    let quantity = this.state.blueprintBuildMaterials[materialIndex].quantity;
    if(quantity === 1){
      return quantity * this.state.runs
    } else {
      return Math.ceil((quantity) * this.state.runs * (1 - this.state.materialEfficiency / 100));
    }
  }

  getTotalMaterialVolume = () => {
    let totalVolume = 0;
    for (let i = 0; i < this.state.blueprintBuildMaterials.length; i++){
      if(!this.state.blueprintBuildMaterials[i].buildComponent){
        totalVolume += (this.getMaterialQuantityAfterME(i) * this.state.blueprintBuildMaterials[i].volume);
      } else {
        for(let j = 0; j < this.state.blueprintBuildMaterials[i].componentMaterials.length; j++){
          totalVolume += this.state.blueprintBuildMaterials[i].componentMaterials[j].volume * this.getComponentMaterialQuantityAfterME(this.state.blueprintBuildMaterials[i].componentMaterials[j].quantity, this.state.blueprintBuildMaterials[i].runs, this.state.blueprintBuildMaterials[i].materialEfficiency)
        }
      }
    }
    return totalVolume
  }

  getTotalMaterialCost = () => {
    let totalCost = 0;
    let selectedStructure = this.props.universe.selectedBuyLocation.selectedStructure;
    for (var i = 0; i < this.state.blueprintBuildMaterials.length; i++){
      if(!this.state.blueprintBuildMaterials[i].buildComponent){
        let materialTypeID = this.state.blueprintBuildMaterials[i].materialTypeID;
        if(this.props.market[selectedStructure] !== undefined && this.props.market[selectedStructure][materialTypeID] !== undefined){
          totalCost += (this.getMaterialQuantityAfterME(i) * this.props.market[selectedStructure][materialTypeID]);
        } else {
          return "N/A"
        }
      } else {
        for(let j = 0; j < this.state.blueprintBuildMaterials[i].componentMaterials.length; j++){
          let materialTypeID = this.state.blueprintBuildMaterials[i].componentMaterials[j].materialTypeID;
          if(this.props.market[selectedStructure] !== undefined && this.props.market[selectedStructure][materialTypeID] !== undefined){
            totalCost += this.props.market[selectedStructure][materialTypeID] * this.getComponentMaterialQuantityAfterME(this.state.blueprintBuildMaterials[i].componentMaterials[j].quantity, this.state.blueprintBuildMaterials[i].runs, this.state.blueprintBuildMaterials[i].materialEfficiency);
          } else {
            return "N/A"
          }
        }
      }
    }
    return totalCost
  }

  getTotalBuildTime = () => {
    let totalBuildTime = this.state.selectedBlueprint.rawBuildTime * this.state.runs * (1 - (this.state.timeEfficiency / 100));
    for (let i = 0; i < this.state.blueprintBuildMaterials.length; i++){
      if(this.state.blueprintBuildMaterials[i].buildComponent){
        totalBuildTime += this.state.blueprintBuildMaterials[i].componentDetails.rawBuildTime * this.state.blueprintBuildMaterials[i].runs * (1 - (this.state.blueprintBuildMaterials[i].timeEfficiency / 100));
      }
    }
    return totalBuildTime
  }

  getMaterialSellValues = async(blueprintBuildMaterials) => {
    for (let i = 0; i < blueprintBuildMaterials.length; i++) {
      let regionID = this.props.universe.selectedBuyLocation.selectedRegion
      let systemID = this.props.universe.selectedBuyLocation.selectedSystem
      let structureID = this.props.universe.selectedBuyLocation.selectedStructure
      let structureTypeID = this.props.universe[regionID].systems[systemID].structures[structureID].typeID
      let accessToken = await getAccessToken(this.props.user, this.props.update_access_token);
      let promise = getMinSellValue(this.props.market, regionID, systemID, structureID, structureTypeID, blueprintBuildMaterials[i].materialTypeID, accessToken, this.props.update_item_price)
    }

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

  handleLocationChange = () => {
    if(this.state.selectedBlueprint.typeID){
       this.getProductPrice();
       this.getMaterialSellValues(this.state.blueprintBuildMaterials);
     }
  }

  onComponentInputChange = (blueprintBuildMaterialsIndex, e) => {
    let blueprintBuildMaterials = this.state.blueprintBuildMaterials.slice();
    let radix = 10;
    if (parseInt(e.target.value, radix) > parseInt(e.target.max, radix)) {
      e.target.value = e.target.max;
    } else if (parseInt(e.target.value, radix) < parseInt(e.target.min, radix)) {
      e.target.value = e.target.min;
    }
    blueprintBuildMaterials[blueprintBuildMaterialsIndex][e.target.name] = e.target.value;
    this.setState({
      blueprintBuildMaterials: blueprintBuildMaterials
    })
  }

  setComponentRuns = (blueprintBuildMaterialsIndex, runs) => {
    let blueprintBuildMaterials = this.state.blueprintBuildMaterials.slice();
    blueprintBuildMaterials[blueprintBuildMaterialsIndex].runs = runs;
    this.setState({
      blueprintBuildMaterials: blueprintBuildMaterials
    })
  }

  toggleBuildComponent = (blueprintBuildMaterialsIndex) => {
    let blueprintBuildMaterials = this.state.blueprintBuildMaterials.slice();
    blueprintBuildMaterials[blueprintBuildMaterialsIndex].buildComponent = !blueprintBuildMaterials[blueprintBuildMaterialsIndex].buildComponent;
    this.setState({
      blueprintBuildMaterials: blueprintBuildMaterials
    })
  }

  render() {
    return (
      <div className="manufacturing-layout">
        <Grid>
          <Grid.Row>
            <Grid.Column floated='right'>
              <LoginControl />
            </Grid.Column>
          </Grid.Row>
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
                productSellPrice={getPriceFromReduxStore(this.props.market, this.props.universe.selectedSellLocation.selectedStructure, this.state.selectedBlueprint.productTypeID)}
                runs={this.state.runs}
                quantityProduced={this.state.selectedBlueprint.quantity}
                totalMaterialCost={this.getTotalMaterialCost()}
                rawBuildTime={this.state.selectedBlueprint.rawBuildTime}
                totalBuildTime={this.getTotalBuildTime()}
                materialEfficiency={this.state.materialEfficiency}
                timeEfficiency={this.state.timeEfficiency}
                jobGrossCost={this.getJobGrossCost()}
                getJobInstallTax={this.getJobInstallTax}
              />
            </Grid.Column>

          </Grid.Row>
          <Grid.Row>
            Buy:
            <LocationSelection
              locationType="selectedBuyLocation"
              triggerParentUpdate={this.handleLocationChange}
            />
          </Grid.Row>
          <Grid.Row>
            Sell:
            <LocationSelection
              locationType="selectedSellLocation"
              triggerParentUpdate={this.handleLocationChange}
            />
          </Grid.Row>
          <Grid.Row>
            Build:
            <LocationSelection
              locationType="selectedBuildLocation"
              triggerParentUpdate={this.handleLocationChange}
            />
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <MaterialsTable
                getComponentMaterialQuantityAfterME={this.getComponentMaterialQuantityAfterME}
                getMaterialQuantityAfterME={this.getMaterialQuantityAfterME}
                blueprintBuildMaterials={this.state.blueprintBuildMaterials}
                runs={this.state.runs}
                market={this.props.market}
                selectedStructure={this.props.universe.selectedBuyLocation.selectedStructure}
                onComponentInputChange={this.onComponentInputChange}
                setComponentRuns={this.setComponentRuns}
                toggleBuildComponent={this.toggleBuildComponent}
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

const mapStateToProps = state => {
  return {
    user: state.userReducer,
    universe: state.universeReducer,
    market: state.marketReducer
  }
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators({
    update_access_token,
    update_item_price
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Manufacturing);
