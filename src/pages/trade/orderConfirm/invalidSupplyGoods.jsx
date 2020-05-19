import React, {Component} from 'react';
import {Link, browserHistory} from 'react-router';
import {connect} from 'react-redux'
import {LoadingRound} from 'component/common';
import {concatPageAndType, actionAxios} from 'js/actions/actions';
import {addImageSuffix} from "js/util/index";
import "./index.scss";


const createActions = concatPageAndType("orderConfirm");
const axiosCreator = actionAxios('orderConfirm');


class OrderConfirm extends Component {

	componentDidMount() {
		$(window).scrollTop(0);
	}

	render() {
		let {invalidSupplyGoods} = this.props;
		return (
			<div data-page="order-confirm" ref="orderPage" style={{minHeight: $(window).height(),padding:"10px"}}>
				<InvaildItem data={ invalidSupplyGoods }/>
				<button className="sureButton" onClick={()=>{browserHistory.goBack()}}>知道了</button>
			</div>

		)

	}
}


//失效商品
class InvaildItem extends Component {
	render() {
		const {data} = this.props;
		const invHtml = data && data.map((item, i) => {
				return <OneItem key={`item${i}`}
								data={item}/>
			});
		return data.length ? <div className="invaild-item" style={{marginBottom:"45px"}}>
			<p className="title c-cdred c-fs14">以下您所购买的商品，供应商反馈缺货</p>
			<div>{ invHtml }</div>
		</div> : null
	}
}

//一个商品
export class OneItem extends Component {
	render() {
		const {data} = this.props;
		return (
			<div className="one-item-grid">
				<div className="one-item inval">
					<div className="item-img">
						<img src={addImageSuffix(data.primary_image, '_s')}/>
					</div>
					<div className="item-info">
						<div className="info-title c-fb">
							{data.title}
						</div>
						<div className="info-spec c-c999">
							{data.spec_text}
						</div>
						<div className="invalid-message c-fs12 c-c35 c-fb">商品已不能购买</div>
						<div className="info-btm c-fs13">
							×{data.quantity}
						</div>
					</div>
				</div>
			</div>

		)
	}
}

function orderConfirmState(state, props) {
	return {
		...state.orderConfirm,
		...state.global,
	}
}

export default connect(orderConfirmState)(OrderConfirm);