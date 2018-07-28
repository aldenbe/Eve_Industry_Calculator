import React from 'react';
import { Grid, Table, Input, Checkbox } from 'semantic-ui-react';
import ReactTable from 'react-table';
import "react-table/react-table.css";
import { formatNumbersWithCommas } from 'utils/general';


export const MaterialsTable = (props) => {
  if(props.blueprintBuildMaterials.length === 0){
    return (<div></div>)
  }

  const columns = [
    {
      Header: "Material",
      accessor: "typeName",
      headerStyle: {
        "textAlign": "left"
      }
    },
    {
      Header: "Quantity",
      Cell: row => (formatNumbersWithCommas(props.getMaterialQuantityAfterME(row.index))),
      headerStyle: {
        "textAlign": "left"
      }
    },
    {
      Header: "Volume",
      Cell: row => (formatNumbersWithCommas(parseFloat(row.original.volume).toFixed(2))),
      headerStyle: {
        "textAlign": "left"
      }
    },
    {
      Header: "Total Volume",
      Cell: row => (formatNumbersWithCommas((row.original.volume * props.getMaterialQuantityAfterME(row.index)).toFixed(2))),
      headerStyle: {
        "textAlign": "left"
      }
    },
    {
      Header: "Cost",
      Cell: row => {
        if(props.market[props.selectedStructure] !== undefined && props.market[props.selectedStructure][row.original.materialTypeID] !== undefined){
          return (formatNumbersWithCommas(parseFloat(props.market[props.selectedStructure][row.original.materialTypeID]).toFixed(2)))
        } else {
          return 'N/A'
        }

      },
      headerStyle: {
        "textAlign": "left"
      }
    },
    {
      Header: "Total Cost",
      Cell: row => {
        if(props.market[props.selectedStructure] !== undefined && props.market[props.selectedStructure][row.original.materialTypeID] !== undefined){
          return (formatNumbersWithCommas((props.market[props.selectedStructure][row.original.materialTypeID] * props.getMaterialQuantityAfterME(row.index)).toFixed(2)))
        } else {
          return 'N/A'
        }
      },
      headerStyle: {
        "textAlign": "left"
      }
    }
  ]

  const subComponentColumns = [
    {
      Header: "Material",
      accessor: "typeName",
      headerStyle: {
        "textAlign": "left"
      }
    },
    {
      Header: "Quantity",
      accessor: "quantityAfterME",
      headerStyle: {
        "textAlign": "left"
      }
    },
    {
      Header: "Volume",
      accessor: "volume",
      headerStyle: {
        "textAlign": "left"
      }
    },
    {
      Header: "Total Volume",
      Cell: row => (formatNumbersWithCommas((row.original.quantityAfterME * row.original.volume).toFixed(2))),
      headerStyle: {
        "textAlign": "left"
      }
    },
    {
      Header: "Cost",
      Cell: row => {
        if(props.market[props.selectedStructure] !== undefined && props.market[props.selectedStructure][row.original.materialTypeID] !== undefined){
          return (formatNumbersWithCommas(parseFloat(props.market[props.selectedStructure][row.original.materialTypeID]).toFixed(2)));
        } else {
          return 'N/A'
        }
      },
      headerStyle: {
        "textAlign": "left"
      }
    },
    {
      Header: "Total Cost",
      Cell: row => {
        if(props.market[props.selectedStructure] !== undefined && props.market[props.selectedStructure][row.original.materialTypeID] !== undefined){
          return (formatNumbersWithCommas((props.market[props.selectedStructure][row.original.materialTypeID] * row.original.quantityAfterME).toFixed(2)));
        } else {
          return 'N/A'
        }
      },
      headerStyle: {
        "textAlign": "left"
      }
    }
  ]

  const subComponentTable = (row) => {
    if(row.original.hasOwnProperty('componentDetails')){
      var componentRunsID = "componentRunsInput" + row.index;
      var componentMEID = "componentMEInput" + row.index;
      var componentTEID = "componentTEInput" + row.index;
      if(!props.blueprintBuildMaterials[row.index].hasOwnProperty('runs')){
        //FIXME: react doesn't like setcomponentruns here and gives a warning (Cannot update during an existing state transition (such as within `render` or another component's constructor). Render methods should be a pure function of props and state; constructor side-effects are an anti-pattern, but can be moved to `componentWillMount`.).
        //I do like it here, and it works exactly the way I want it.

        props.setComponentRuns(row.index, Math.ceil(props.getMaterialQuantityAfterME(row.index) / props.blueprintBuildMaterials[row.index].componentDetails.quantity));
      }

      let componentMaterials = row.original.componentMaterials.slice();
      let totalMaterialCost = 0;
      let totalMaterialVolume = 0;
      for (let i = 0; i < componentMaterials.length; i++){
        componentMaterials[i].quantityAfterME = props.getComponentMaterialQuantityAfterME(componentMaterials[i].quantity, row.original.runs, row.original.materialEfficiency)
        totalMaterialVolume += componentMaterials[i].quantityAfterME * componentMaterials[i].volume;
        if(props.market[props.selectedStructure] !== undefined && props.market[props.selectedStructure][row.original.materialTypeID] !== undefined && totalMaterialCost !== 'N/A'){
          totalMaterialCost += componentMaterials[i].quantityAfterME * props.market[props.selectedStructure][componentMaterials[i].materialTypeID];
        } else {
          totalMaterialCost = 'N/A';
        }
      }

      return (
        <div>
          <Grid>
            <Grid.Row columns='equal'>
              <Grid.Column>
                <label htmlFor={componentRunsID}>Runs: </label>
                <Input
                style={{width:'70%'}}
                id={componentRunsID}
                min="1"
                max="100000"
                name="runs"
                onChange={props.onComponentInputChange.bind(this, row.index)}
                value={props.blueprintBuildMaterials[row.index].runs}
                />
              </Grid.Column>
              <Grid.Column>
                <label htmlFor={componentMEID}>ME: </label>
                  <Input
                  style={{width:'40px'}}
                  id={componentMEID}
                  min="0"
                  name="materialEfficiency"
                  max="10"
                  onChange={props.onComponentInputChange.bind(this, row.index)}
                  value={props.blueprintBuildMaterials[row.index].materialEfficiency}
                  />
              </Grid.Column>
              <Grid.Column>
                <label htmlFor={componentTEID}>TE: </label>
                  <Input
                    style={{width:'40px'}}
                  id={componentTEID}
                  min="0"
                  name="timeEfficiency"
                  max="10"
                  onChange={props.onComponentInputChange.bind(this, row.index)}
                  value={props.blueprintBuildMaterials[row.index].timeEfficiency}
                  />
              </Grid.Column>
              <Grid.Column>
                <Checkbox
                  toggle
                  label={<label>Build Component</label>}
                  checked={props.blueprintBuildMaterials[row.index].buildComponent}
                  onChange={props.toggleBuildComponent.bind(this, row.index)}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
          <ReactTable
            showPagination={false}
            columns={subComponentColumns}
            pageSize={row.original.componentMaterials.length}
            data={componentMaterials}
            sortable={false}
          />
        <Totals
          totalMaterialVolume={totalMaterialVolume}
          totalMaterialCost={totalMaterialCost}
        />
      </div>
      )
    } else {
      return(
        //this should never be visible
        <div><p>Error</p></div>
      )
    }

  }

  return(
    <div>
      {
      //FIXME: React table is nice and all, but it's going to end up looking pretty hacky and destroying a lot of optimizations to make it do what I want
      //might be better to just roll my own table here at some point.
      }
      <ReactTable
        showPagination={false}
        columns={columns}
        pageSize={props.blueprintBuildMaterials.length}
        data={props.blueprintBuildMaterials}
        sortable={false}
        SubComponent={subComponentTable}
        collapseOnDataChange={false}
        getTrProps={(state, rowInfo, column, instance) => {
          if (rowInfo === undefined || !rowInfo.original.hasOwnProperty('componentDetails')) {
              return {'data-qnt': 0}
          }

          return {
              //create html attribute containing number of component materials for css rules. Strictly speaking number doesn't matter
              //change number to true false attribute to clean up css?
              'data-qnt': rowInfo.original.componentMaterials.length,

              //make entire row clickable
              onClick: (e) => {
                const { expanded } = state;
                const path = rowInfo.nestingPath[0];
                const diff = { [path]: expanded[path] ? false : true };

                instance.setState({
                  expanded: {
                    ...expanded,
                    ...diff
                  }
                });
              }
          }
        }}
      />
    </div>
  )

}

export const Totals = (props) => {
  return(
    <Grid style={{width: '100%'}}>
      <Grid.Row columns='equal'>
        <Grid.Column>
          <label htmlFor="totalVolumeInput">Total Material Volume: </label>
          <Input
            id="totalVolumeInput"
            disabled
            value={formatNumbersWithCommas((props.totalMaterialVolume).toFixed(2))}
          />

        </Grid.Column>
        <Grid.Column>
          <label htmlFor="totalCostInput">Total Material Cost: </label>
          <Input
            id="totalCostInput"
            disabled
            value={(typeof(props.totalMaterialCost) === "number" ? formatNumbersWithCommas((props.totalMaterialCost).toFixed(2)) : props.totalMaterialCost)}
          />
        </Grid.Column>
      </Grid.Row>
    </Grid>
  )
}
