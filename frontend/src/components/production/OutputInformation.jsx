import React from 'react';
import { Grid, Input } from 'semantic-ui-react';
import { formatNumbersWithCommas, formatTime } from 'utils/general';

const OutputInformation = (props) => {
  let runs = props.runs;
  let quantityProduced = props.quantityProduced;
  let productSellPrice = props.productSellPrice;
  let jobInstallTax = props.getJobInstallTax();
  let totalProfit = ( (runs * quantityProduced * productSellPrice ) - props.totalMaterialCost) - (props.jobGrossCost + jobInstallTax);

  let rawBuildTime = formatTime(props.rawBuildTime * (1 - (props.timeEfficiency / 100)));


  let iskPerHour = totalProfit / (props.totalBuildTime / 3600);

  const formatOutput = (output, displayTrailingDigits) => {
    if(!isNaN(parseFloat(output)) && isFinite(output)){
      if(displayTrailingDigits){
        output = output.toFixed(2);
      }
      return formatNumbersWithCommas(output)
    }
    else {
      return output
    }

  }
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
              value={formatTime(props.totalBuildTime)}
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
              value={formatOutput(props.productSellPrice, true)}
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
              value={formatOutput(props.quantityProduced * props.runs, false)}
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
              value={formatOutput(props.jobGrossCost, true)}
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
              value={formatOutput(props.getJobInstallTax(), true)}
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
              value={formatOutput(totalProfit, true)}
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
              value={formatOutput(iskPerHour, true)}
              style={{width:'100%'}}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Grid.Column>
  )
}

export default OutputInformation
