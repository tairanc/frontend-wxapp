import React, {Component} from 'react';
import CSSModules from 'react-css-modules'
import styles from './CheckIcon.scss';
import {PureComponent} from 'component/modules/HOC';


//check标签
@CSSModules(styles,{allowMultiple: true})
export default class CheckIcon extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			check: (this.props.seckill || this.props.invalid) ? false : this.props.isCheck
		};
	}
	
	componentWillReceiveProps(props) {
		if(props.seckill || props.invalid){
            this.setState({check: false});
		} else {
            this.setState({check: props.isCheck});
		}

	}
	
	checkHandle = () => {
		let preventUpdate = this.props.handleCheck && this.props.handleCheck();
		if(!preventUpdate) this.setState({check: !this.state.check});
	}
	
	render(){
		if( this.props.seckill ){
			return <span styleName="label redLabel">秒杀</span>;
		}
		if(this.props.invalid ){
			return <span styleName="label greyLabel">失效</span>;
		}else if(this.props.disable) {
			return <span styleName="checkIcon inv"> </span>;
		}else{
			return <div onClick={ !this.props.disable && this.checkHandle }>
				<span styleName={ this.props.isCheck ?"checkIcon check": "checkIcon" }> </span>
			</div>
		}
	}
}