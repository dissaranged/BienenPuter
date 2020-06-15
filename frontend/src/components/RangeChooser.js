import React, {Component} from 'react';
import { Button, Classes } from '@blueprintjs/core';


export default class RangeChooser extends Component {
  state = {
    min: null,
    max: null,
    editing: false,
  }

  componentDidMount() {
    const {min, max} = this.props.range;
    this.setState({min, max});
  }

  componentWillReceiveProps(props) {
    const {range:{min, max}} = props;
    if(this.props.range.min !== min || this.props.range.max !== max) {
      this.setState({min, max, editing: false});
    }
  }

  render() {
    const {min, max, editing} = this.state;
    const {unit} = this.props;
    return (
      <div style={this.props.style}>
        {editing ?
         (<span>
            From
            <input
              className={Classes.INPUT.SMALL}
              style={{width: '3em', marginLeft: "0.5em", marginRight: "0.5em"}}
              value={min}
              onChange={this.handleMinChange}/>
            {unit} to
            <input
              className={Classes.INPUT.SMALL}
              style={{width: '3em', marginLeft: "0.5em", marginRight: "0.5em"}}
              value={max}
              onChange={this.handleMaxChange}/> {unit}
           <Button onClick={this.handleSubmit} icon="tick" intent="success"/>
          </span>
         )
         :(
           <span onClick={this.startEditing}>From {min} {unit} to {max} {unit}</span>
         )}
      </div>
    );
  }

  handleMinChange = ({target: {value}}) => this.setState({min:parseInt(value)})
  handleMaxChange = ({target: {value}}) => this.setState({max:parseInt(value)})

  startEditing = () => this.setState({editing: true});

  handleSubmit = () => {
    const {min, max} = this.state;
    this.props.onSubmit({min, max});
    this.setState({editing: false});
  }
}
