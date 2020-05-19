import React, {Component} from 'react';
import {Link} from 'react-router';
import {LoadingRound} from 'component/common.jsx';
import {addImageSuffix} from "src/js/util/index"
import {DIR} from 'config/index'
import {miniProgramShopCart} from 'js/util/miniProgramLogin';
import './topicModal.scss';

//频道页模板
export class Channels extends Component {
	constructor(props) {
		super(props);
	}

	static contextTypes = {
		router: React.PropTypes.object
	}

	componentWillMount() {
		if (this.props.load) {
			this.props.getDataList();
		}
	}

	componentWillUnmount() {
		this.props.saveDistanceTop();
		this.props.changeReturn(true);
	}

	render() {
		let {topicList} = this.props;
		return (
			<div data-page="channels-modal">
				{!this.props.load ?
					<div>
						<DataList data={topicList} {...this.props} />
						<TotopAndCart countCart={this.props.countCart}/>
					</div>
					:
					<LoadingRound />}
			</div>
		)
	}
}

//列表
class DataList extends Component {
	componentWillUnmount() {
		$(window).unbind('scroll.loadmore');
	}

	componentDidMount() {
		$('.list').css({minHeight: $(window).height() - 40});
		let {addEachList} = this.props;
		$(window).scrollTop(0);
		this.props.saveDistanceTop();

		//翻页
		let self = this;
		$(window).bind('scroll.loadmore', function () {
			let $this = $(this);
			let scrollH = $this.scrollTop();
			let scrollHeight = $(".list").height() - $(window).height();
			if (scrollH >= scrollHeight) {
				if (self.props.hasMore && (self.props.gettingMore === false)) {
					let page = self.props.page.current_page + 1;
					addEachList(page);
				}
			}
		});
	};

	render() {
		let {data, eachList, hasMore, gettingMore} = this.props;
		let styleType = {
			10: 'centerStyle',
			20: 'leftStyle',
			30: 'towColumnStyle'
		};
		let type = styleType[data.style];
		let goods = eachList.map((item, i) => {
			return <EachGoods key={i} data={item} type={type}/>
		});
		return (
			<div className="list c-clrfix">
				<a href={!!data.detail ? data.detail : 'javascript:void(0)'}>
					{data.channel_image && <img className="list-banner" src={ data.channel_image }/>}
				</a>
				{goods}
				{eachList.length ?
					<div className={`add ${hasMore && gettingMore ? 'adding' : ''}`}>
						{hasMore ? (gettingMore ? '加载中...' : '下拉加载更多') : '别拉了，我是有底线的~'}
					</div>
					:
					<NoGoods />
				}
			</div>
		)
	}
}

//无商品列表
class NoGoods extends Component {
	componentDidMount() {
		$('.no-goods').css({height: $('.list').height() - $('.list-banner').height()})
	}

	render() {
		return (
			<div className="no-goods">
				<img src="/src/img/logistics/no-goods.png"/>
			</div>
		)
	}
}

//商品---样式1,2,3
class EachGoods extends Component {
	getPrice = (num, type) => {
		let price = parseFloat(num).toFixed(2).split('.');
		return <span>¥<span className={type ? "c-fs19" : ''}>{price[0]}</span>.{price[1]}</span>;
	};

	render() {
		let {type, data} = this.props;
		let detailLen = data.promotion_detail.length;
		return (
			<div className={type}>
				<div className="goods-img c-pr">
					{data.store===0 ? <img id="sold-out" src="src/img/channels/soldOut.png"/> : ''}
					<Link to={`${DIR}item?item_id=${data.id}`}>
						<img src={data.primary_image ? addImageSuffix(data.primary_image,'_m') : "/src/img/evaluate/goodsbg.png"}/>
					</Link>
				</div>

				<div className="goods-msg">
					<div className="goods2-titles">
						<div className="label c-clrfix">
							{!!data.is_group && <span className="not-promotion-label">拼团</span>}
							{!data.is_group && data.promotion_detail.promotion_tags &&
							<span className='promotion_area'>
                                    {/*{data.promotion_detail.map((item, i) => {
									 return <span key={i}>
									 <span className='promotion_type'>
									 {/^FullMinus|FullDiscount|OptionBuy$/.test(item.promotion_type) ?   //满减|满折|N元任选
									 /;/.test(item.name) ?     //满折满减N元任选，存在多区间，取第一个区间值
									 item.name.slice(0, item.name.indexOf(';'))
									 :
									 item.name
									 :
									 item.promotion_tag
									 }
									 </span>
									 {(detailLen !== 1 && i !== detailLen - 1) &&
									 <span className='split'></span>}
									 </span>
									 })}*/}
								{data.promotion_detail.promotion_tags.join("")}
                                </span>
							}
							{(data.trade_type === 20 || data.trade_type === 40) &&
							<span className="not-promotion-label yellow-label">海外直邮</span>}
							{data.trade_type === 30 && <span className="not-promotion-label blue-label">跨境保税</span>}
						</div>
						<Link to={'item?item_id=' + data.id}>
							<div className="title">
								{data.title}
							</div>
						</Link>
						<div className="title-add">{data.sub_title}</div>
					</div>

					<div className="price">
						<div className="now c-fs12">
							{!!data.is_group && <i className="group">{data.group_data.group_person}人团</i>}
							{/*直降、特卖promotion_price*/}
							{this.getPrice((data.is_group ? data.group_data.group_price : (data.promotion_detail.promotion_price ? data.promotion_detail.promotion_price : data.sell_price)), true)}
						</div>
						<span className="old">
                            {type !== 'towColumnStyle' && (data.is_group ? '单买' : '原价')}
							{this.getPrice((data.is_group ? data.sell_price : data.market_price), false)}
                        </span>

						<Link to={'item?item_id=' + data.id}>
							<button>
								去抢购
								{type === 'centerStyle' && <i className="arrow-right-white-icon"></i>}
							</button>
						</Link>
					</div>
				</div>
			</div>
		)
	}
}

//回到顶部+跳到购物车
export class TotopAndCart extends Component {
	componentWillUnmount() {
		$(window).unbind('scroll.top');
		clearInterval(this.timer);
	}

	toTopClick = () => {
		let $window = $(window);
		let h = $window.scrollTop();
		let self = this;
		this.time = setInterval(function () {
			h -= 10;
			$window.scrollTop(h);
			if (h <= 0) {
				clearInterval(self.time);
			}
		}, 1);
	};

	componentDidMount() {
		clearInterval(this.timer);
		let $toTop = $(".toTop");
		$(window).bind('scroll.top', function () {
			let $this = $(this);
			let scrollH = $this.scrollTop();
			if (scrollH > 35) {
				$toTop.show()
			} else {
				$toTop.hide()
			}
		})
	}

	render() {
		let {countCart} = this.props;
		return (
			<div className="cart-toTop">
				<a onClick={(e)=>{
					e.preventDefault();
					miniProgramShopCart()
				}}>
					<div className="cart fix-window">
						{ !!countCart && <span className="cart-count">{countCart}</span> }
					</div>
				</a>
				<div className="toTop fix-window" onClick={this.toTopClick}></div>
			</div>
		)
	}
}