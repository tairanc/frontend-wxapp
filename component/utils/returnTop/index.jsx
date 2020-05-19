import React, {Component} from 'react';
import styles from  './returnTop.scss';
import {PureComponent} from 'component/modules/HOC';

export default class ReturnTop extends PureComponent{
	constructor(props){
		super(props);
		this.state = {
			show: false
		}
	}
	static defaultProps = {
		style:{},
		imgUrl:require('./img/return-top-icon.png'),
		imgWidth: 20,
		imgHeight: 20,
		// _winHeight:window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
		showDistance: 700,
	};
	
	componentDidMount() {
		window.addEventListener('scroll',this.scrollEvent);
	}
	
	componentWillUnmount() {
		window.removeEventListener('scroll',this.scrollEvent);
	}
	
	returnTop=()=>{
		window.scrollTo(0, 0);
	};
	scrollEvent=()=>{
		let top = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || 0;
		if( top > this.props.showDistance ){
			!this.state.show && this.setState({show:true})
		}else{
			this.state.show && this.setState({show:false});
		}
	};
	render(){
		if(!this.state.show) return null;
		return <div className={styles.returnTop} style={this.props.style} onClick={this.returnTop}>
			<img src={this.props.imgUrl} width={this.props.imgWidth} height={this.props.imgHeight} />
		</div>
	}
}
