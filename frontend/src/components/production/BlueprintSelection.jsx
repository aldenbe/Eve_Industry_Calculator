import React from 'react';
import { Dropdown, Grid, Form, Checkbox } from 'semantic-ui-react';

const BlueprintSelection = (props) => {
  return (
    <Grid.Column width={6}>
      <Grid.Row>
        <Grid.Column>
          <Dropdown placeholder={props.placeholder}
            fluid
            search
            selection
            options={props.blueprints}
            onChange={props.handleBlueprintSelection}
            />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>
          <Form>
            {/*Map blueprint selection options to form fields*/}
            {props.blueprintTypes.map((blueprintType, index) => (

              <Form.Field key={index}>
                <Checkbox
                  radio
                  label={blueprintType.label}
                  value={index}
                  key={index}
                  checked={props.selectedBlueprintTypeIndex === index}
                  onChange={props.handleBlueprintTypeSelectionChange}
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

export default BlueprintSelection
