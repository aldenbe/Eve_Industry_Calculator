import React, { Component } from 'react';
import { Container, Dropdown, Grid, Form, Checkbox, Input, Table } from 'semantic-ui-react';
import { API_ROOT, ICON_ROOT } from 'APIConfig';
import LocationSelection from 'components/LocationSelection';
import BlueprintSelection from 'components/production/BlueprintSelection';
import manufacturingConstants from 'constants/ManufacturingConstants.json';
import universe from 'constants/Universe.json';
import { MaterialsTable, Totals } from 'components/production/MaterialsTable';
import { getMinSellValue, getCostIndices, getTypeValues, calculateJobGrossCost, getPriceFromReduxStore } from 'utils/production';
import { formatNumbersWithCommas, formatTime } from 'utils/general';
import OutputInformation from 'components/production/OutputInformation';
import LoginControl from 'components/character/LoginControl';
import { connect } from 'react-redux';
import { getAccessToken } from 'utils/user';
import { bindActionCreators } from 'redux';
import { update_access_token } from 'actions/UserActions';
import { update_item_price } from 'actions/MarketActions';


class Reactions extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      costIndices: {},
      typeValues: {},
      universe: universe,
      productSellPrice: 0,
      reactionTypes: manufacturingConstants.reactionTypes,
      reactions: [],
      selectidReactionTypeIndex: 0,
      selectedReaction: {
        typeID: null,
        rawProductionTime: 0,
        productTypeID: null,
        quantity: 0
      },
      reactionBuildMaterials: [],
      runs: 1,
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
    let selectedStructure = this.props.universe.selectedBuyLocation.selectedStructure;
    for (var i = 0; i < this.state.reactionBuildMaterials.length; i++){
      let materialTypeID = this.state.reactionBuildMaterials[i].materialTypeID;
      totalCost += (this.state.reactionBuildMaterials[i].quantity * this.state.runs * this.props.market[selectedStructure][materialTypeID]);
    }
    return totalCost
  }

  getTotalBuildTime = () => {
    let totalBuildTime = this.state.selectedReaction.rawProductionTime * this.state.runs;
    return totalBuildTime
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
            }, this.getProductPrice)

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
    return calculateJobGrossCost(this.state.selectedReaction.typeID, this.state.costIndices, this.state.typeValues, this.state.reactionBuildMaterials, this.state.runs, this.props.universe.selectedBuildLocation.selectedSystem, 'reaction')
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
    getMinSellValue(this.props.market, regionID, systemID, structureID, structureTypeID, this.state.selectedReaction.productTypeID, accessToken, this.props.update_item_price).then(minSellPrice => {
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

  getMaterialSellValues = async(reactionBuildMaterials) => {
    let materialValuePromises = [];
    for (let i = 0; i < reactionBuildMaterials.length; i++) {

      let regionID = this.props.universe.selectedBuyLocation.selectedRegion
      let systemID = this.props.universe.selectedBuyLocation.selectedSystem
      let structureID = this.props.universe.selectedBuyLocation.selectedStructure
      let structureTypeID = this.props.universe[regionID].systems[systemID].structures[structureID].typeID
      let accessToken = await getAccessToken(this.props.user, this.props.update_access_token);
      let promise = getMinSellValue(this.props.market, regionID, systemID, structureID, structureTypeID, reactionBuildMaterials[i].materialTypeID, accessToken, this.props.update_item_price).then((minPrice) => {
        reactionBuildMaterials[i].costPerItem = minPrice;
      });
      materialValuePromises.push(promise);
    }
    //after all prices are fetched update state
    Promise.all(materialValuePromises).then((values) => {
      this.setState({
        reactionBuildMaterials: reactionBuildMaterials,
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

  handleLocationChange = () => {
    if(this.state.selectedReaction.typeID){
       this.getProductPrice();
       this.getMaterialSellValues(this.state.reactionBuildMaterials);
     }
  }

  render () {
    return (
      <div className='reactions-layout'>
        <Grid>
          <Grid.Row>
            <Grid.Column floated='right'>
              <LoginControl />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row> {/*First component row*/}
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
                        <Grid.Column>
                          <label htmlFor='runsInput'>Runs: </label>
                          <Input
                          style={{width:'70%'}}
                          id="runsInput"
                          min="1"
                          name="runs"
                          value={this.state.runs}
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
                productSellPrice={getPriceFromReduxStore(this.props.market, this.props.universe.selectedSellLocation.selectedStructure, this.state.selectedReaction.productTypeID)}
                runs={this.state.runs}
                quantityProduced={this.state.selectedReaction.quantity}
                totalMaterialCost={this.getTotalMaterialCost()}
                rawBuildTime={this.state.selectedReaction.rawProductionTime}
                totalBuildTime={this.getTotalBuildTime()}
                materialEfficiency={0}
                timeEfficiency={0}
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
                getMaterialQuantityAfterME={this.getMaterialQuantityAfterME}
                blueprintBuildMaterials={this.state.reactionBuildMaterials}
                runs={this.state.runs}
                market={this.props.market}
                selectedStructure={this.props.universe.selectedBuyLocation.selectedStructure}
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

export default connect(mapStateToProps, mapDispatchToProps)(Reactions);
