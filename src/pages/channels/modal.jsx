import React, {Component} from 'react';
import {Link} from 'react-router';
import {LoadingRound} from 'component/common.jsx';
import {browserHistory} from 'react-router';
import {addImageSuffix} from "src/js/util/index"
import {miniProgramShopCart} from 'js/util/miniProgramLogin';
import './modal.scss';

//频道页模板
export class Channels extends Component {
	constructor(props) {
		super(props);
	}

	static contextTypes = {
		router: React.PropTypes.object
	};

	componentWillMount() {
		let {config} = this.props;
		document.title = config.title ? config.title : '';
		if (this.props.load) {
			this.props.getPageData();
		}
	}

	componentDidMount() {
		let {config} = this.props;
	}

	componentWillUnmount() {
		this.props.saveDistanceTop();
		this.props.changeReturn(true);
	}

	render() {
		let {banner, list, discrimination} = this.props;
		return (
			<div data-page="channels-modal">
				{!this.props.load ? (banner.length + list.length > 0) ?
					<section data-plugin="swiper">
						{this.props.discrimination.inputShowState ?
							<Search type={this.props.discrimination.type}/> : ""}
						{discrimination.bannerPosition == 'top' ? this.props.defaultIndex ? '' :
							<Banner data={banner}/> : ''}
						<Nav data={list} {...this.props} />
						<TotopAndCart countCart={this.props.countCart} discrimination={this.props.discrimination}/>
					</section>
					: <ShopClose />
					: <LoadingRound />}
			</div>
		)
	}
}
class Search extends Component {
	jumpSearch(type) {
		if (type == 'qyg') {
			browserHistory.push(`${DIR}/qygSearch`);
		} else {
			browserHistory.push(`${DIR}/search`);
		}
	}

	render() {
		let {type} = this.props;
		return (
			<div className="search-input" onClick={this.jumpSearch.bind(this, type)}>
				<input placeholder="请输入要搜索的商品"/>
				<i className="search-icon"></i>
			</div>
		)
	}
}
//banner
class Banner extends Component {
	componentWillMount() {
		this.setState({
			activeIndex: 1
		})
	}

	componentDidMount() {
		let self = this;
		let {data} = this.props;
		if (data.length > 1) {
			let mySwiper = new Swiper('.banner', {
				autoplay: 2000,
				autoplayDisableOnInteraction: false,
				loop: true,
				pagination: '.swiper-pagination',
				paginationType: 'fraction'
			});
		}
	}

	render() {
		let {activeIndex} = this.state;
		let {data} = this.props;
		//console.log("model.data="+data);
		let banners = data.map(function (item, i) {
			return (<div className="swiper-slide" key={i}>
				<a href={item.link}><img src={item.banner_image}/></a>
			</div>)
		})
		return (
			<div className="swiper-container banner">
				<div className="swiper-wrapper">
					{banners}
				</div>
				{data.length > 1 ? <div className="swiper-pagination"></div> : ''}
			</div>
		)
	}
}

//导航
class Nav extends Component {
	componentWillMount() {
		this.setState({
			index: this.props.defaultIndex
		})
	}

