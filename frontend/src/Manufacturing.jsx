import React from 'react';
import { Container, Dropdown, Grid, Form, Checkbox, Input, Table } from 'semantic-ui-react';
import './Manufacturing.css';
import manufacturingConstants from './constants/ManufacturingConstants.json';
import { API_ROOT, ICON_ROOT } from './api-config';
var fetch = require('fetch-retry');

var getMinSellValue = require('./utils.js').getMinSellValue;
var formatNumbersWithCommas = require('./utils.js').formatNumbersWithCommas;
var formatTime = require('./utils.js').formatTime;
class Manufacturing extends React.Component {
  constructor(props){
    super(props);
    this.state = {
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
    }
    this.getBlueprints();
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
            })
            getMinSellValue(this.state.regionID, blueprintResponse.productTypeID).then(minSellPrice => {
              this.setState({
                productSellPrice: minSellPrice
              })
            })

          })
        }
      });
    }
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
      return quantity
    } else {
      quantity = Math.ceil((quantity) * (1 - this.state.materialEfficiency / 100));
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
    var promises = [];
    for (let i = 0; i < blueprintBuildMaterials.length; i++) {

      var promise = getMinSellValue(this.state.regionID, blueprintBuildMaterials[i].materialTypeID).then((minPrice) => {
        blueprintBuildMaterials[i].costPerItem = minPrice;
      });


      promises.push(promise);
    }
    //after all prices are fetched update state
    Promise.all(promises).then((values) => {

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

  render() {
    return (
      <div className="manufacturing-layout">
        <Grid>
          <Grid.Row> {/*First component row*/}
            <BlueprintSelection
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
                          <label for='runsInput'>Runs: </label>
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
                          <label for="meInput">ME: </label>
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
                          <label for="teInput">TE: </label>
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
              />
            </Grid.Column>

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
          <Grid.Row columns='equal'>
            <Grid.Column>
              <label htmlFor="totalVolumeInput">Total Material Volume: </label>
              <Input
                id="totalVolumeInput"
                disabled
                value={formatNumbersWithCommas((this.getTotalMaterialVolume() * this.props.runs).toFixed(2))}
              />

            </Grid.Column>
            <Grid.Column>
              <label htmlFor="totalCostInput">Total Material Cost: </label>
              <Input
                id="totalCostInput"
                disabled
                value={formatNumbersWithCommas((this.getTotalMaterialCost() * this.props.runs).toFixed(2))}
              />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    )
  }
}
export default Manufacturing

class BlueprintSelection extends React.Component {
  render (){
    return (
      <Grid.Column width={6}>
        <Grid.Row>
          <Grid.Column>
            <Dropdown placeholder="Select Blueprint"
              fluid
              search
              selection
              options={this.props.blueprints}
              onChange={this.props.handleBlueprintSelection}
              />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Form>
              {/*Map blueprint selection options to form fields*/}
              {this.props.blueprintTypes.map((blueprintType, index) => (

                <Form.Field key={index}>
                  <Checkbox
                    radio
                    label={blueprintType.label}
                    value={index}
                    key={index}
                    checked={this.props.selectedBlueprintTypeIndex === index}
                    onChange={this.props.handleBlueprintTypeSelectionChange}
                    className="small-checkbox"
                  />
                </Form.Field>

              ))}
            </Form>
          </Grid.Column>
        </Grid.Row>
      </Grid.Column>
    )
  }
}

class OutputInformation extends React.Component {
  render() {
    return (
      <Grid.Column width={4}>
        <Grid columns='equal'>
          <Grid.Row>
            <Grid.Column>
              <p>Time per run: </p>
            </Grid.Column>
            <Grid.Column>
              <Input
                disabled
                value={formatTime(this.props.rawBuildTime * (1 - (this.props.timeEfficiency / 50)))}
                style={{width:'100%'}}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
            <p>Total build time: </p>
            </Grid.Column>
            <Grid.Column>
              <Input
                disabled
                value={formatTime((this.props.rawBuildTime * this.props.runs) * (1 - (this.props.timeEfficiency / 50)))}
                style={{width:'100%'}}
              />
            </Grid.Column>


          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <p>Sell Price: </p>
            </Grid.Column>
            <Grid.Column>
              <Input
                disabled
                value={formatNumbersWithCommas((this.props.productSellPrice).toFixed(2))}
                style={{width:'100%'}}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <p>Produced: </p>
            </Grid.Column>
            <Grid.Column>
              <Input
                disabled
                value={formatNumbersWithCommas(this.props.quantityProduced * this.props.runs)}
                style={{width:'100%'}}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <p>Total Profit: </p>
            </Grid.Column>
            <Grid.Column>
              <Input
                disabled
                value={formatNumbersWithCommas((this.props.runs * ((this.props.quantityProduced * this.props.productSellPrice) - this.props.getTotalMaterialCost())).toFixed(2))}
                style={{width:'100%'}}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <p>Isk Per Hour: </p>
            </Grid.Column>
            <Grid.Column>
              <Input
                disabled
                value={formatNumbersWithCommas((((this.props.quantityProduced * this.props.productSellPrice) - this.props.getTotalMaterialCost()) / (this.props.rawBuildTime / 3600)).toFixed(2))}
                style={{width:'100%'}}
              />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Grid.Column>
    )
  }
}
class MaterialsTable extends React.Component {
  render() {
    return(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Material</Table.HeaderCell>
            <Table.HeaderCell>Quantity</Table.HeaderCell>
            <Table.HeaderCell>Volume</Table.HeaderCell>
            <Table.HeaderCell>Total Volume</Table.HeaderCell>
            <Table.HeaderCell>Cost</Table.HeaderCell>
            <Table.HeaderCell>Total Cost</Table.HeaderCell>

          </Table.Row>
        </Table.Header>
        <Table.Body>
          {this.props.blueprintBuildMaterials.map((material, index) => (
            <Table.Row key={index}>
              <Table.Cell key={index}>{material.typeName}</Table.Cell>
              <Table.Cell key={index}>{formatNumbersWithCommas(this.props.getMaterialQuantityAfterME(index))}</Table.Cell>
              <Table.Cell key={index}>{formatNumbersWithCommas(parseFloat(material.volume).toFixed(2))}</Table.Cell>
              <Table.Cell key={index}>{formatNumbersWithCommas((material.volume * this.props.runs * this.props.getMaterialQuantityAfterME(index)).toFixed(2))}</Table.Cell>
              <Table.Cell key={index}>{formatNumbersWithCommas(parseFloat(material.costPerItem).toFixed(2))}</Table.Cell>
              <Table.Cell key={index}>{formatNumbersWithCommas((material.costPerItem * this.props.runs * this.props.getMaterialQuantityAfterME(index)).toFixed(2))}</Table.Cell>

            </Table.Row>
          ))}
        </Table.Body>

      </Table>
    )
  }
}
