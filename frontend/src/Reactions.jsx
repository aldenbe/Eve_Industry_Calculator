import React, { Component } from 'react';
import { Container, Dropdown, Grid, Form, Checkbox, Input, Table } from 'semantic-ui-react';
import { API_ROOT, ICON_ROOT } from './api-config';

var getMinSellValue = require('./utils.js').getMinSellValue;
var formatNumbersWithCommas = require('./utils.js').formatNumbersWithCommas;
var formatTime = require('./utils.js').formatTime;

class Reactions extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      productSellPrice: 0,
      reactions: [],
      selectedReaction: {
        typeID: null,
        rawProductionTime: 0,
        productTypeID: null,
        quantity: 0
      },
      selectedReactionTypeIndex: 0,
      reactionBuildMaterials: [],
      regionID: '10000002',
      runs: 1,
      totalMaterialCost: 0,
      totalMaterialVolume: 0,
    }
    this.getReactions();
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
  handleReactionSelection = (e, {value}) => {
    if(this.state.selectedReaction.typeID !== value){
      this.getReactionDetails(value);
      this.getReactionMaterials(value);
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
            console.log(reactionResponse);
            this.setState({
              selectedReaction: reactionResponse,
            })
            getMinSellValue(this.state.regionID, reactionResponse.productTypeID).then(minSellPrice => {
              this.setState({
                productSellPrice: minSellPrice
              })
            })

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
  getMaterialSellValues = (reactionBuildMaterials) => {
    var promises = [];
    for (let i = 0; i < reactionBuildMaterials.length; i++) {

      var promise = getMinSellValue(this.state.regionID, reactionBuildMaterials[i].materialTypeID).then((minPrice) => {
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
        totalMaterialVolume: totalVolume,
        totalMaterialCost: totalCost
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

  render () {
    return (
      <div className='reactions-layout'>
        <Grid>
          <Grid.Row>
            <ReactionSelection
                reactions = {this.state.reactions}
                handleReactionSelection = {this.handleReactionSelection}
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
                totalMaterialCost={this.state.totalMaterialCost}
                rawProductionTime={this.state.selectedReaction.rawProductionTime}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>

            <Grid.Column>
              <MaterialsTable
                reactionBuildMaterials={this.state.reactionBuildMaterials}
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
                value={formatNumbersWithCommas((this.state.totalMaterialVolume * this.state.runs).toFixed(2))}
              />

            </Grid.Column>
            <Grid.Column>
              <label htmlFor="totalCostInput">Total Material Cost: </label>
              <Input
                id="totalCostInput"
                disabled
                value={formatNumbersWithCommas((this.state.totalMaterialCost * this.state.runs).toFixed(2))}
              />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    )
  }
}

export default Reactions;

class ReactionSelection extends React.Component {
  render (){
    return (
      <Grid.Column width={6}>
        <Grid.Row>
          <Grid.Column>
            <Dropdown placeholder="Select Reaction"
              fluid
              search
              selection
              options={this.props.reactions}
              onChange={this.props.handleReactionSelection}
              />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>

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
                value={formatTime(this.props.rawProductionTime)}
                style={{width:'100%'}}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
            <p>Total production time: </p>
            </Grid.Column>
            <Grid.Column>
              <Input
                disabled
                value={formatTime(this.props.rawProductionTime * this.props.runs)}
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
                value={formatNumbersWithCommas((this.props.runs * ((this.props.quantityProduced * this.props.productSellPrice) - this.props.totalMaterialCost)).toFixed(2))}
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
                value={formatNumbersWithCommas((((this.props.quantityProduced * this.props.productSellPrice) - this.props.totalMaterialCost) / (this.props.rawProductionTime / 3600)).toFixed(2))}
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
          {this.props.reactionBuildMaterials.map((material, index) => (
            <Table.Row key={index}>
              <Table.Cell key={index}>{material.typeName}</Table.Cell>
              <Table.Cell key={index}>{formatNumbersWithCommas(material.quantity * this.props.runs)}</Table.Cell>
              <Table.Cell key={index}>{formatNumbersWithCommas(parseFloat(material.volume).toFixed(2))}</Table.Cell>
              <Table.Cell key={index}>{formatNumbersWithCommas((material.volume * material.quantity * this.props.runs).toFixed(2))}</Table.Cell>
              <Table.Cell key={index}>{formatNumbersWithCommas(parseFloat(material.costPerItem).toFixed(2))}</Table.Cell>
              <Table.Cell key={index}>{formatNumbersWithCommas((material.costPerItem * material.quantity * this.props.runs).toFixed(2))}</Table.Cell>

            </Table.Row>
          ))}
        </Table.Body>

      </Table>
    )
  }
}