	componentDidMount() {
		let {inputShowState, bannerPosition} = this.props.discrimination;
		let inputHeight = inputShowState ? $('.search-input').height() : 0;
		let bannerHeight = bannerPosition == 'top' ? $('.banner').height() : 0;
		$('.control').css({minHeight: $(window).height() - inputHeight, background: '#f4f4f4'});
		if (this.state.index === 0) {
			$('.nav1').css({top: bannerHeight + inputHeight});
		} else {
			$('.nav1').css({top: inputHeight});
		}
		$('.nav1 span').removeClass('active-one').eq(this.props.defaultIndex).addClass('active-one');
		let self = this;
		let navSwiper1 = new Swiper('.nav1', {
			height: 50,
			slidesPerView: 'auto',
			initialSlide: self.props.defaultIndex,
			normalizeSlideIndex: false,
			onClick: function (swiper) {
				if (swiper.clickedIndex === 0) {
					$('.nav1').css({top: bannerHeight + inputHeight});
				} else {
					$('.nav1').css({top: inputHeight});
				}
				self.props.changeReturn(false);
				listsSwiper.slideTo(swiper.clickedIndex);
				self.setState({index: swiper.clickedIndex});
				$('.nav1 span').removeClass('active-one').eq(swiper.clickedIndex).addClass('active-one');
			}
		});
		let listsSwiper = this.listsSwiper = new Swiper('.lists', {
			observer: true,
			initialSlide: self.props.defaultIndex,
			onSlideChangeStart: function (swiper) {
				if (swiper.activeIndex === 0) {
					$('.nav1').css({top: bannerHeight + inputHeight});
				} else {
					$('.nav1').css({top: inputHeight});
				}
				let sindex = (swiper.activeIndex - 2 > 0) ? (swiper.activeIndex - 2) : 0;
				navSwiper1.slideTo(sindex);
				let id = $('.nav1 .nav').eq(swiper.activeIndex).attr('id');
				if (!self.props.isReturn) {
					self.props.getDefaultIndex(swiper.activeIndex);
					self.props.getEachList(id);
					self.props.getDefaultId(id);
					self.props.changeGettingList(true);
					self.setState({index: swiper.activeIndex});
				}
				self.props.changeReturn(false);
				$('.nav1 span').removeClass('active-one').eq(swiper.activeIndex).addClass('active-one');
			},
			onSlideChangeEnd: function (swiper) {
				navSwiper1.update();
			}
		});
	}

	render() {
		let self = this;
		let {data, defaultIndex, eachList, gettingList, hasMore, gettingMore, page, addEachList, saveDistanceTop, config, discrimination, banner} = this.props;
		let navs = data.map(function (item, i) {
			return (
				<div key={i} id={item.id} className="swiper-slide nav">
					<span>{item.nav_name}</span>
				</div>
			)
		});
		let lists = data.map(function (item, i) {
			let bgType = 0;
			if (i % 5 === 1) {
				bgType = 1
			} else if (i % 5 === 2) {
				bgType = 2
			} else if (i % 5 === 3) {
				bgType = 3
			} else if (i % 5 === 4) {
				bgType = 4
			}
			return <div key={i} className="swiper-slide">
				{discrimination.bannerPosition == 'bottom' ? defaultIndex ? '' : <Banner data={banner}/> : ''}
				{(defaultIndex === i && (!gettingList)) ?
					<EachList defaultIndex={defaultIndex} saveDistanceTop={saveDistanceTop} addEachList={addEachList}
							  page={page} hasMore={hasMore} gettingMore={gettingMore} channelData={data} data={item}
							  eachList={eachList} bgType={bgType} listsSwiper={self.listsSwiper}
							  discrimination={discrimination}/>
					: <LoadingRound />}
			</div>
		});
		return (
			data.length ? <div className={`control ${data.length > 1 ? '' : 'control-no-nav'}`}>
				<div className={`swiper-container nav1 ${data.length > 1 ? '' : 'hidden'}`}>
					<div className="swiper-wrapper">
						{navs}
					</div>
				</div>
				<div className="swiper-container lists">
					<div className="swiper-wrapper">
						{lists}
					</div>
				</div>
			</div> : <div>
				{discrimination.bannerPosition == 'bottom' ? <Banner data={banner}/> : ''}
				<NoNav />
			</div>
		)
	}
}

//列表
class EachList extends Component {
	componentWillUnmount() {
		$(window).unbind('scroll.loadmore');
	}

	componentDidMount() {
		let {inputShowState, bannerPosition} = this.props.discrimination;
		let inputHeight = inputShowState ? $('.search-input').height() : 0;
		let bannerHeight = bannerPosition == 'top' ? $('.banner').height() : 0;
		$('.list').css({minHeight: $(window).height() - 40});
		let {addEachList} = this.props;
		$(window).scrollTop(0);
		this.props.saveDistanceTop();
		if (this.props.defaultIndex) {
			$('.nav1').css({top: inputHeight, opacity: 1});
		} else {
			$('.nav1').css({top: bannerHeight + inputHeight, opacity: 1});
		}
		//翻页
		let self = this;
		$(window).bind('scroll.loadmore', function () {
			let $this = $(this);
			let scrollH = $this.scrollTop();
			let scrollHeight = $(".list").height() - $(window).height() + bannerHeight;
			if (scrollH > scrollHeight - 10) {
				if (self.props.hasMore && (self.props.gettingMore === false)) {
					let id = $('.nav1 .active-one').parent().attr('id');
					let page = self.props.page.current_page + 1;
					addEachList(id, page);
				}
			}
		});
	};

