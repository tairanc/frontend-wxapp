import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import { browserHistory } from 'react-router';
import {CustomerService as Customer} from 'component/common';
import './index.scss';

const serviceData = [
	{
		url: './../src/img/customerService/shop.png',
		title: '商城购物客服',
		className: 'xn-shop',
		shopAttr: 1,
		settingId: 'xt_1000_1498530991111'
	},
	{
		url: './../src/img/customerService/xtlp.png',
		title: '小泰良品客服',
		className: 'xn-xtlp',
		shopAttr: 2,
		settingId: 'xt_1000_1498116511671'
	}
];

export default class CustomerService extends Component {
	render() {
		let style = {minHeight: $(window).height(), background: '#f4f4f4'};
		let html = serviceData.map((item, i) => {
			return (
				<CustomerList data={item} key={i} hasBorder={i!==2} />
			)
		});
		return (
			<div data-page="customer-service">
				<div className="wrapper" style={style}>
					<div className="service-time">
						<span style={{marginRight: '5px'}}>咨询服务</span>
						<span style={{marginRight: '5px'}}>（服务时间</span>
						<span>09:00-21:00）</span>
					</div>
					<CustomerPhone />
					{html}
				</div>
			</div>
		)
	}
}

export class CustomerPhone extends Component {
	render() {
		return (
			<a href="tel:400-669-6610">
				<div className="call-container" style={{marginBottom: '10px'}}>
					<img src='./../src/img/customerService/phone.png'/>
					<div className="iphone-num">
						<p>电话客服</p>
						<div className="sub-title">400-669-6610</div>
						<div className="dial">立即拨打</div>
					</div>
				</div>
			</a>
		)
	}
}

export class CustomerList extends Component {
	render() {
		let {data:{className,shopAttr,url,title},hasBorder} = this.props;
		return (
			<Customer className={className} shopAttr={shopAttr}>
				<div className="call-container">
					<img src={url}/>
					<div className="iphone-num" style={{borderBottom: hasBorder?'1px solid #f4f4f4':'none'}}>
						<p>{title}</p>
						<div className="sub-title">查看您与客服的聊天记录</div>
						{/*<div className="dates">{false?'17/08/08':''}{false?<span></span>:''}</div>*/}
					</div>
				</div>
			</Customer>
		)
	}
}