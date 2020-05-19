import React, {Component} from 'react';
import CSSModules from 'react-css-modules'
import styles from './ItemSwipe.scss';
import {PureComponent} from 'component/modules/HOC';
import {Link} from 'react-router';
import {addImageSuffix} from "src/js/util/index"
import {DIR} from 'config/index'

@CSSModules(styles,{allowMultiple: true})
export default class ItemSwipe extends PureComponent{
	constructor(props){
		super(props);
		this.state = {
			load:false
		}
	}
	updateData=()=>{
		if(this.state.load){
			return;
		}
		this.setState({load:true});
		this.props.updateData(()=>{
			this.refs.swipeBox.scrollLeft = 0;
			this.setState({load:false});
		})
	};
	render(){
		let {data} = this.props;
		return <div styleName="itemSwipe">
			<div styleName="header">
				<div styleName="hText">
					大家都在买
				</div>
				<div styleName="hCtrl" onClick={this.updateData}>
					换一批 <i styleName={`redCycle ${this.state.load ?"cycleActive":""}`} > </i>
				</div>
			</div>
			<div styleName="swipeWrapper">
				<div styleName="swipeBox" ref="swipeBox">
					<div styleName="swipeContent" style={{ width: `${134*data.length+6}px` }}>
						{data.map((item,i)=>{
							return <ItemVtr data={item} key={i}/>
						})}

					</div>
				</div>
			</div>

		</div>
	}
}

@CSSModules(styles)
export class ItemVtr extends Component{
	render(){
		let {data} = this.props;
		let {promotion_info} = data;
		let _price = 0
		if(promotion_info && promotion_info.promotion_price){
            _price = promotion_info.promotion_price
		} else {
            _price = data.sell_price
		}
		return <Link styleName="item" to={`${DIR}/item?item_id=${data.item_id}`}>
			<img src={data.primary_image ? addImageSuffix(data.primary_image, '_t'):require('../../../img/icon/loading/default-no-item.png') } />
			<div styleName="title">
				{data.title}
			</div>
			<div styleName="price">
				<span>¥{+_price}</span>
                {data.free_shipping ?<span styleName="label">包邮</span>:""}
				{data.free_tax ?<span styleName="label">包税</span>:""}
			</div>
		</Link>
	}
}