import React from 'react';
import { Grid, Table, Input } from 'semantic-ui-react';
import { formatNumbersWithCommas } from 'utils/general';

export const MaterialsTable = (props) => {

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
        {props.blueprintBuildMaterials.map((material, index) => (
          <Table.Row key={index}>
            <Table.Cell key={index}>{material.typeName}</Table.Cell>
            <Table.Cell key={index}>{formatNumbersWithCommas(props.getMaterialQuantityAfterME(index))}</Table.Cell>
            <Table.Cell key={index}>{formatNumbersWithCommas(parseFloat(material.volume).toFixed(2))}</Table.Cell>
            <Table.Cell key={index}>{formatNumbersWithCommas((material.volume * props.runs * props.getMaterialQuantityAfterME(index)).toFixed(2))}</Table.Cell>
            <Table.Cell key={index}>{formatNumbersWithCommas(parseFloat(material.costPerItem).toFixed(2))}</Table.Cell>
            <Table.Cell key={index}>{formatNumbersWithCommas((material.costPerItem * props.runs * props.getMaterialQuantityAfterME(index)).toFixed(2))}</Table.Cell>

          </Table.Row>
        ))}
      </Table.Body>

    </Table>
  )

}

export const Totals = (props) => {
  return(
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
          value={formatNumbersWithCommas((props.totalMaterialCost).toFixed(2))}
        />
      </Grid.Column>
    </Grid.Row>
  )
}
