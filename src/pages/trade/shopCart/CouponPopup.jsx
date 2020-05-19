import React, {Component} from 'react';
import CSSModules from 'react-css-modules'
import styles from './CouponPopup.scss';
import {Shady, LoadingRound, LoadingImg} from 'component/common';
import {PureComponent} from 'component/modules/HOC';
import {dateUtil} from "js/util/index";
import {NoCoupon} from 'component/modules/empty/NoCoupon';
import {Link} from 'react-router';


//优惠券弹窗
@CSSModules(styles, {allowMultiple: true})
export default class CouponPopup extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			show: false
		}
	}
	
	componentDidMount() {
		setTimeout(() => {
			this.setState({show: true});
		});
	}
	
	onSure = () => {
		this.setState({
			show: false
		});
		setTimeout(() => {
			this.props.close();
		}, 200)
	};
	
	render() {
		return (
			<div onClick={ this.onSure }>
				<Shady />
				<div styleName={`popupCoupon ${this.state.show ? "active" : ""}`}
				     onClick={ e => {
					     e.stopPropagation()
				     }  }>
					<div styleName="header">
						领取优惠券
						<div styleName="iconGrid">
							<i styleName="blackCloseIcon" onClick={ this.onSure }> </i>
						</div>
					</div>
					<div styleName="body">
						{this.props.data.coupons.length > 0 ?
							this.props.data.coupons.map((item, i) => {
								return <OneCoupon key={i}
								                  data={{
									                  ...item,
									                  shop_name: this.props.shopName,
									                  isBiz: this.props.isBiz
								                  }}
								                  couponHandle={this.props.couponHandle}/>
							}) :
							<NoCoupon />
						}
					</div>
				</div>
			</div>
		)
	}
}

@CSSModules(styles, {allowMultiple: true})
class OneCoupon extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			receive: true
		}
	}
	
	receiveCoupon = () => {
		this.props.couponHandle(this.props.data, () => {
			this.setState({receive: false});
		});
	}
	
	platformApply(str) {
		let arr = str.split(",");
		const strToText = {
			pc: "PC端",
			wap: "WAP端",
			all: "ALL端"
		};
		let strArr = arr.map((item, i) => {
			return strToText[item];
		});
		return strArr.join("、");
	}
	
	getPrice = (num) => {
		num = parseFloat(num);
		let a = num.toString().split(".");
		if (a.length === 1) {
			num = <span>{a[0]}<span className="c-fs14">.00</span></span>;
			return num;
		}
		if (a.length > 1) {
			if (a[1].length < 2) {
				num = <span>{a[0]}<span className="c-fs14">.{a[1]}0</span></span>;
			} else {
				num = <span>{a[0]}<span className="c-fs14">.{a[1]}</span></span>;
			}
			return num;
		}
	};
	
	render() {
		let {data} = this.props;
		let colour = data.isset_limit_money ? "couponRed" : "couponYellow";
		return <div styleName={`oneCoupon ${colour}`}>
			<div styleName="couponLeft">
				<p styleName="leftOne">
					¥<b>{ data.type == 4 ?
					this.getPrice(data.price) :
					parseInt(data.deduct_money)
				}</b>
				</p>
				<p styleName="leftTwo">
					{data.type == 4 ?
						('原价' + parseFloat(data.market_price)) :
						('满' + data.limit_money + '使用')}
				</p>
			</div>
			<div styleName="couponRight">
				{ this.state.receive ? <div styleName="receive-btn" onClick={ this.receiveCoupon}>
					立即领取
				</div> :
					<Link styleName="use-btn" to={`/searchResult?coupon_id=${data.coupon_id}`}>
						去使用 <i styleName={colour + `Icon`}> </i>
					</Link>
				}
				<p styleName="rightOne">
					<span className="c-fs16 c-c35">
						{data.type == 4 ? "免单券" :
							(data.type == 0 ? "店铺券" :
								(data.type == 1 ?
                                    "跨店券" : "平台券"))}
					</span>
					{/*{data.used_platform !== "all" &&
					`（限${this.platformApply(data.used_platform)}使用）`}*/}
				</p>
				<p styleName="rightTwo">
					{ data.apply_text }
				</p>
				<p styleName="rightThree">
					{data.use_start_time.substr(2)}至{data.use_end_time.substr(2)}
				</p>
			
			</div>
		</div>
	}
}

