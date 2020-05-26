import React, {Component} from 'react';
import { Row, Col, Card, CardBody, CardHeader, Label, Input, Button, UncontrolledTooltip } from 'reactstrap';
import moment from 'moment';


class DeviceEntry extends Component {
  state = {
    alias: this.props.device.alias || '',
    color: this.props.device.color || '#ffffff',
    hasChanged: false,
  };
  constructor(props) {
    super(props);
    this.tooltipTarget = React.createRef();
  }

  render() {
    const {key, subscribed, latest, alias, color} = this.props.device;
    const {hasChanged, alias: newAlias, color: newColor} = this.state;
    const age = moment(new Date(latest.time)).fromNow();
    return (
      <Card >
        <CardHeader onClick={this.handleSubscribe}>
          <Row>
            <Col sm="8">{ alias || key }</Col>
            { subscribed && (
              <Col sm="4">
                <small style={{color:'green'}}>Subscribed</small>
              </Col>
            )}
          </Row>
        </CardHeader>

        <CardBody>

          <Card>
            <CardBody>
              <Row>
                <Col sm="6">
                  <Label style={{color}}>Color : </Label>
                </Col>
                <Col sm="6">
                  <Input type="color" name="color" onChange={this.handleColorChange} value={newColor} placeholde="pic a color"/>
                </Col>
              </Row>
              <Row>
                <Col sm="6">
                  <Label >Alias : </Label>
                </Col>
                <Col sm="6">
                  <Input type="text" name="alias" value={ newAlias } onChange={this.handleAliasChange}></Input>
                </Col>
              </Row>
              <Button disabled={!hasChanged} onClick={this.handleOptionsSave}>Save!</Button>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div ref={this.tooltipTarget}>
                { latest ?(
                  <div>
                    <Col>
                      <b style={{color:'blue'}}>{latest.model}</b>
                    </Col>
                    {
                      Object.entries(latest)
                        .filter( ([key]) => !['time', 'id', 'channel', 'mic', 'key', 'model'].includes(key))
                        .map(([key, value]) => (
                          <Col key={key}>
                            <span><b>{key}</b>: <i>{value}</i> </span>
                          </Col>
                        ))}
                  </div>
                ): <em> No Sample Data :( </em> }
              </div>
              <div>
                <small style={{color:'red'}}>last seen: {age}</small>
              </div>
            </CardBody>
            <UncontrolledTooltip placement="right-end" autohide={false} target={this.tooltipTarget}>
              <pre align="left">{JSON.stringify(this.props.device, null, 2)}</pre>
            </UncontrolledTooltip>
          </Card>

        </CardBody>
      </Card>
                );
    }

    handleAliasChange = ({target: {value}}) => this.setState({alias: value, hasChanged: true})
    handleColorChange = ({target: {value}}) => this.setState({color: value, hasChanged: true})
    handleOptionsSave = async () => {
      const color = this.state.color || this.props.device.color;
      const alias = this.state.alias || this.props.device.alias;
      await this.props.onSaveOptions(this.props.device.key, {color, alias});
      this.setState({hasChanged: false});
    }
    handleSubscribe = async () => {
      await this.props.onSaveOptions(this.props.device.key, {subscribed: !this.props.device.subscribed});

    }
}


export default DeviceEntry;
