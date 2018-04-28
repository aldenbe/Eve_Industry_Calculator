import React from 'react';
import { Grid, Input } from 'semantic-ui-react';
import { formatNumbersWithCommas, formatTime } from 'utils/general';

const OutputInformation = (props) => {
  let totalMaterialCost = props.getTotalMaterialCost();
  let jobGrossCost = props.getJobGrossCost();
  let runs = props.runs;
  let quantityProduced = props.quantityProduced;
  let productSellPrice = props.productSellPrice;
  let jobInstallTax = props.getJobInstallTax();
  let totalProfit = ( (runs * quantityProduced * productSellPrice ) - totalMaterialCost) - (jobGrossCost + jobInstallTax);
  
  let rawBuildTime = formatTime(props.rawBuildTime * (1 - (props.timeEfficiency / 50)));

  let totalBuildTime = formatTime((props.rawBuildTime * props.runs) * (1 - (props.timeEfficiency / 50)));


  let iskPerHour = totalProfit / (props.runs * (props.rawBuildTime / 3600));

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
              value={rawBuildTime}
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
              value={totalBuildTime}
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
              value={formatNumbersWithCommas((props.productSellPrice).toFixed(2))}
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
              value={formatNumbersWithCommas(props.quantityProduced * props.runs)}
              style={{width:'100%'}}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <p>Job gross cost: </p>
          </Grid.Column>
          <Grid.Column>
            <Input
              disabled
              value={formatNumbersWithCommas(props.getJobGrossCost().toFixed(2))}
              style={{width:'100%'}}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <p>Job install tax: </p>
          </Grid.Column>
          <Grid.Column>
            <Input
              disabled
              value={formatNumbersWithCommas(props.getJobInstallTax().toFixed(2))}
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
              value={formatNumbersWithCommas(totalProfit.toFixed(2))}
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
              value={formatNumbersWithCommas(iskPerHour.toFixed(2))}
              style={{width:'100%'}}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Grid.Column>
  )
}

export default OutputInformation