	render() {
		let {data, bgType, eachList, hasMore, gettingMore, defaultIndex, page, listsSwiper, channelData, discrimination} = this.props;
		let styleType = {
			10: 'goods3',
			20: 'goods1',
			30: 'goods2'
		};
		let type = styleType[data.style];
		let goods = eachList.map(function (item, i) {
			return <EachGoods key={i} data={item} type={type}/>
		});
		let bg = ["src/img/channels/bg1.png", "src/img/channels/bg2.png", "src/img/channels/bg3.png", "src/img/channels/bg4.png", "src/img/channels/bg5.png"]
		return (
			<div className="list c-clrfix c-pr c-pb40">
				<div style={{width: '100%', position: 'relative'}}>
					<img className="listImg"
						 src={(data.channel_image && !data.show_default_img) ? data.channel_image : bg[bgType]}/>
					{(data.channel_image && !data.show_default_img) ? '' : <p className="listName">{data.nav_name}</p>}
				</div>
				{goods}
				{discrimination.oneMoreItemType == 0 ? eachList.length ?
					<div
						className={"c-fs13 c-c999 c-tc c-lh40 add c-fl c-lh40 c-pa " + (hasMore && gettingMore ? 'adding' : '')}
						style={{height: '40px', width: '100%', left: '0', bottom: '0'}}>
						{hasMore ? (gettingMore ? '加载中...' : '下拉加载更多') : '别拉了，我是有底线的~'}
					</div>
					: <NoGoods /> : ""
				}
				{discrimination.oneMoreItemType == 1 ? eachList.length ? "" : <NoGoods /> : ""}
				{discrimination.oneMoreItemType == 1 ?
					<NoMoreItem activeIndex={defaultIndex} data={channelData} page={page} listsSwiper={listsSwiper}
								isSending show/> : ""}
			</div>
		)
	}
}
class NoMoreItem extends Component {
	render() {
		let {current_page, total_page} = this.props.page;
		let {data, activeIndex, listsSwiper} = this.props;
		let length = this.props.data.length;
		let html, index;
		if (length === 1) {
			html = "";
		} else {
			if (activeIndex >= length - 1) {
				html = data[0].nav_name;
				index = 0;
			} else {
				html = data[activeIndex + 1].nav_name;
				index = activeIndex + 1;
			}
		}
		return (
			<div className="add">
				{this.props.show ? (current_page < total_page ? (this.props.isSending ?
					<span className="loading">加载中...</span> :
					<span style={{height: "30px", lineHeight: "50px"}}>下拉加载更多</span>) :
					<span className="go-next" onClick={() => {
						listsSwiper.slideTo(index);
					}}>{length === 1 ? "别拉了，我是有底线的~" : ("继续浏览 " + html)} <i
						className="arrow-right-black-icon"> </i></span>) :
					<div></div>}
			</div>
		)
	}
}
//无商品列表
class NoGoods extends Component {
	componentDidMount() {
		$('.no-goods').css({height: $('.list').height() - $('.listImg').height()})
	}

	render() {
		return (
			<div className="no-goods">
				<img src="/src/img/logistics/no-goods.png"/>
			</div>
		)
	}
}
//无导航
class NoNav extends Component {
	render() {
		return (
			<div className="no-goods2">
				<img src="/src/img/logistics/no-goods2.png"/>
			</div>
		)
	}
}
//店铺关闭
class ShopClose extends Component {
	render() {
		return (
			<div className="shop-close">
				<img src="/src/img/logistics/shop-close.png"/>
			</div>
		)
	}
}

//商品---样式1,2,3
class EachGoods extends Component {
	formatPrice = (num, type) => {
		num = parseFloat(num);
		let a = num.toString().split(".");
		if (a.length == 1) {
			num = <span>¥<span className={type ? "c-fs19" : ''}>{a[0]}</span></span>;
			return num;
		}
		if (a.length > 1) {
			if (a[1].length < 2) {
				num = <span>¥<span className={type ? "c-fs19" : ''}>{a[0]}</span>.{a[1]}</span>;
			} else {
				num = <span>¥<span className={type ? "c-fs19" : ''}>{a[0]}</span>.{a[1]}</span>;
			}
			return num;
		}
	};

	getPrice(data, type) {
		let price = "";
		if (type) {
			if (data.is_group) {
				price = data.group_data.group_price;
			} else {
				if (data.promotion_detail.promotion_price) {
					price = data.promotion_detail.promotion_price;
				} else {
					price = data.sell_price;
				}
			}
		} else {
			price = data.is_group ? data.sell_price : data.market_price;
		}
		return price;
	}

	getTagByPromotionDetail(promotion_detail) {
		let tagContainer = [];
		if (promotion_detail && promotion_detail.length > 0) {
			for (let i = 0; i < promotion_detail.length; i++) {
				let type = promotion_detail[i].promotion_type;
				if (type == 'FullMinus' || type == 'FullDiscount' || type == 'OptionBuy') {
					promotion_detail[i].name && promotion_detail[i].name.split(';')[0] && tagContainer.push(promotion_detail[i].name.split(';')[0]);
				} else {
					promotion_detail[i].promotion_tag && tagContainer.push(promotion_detail[i].promotion_tag);
				}
			}
		}
		return tagContainer.map(function (item, index) {
			return <li key={index} className="maizeng">{item}</li>
		});
	}

	render() {
		let {type, data} = this.props;
		return (
			<div className={type}>
				<div className="goods-img c-pr">{data.store === 0 ?
					<img id="sold-out" src="src/img/channels/soldOut.png"/> : ''}<Link
					to={'item?item_id=' + data.id}><img
					src={data.primary_image ? addImageSuffix(data.primary_image,'_m') : "/src/img/evaluate/goodsbg.png"}/></Link></div>
				<div className="goods-msg">
					<div className="goods2-titles">
						<ul className="label c-clrfix">{data.is_group && (type === 'goods2') ?
							<li>拼团</li> : (data.promotion_detail.promotion_tags && <span
								className='promotion_area'>{data.promotion_detail.promotion_tags.join()}</span>)}{false ?
							<li className="qiye">
								企业购</li> : ''}{/*{this.getTagByPromotionDetail(data.promotion_detail)}*/}</ul>
						<Link to={'item?item_id=' + data.id}>
							<div className="title">{data.title}</div>
						</Link>
						<div className="title-add">{data.sub_title}</div>
					</div>
					<div className="price">
						<div className="now c-fs12">{data.is_group ?
							<i className="group">{data.group_data.group_person}人团 </i> : ''}{this.formatPrice(this.getPrice(data, true), true)}</div>
						<span
							className="old">{type === 'goods2' ? '' : (data.is_group ? '单买' : '原价')} {this.formatPrice(this.getPrice(data, false), false)}</span>
						<Link to={'item?item_id=' + data.id}>
							<button>去抢购{type === 'goods3' ? <i className="arrow-right-white-icon"></i> : ''}</button>
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
	}

	componentDidMount() {
		let {inputShowState, bannerPosition} = this.props.discrimination;
		let $window = $(window)
		let windowH = $window.height();
		let $toTop = $(".toTop");
		let inputHeight = inputShowState ? $('.search-input').height() : 0;
		let time;
		$toTop.on("click", function () {
			clearInterval(time)
			let h = $window.scrollTop();
			time = setInterval(function () {
				h -= 10;
				$window.scrollTop(h);
				if (h <= 0) {
					clearInterval(time)
				}
			}, 1)

		});
		$(window).bind('scroll.top', function () {
			let bannerHeight = bannerPosition == 'top' ? $('.banner').height() : 0;
			let $this = $(this);
			let scrollH = $this.scrollTop();
			let navTop = $(window).scrollTop() - bannerHeight - inputHeight;
			if (scrollH > 35) {
				$toTop.show()
			} else {
				$toTop.hide()
			}
			if (navTop >= 0) {
				$('.nav1').css({top: 0});
			} else {
				$('.nav1').css({top: -navTop});
			}
		})
	}

	render() {
		let {countCart} = this.props;
		return (
			<div className="cart-toTop">
				<ul>
					<a onClick={(e)=>{
						e.preventDefault();
						miniProgramShopCart();
					}}>
						<li className="cart">{countCart ? <span className="cart-count">{countCart}</span> : ''}</li>
					</a>
					<li className="toTop"></li>
				</ul>
			</div>
		)
	}
}