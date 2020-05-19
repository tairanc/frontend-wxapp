/**
 * Created by hzhdd on 2017/10/13.
 */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {LoadingRound, Totop} from 'component/common.jsx';
import {compress} from 'js/common/compressImage';
import {PopupModal, PopupTip} from 'component/modal';
import Navigator from 'component/modules/navigation';
import Immutable from 'immutable';
import {Link} from 'react-router';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import {browserHistory} from 'react-router';
import {tip} from 'component/modules/popup/tip/tip';
import axios from 'js/util/axios';
import {WXAPI, DIR} from 'config/index';
import "./giftsCustom.scss"

const pageApi = {
	uploadImage: {url: `${WXAPI}/uploadImage`, method: "post"},    //上传图片【BASE64码】
	purchaseAdd: {url: `${WXAPI}/business/purchase/add`, method: "post"}, //礼品定制
};

let firH = $(window).height(), timer, mySwiper;
class GiftsCustom extends Component {
	constructor(props) {
		let date = new Date();
		super(props);
		this.state = {
			load: false,
			giftItem: [{
				"item_name": "",
				"item_model": "",
				"budget_amount": "",
				"purchase_quantity": "",
				"item_url": "",
				"images": []
			}],
			status: [{
				"item_name": false,
				"item_model": false,
				"budget_amount": false,
				"purchase_quantity": false,
				"item_url": false,
				"loading": false,
			}],
			goNext: true,
			tipStatus: false,

			nowYear: date.getFullYear(),
			nowMonth: date.getMonth() + 1,
			nowDay: date.getDate(),
		}
	}

	componentWillMount() {
		let {isLogin, pending} = this.props;
		if (!pending && !isLogin) {
			browserHistory.replace(`${DIR}/login?redirect_uri=${encodeURIComponent("/giftsCustom")}`);
			return
		}
	}

	componentWillReceiveProps(newProps) {
		if (!newProps.pending && !newProps.isLogin) {
			browserHistory.replace(`${DIR}/login?redirect_uri=${encodeURIComponent("/giftsCustom")}`);
		}
	}

	componentWillUnmount() {
		tip.destroy();
		timer = null;
	}

	//下一步
	goNext = () => {
		let {giftItem} = this.state, scrollHeight;
		for (let i = 0; i < giftItem.length; i++) {
			if (!giftItem[i]["item_name"].trim()) {
				$(`.sign1${i}`).css({color: "#f00"});
				$(`.sign2${i}`).css({color: ""});
				$(`.sign3${i}`).css({color: ""});
				$(".add-button").css({marginBottom: "105px"});
				scrollHeight = $(this.refs.giftWrapper).scrollTop() + $(`.item_name-${i}`).offset().top - 56;
				$(this.refs.giftWrapper).scrollTop(scrollHeight);
				this.setState({tipStatus: true});
				return;
				$(this.refs.giftWrapper).scrollTop(scrollHeight);
			} else if (!giftItem[i]["budget_amount"]) {
				$(`.sign2${i}`).css({color: "#f00"});
				$(`.sign1${i}`).css({color: ""});
				$(`.sign3${i}`).css({color: ""});
				$(".add-button").css({marginBottom: "105px"});
				scrollHeight = $(this.refs.giftWrapper).scrollTop() + $(`.budget_amount-${i}`).offset().top - 56;
				$(this.refs.giftWrapper).scrollTop(scrollHeight);
				this.setState({tipStatus: true});
				return;
			} else if (!giftItem[i]["purchase_quantity"]) {
				$(`.sign3${i}`).css({color: "#f00"});
				$(`.sign1${i}`).css({color: ""});
				$(`.sign2${i}`).css({color: ""});
				$(".add-button").css({marginBottom: "105px"});
				scrollHeight = $(this.refs.giftWrapper).scrollTop() + $(`.purchase_quantity-${i}`).offset().top - 56;
				$(this.refs.giftWrapper).scrollTop(scrollHeight);
				this.setState({tipStatus: true});
				return;
			} else {
				this.setState({tipStatus: false});
				$(`.sign1${i}`).css({color: ""});
				$(`.sign2${i}`).css({color: ""});
				$(`.sign3${i}`).css({color: ""});
				$(".add-button").css({marginBottom: "65px"});
			}
		}
		this.setState({
			goNext: false
		})
	};

	//添加商品
	addGift = () => {
		let {giftItem, status} = this.state;
		giftItem.push({
			"item_name": "",
			"item_model": "",
			"budget_amount": "",
			"purchase_quantity": "",
			"item_url": "",
			"images": []
		});
		status.push({
			"item_name": false,
			"item_model": false,
			"budget_amount": false,
			"purchase_quantity": false,
			"item_url": false,
			"loading": false
		});
		this.setState({
			giftItem: giftItem,
			status: status,
		})
	};

	//删除商品
	delateItem = (e) => {
		let {giftItem} = this.state;
		let idN = +(e.currentTarget.id).split("e")[1];
		giftItem.splice(idN, 1);
		this.setState({
			giftItem: giftItem,
		})
	};

	//图片上传
	upLoadImg = async (e) => {
		let cN = e.currentTarget.parentElement.id;
		let cNum = e.currentTarget.className;
		let files = $(`#${cN}`)[0].firstChild.files;
		if (!/^image\/(jpg|png|jpeg|bmp)$/.test(files[0].type)) {
			tip.show({msg: "亲，请上传jpg/png/jpeg/bmp格式的图片哦~"});
			return;
		}
		if (!files.length) return;
		let file = Array.prototype.slice.call(files)[0];
		let photoData = await compress(file);
		this.upLoadAjax(photoData, cNum);
		$(`.${cNum}`).val("");  //onchange事件改编val
	};

	upLoadAjax = (basestr, cNum) => {
		let state = Immutable.fromJS(this.state);
		state = state.setIn(["status", cNum, "loading"], true);
		this.setState(state.toJS());
		axios.request({...pageApi.uploadImage, data: {img: basestr}}).then(result => {
			state = state.updateIn(["giftItem", cNum, "images"], (list) => {
				return list.toJS().concat(result.data.data.file.complete_url);
			});
			state = state.setIn(["status", cNum, "loading"], false);
			this.setState(state.toJS());
			mySwiper.update();
		}).catch(error => {
			console.error(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		});
	};

	//删除图片
	delateImg = (i, index) => {
		let {giftItem} = this.state;
		giftItem[i]["images"].splice(index, 1);
		this.setState({
			giftItem: giftItem
		})
	};

	//商品名称
	handleItem = (e) => {
		let cN = e.target.className.split("-")[0], cNum = +e.target.className.split("-")[1];
		let newGiftItem = this.state.giftItem;
		let item = newGiftItem[cNum];
		item = {...item, [cN]: e.target.value};
		newGiftItem[cNum] = item;
		this.setState({
			...this.state,
			giftItem: newGiftItem
		});
	};

	handleCloseItem = (e) => {
		e.stopPropagation;
		let cN = e.target.className.split("-")[0], cNum = +e.target.className.split("-")[1];
		let newGiftItem = this.state.giftItem;
		let item = newGiftItem[cNum];
		item = {...item, [cN]: ""};
		newGiftItem[cNum] = item;
		this.setState({
			...this.state,
			giftItem: newGiftItem
		});
	};

	handleFocus = (e) => {
		let cN = e.target.className.split("-")[0], cNum = +e.target.className.split("-")[1];
		let newStatus = this.state.status;
		let iS = newStatus[cNum];
		iS = {...iS, [cN]: true};
		newStatus[cNum] = iS;
		this.setState({
			...this.state,
			status: newStatus
		});
	};

	handleBlue = (e) => {
		let cN = e.target.className.split("-")[0], cNum = +e.target.className.split("-")[1];
		let newStatus = this.state.status;
		let iS = newStatus[cNum];
		let newGiftItem = this.state.giftItem;
		let item = newGiftItem[cNum];
		if (cN === "item_url" && (((e.target.value).indexOf("http://")) === -1)) {
			item = {...item, [cN]: "http://" + e.target.value};
		} else {
			item = {...item, [cN]: e.target.value};
		}
		iS = {...iS, [cN]: false};
		newGiftItem[cNum] = item;
		newStatus[cNum] = iS;
		return this.setState({
			...this.state,
			status: newStatus,
			giftItem: newGiftItem
		});
	};

	//提交
	goSubmit = (dateReleased, datePurchase, name, phone, notice) => {
		let self = this;
		let {giftItem, nowYear, nowMonth, nowDay} = self.state;
		let nowD = nowYear + "-" + nowMonth + "-" + nowDay;
		if (dateReleased === "" || (new Date(dateReleased).getTime()) <= (new Date(nowD).getTime())) {
			tip.show({msg: "请选择交付日期且交付日期必须大于当前日期~"});
			return
		}
		if (datePurchase === "" || (new Date(datePurchase).getTime()) <= (new Date(nowD).getTime())) {
			tip.show({msg: "请选择采购日期且采购日期必须大于当前日期~"});
			return
		}
		if ((new Date(dateReleased).getTime()) < (new Date(datePurchase).getTime())) {
			tip.show({msg: "商品采购时间不能大于或等于商品交付时间~"});
			return
		}
		if (!name.trim()) {
			tip.show({msg: "请填写联系人~"});
			return
		}
		if (!/^[\u4e00-\u9fa5_a-zA-Z0-9 ]+$/.test(name)) {
			tip.show({msg: "联系人姓名只能由中英文、数字、空格和下划线组成~"});
			return
		}
		if (phone === "") {
			tip.show({msg: "请填写电话号码~"});
			return
		}
		if (!(/^1[34578]\d{9}$/.test(phone))) {
			tip.show({msg: "请填写正确的电话号码~"});
			/* || (/^0\d{2,3}-\d{5,9}(-\d{1,4})?$/.test(phone.trim())))*/
			return
		}
		axios.request({
			...pageApi.purchaseAdd, data: {
				items: giftItem,
				delivery_time: dateReleased,
				purchase_time: datePurchase,
				purchase_contact: name,
				purchase_phone: phone,
				remark: notice
			}
		}).then(result => {
			timer = setTimeout(function () {
				browserHistory.push(`${DIR}/qyg`);
			}, 3000)
		}).catch(error => {
			console.error(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		});
	};

	render() {
		let {giftItem, goNext, tipStatus, status} = this.state;
		let len = giftItem.length;
		let style = {
			height: "40px",
			lineHeight: "40px",
			background: "#ff8888",
			color: "#fff",
			paddingLeft: "40px"
		};
		let giftHtml = giftItem.map((item, i) => {
			return <GiftsDetail key={i}
								item={item}
								i={i}
								len={len}
								{...this.state}
								giftItem={giftItem[i]}
								status={status[i]}
								delateItem={this.delateItem}
								handleItem={this.handleItem}
								handleCloseItem={this.handleCloseItem}
								handleFocus={this.handleFocus}
								handleBlue={this.handleBlue}
								delateImg={this.delateImg}
								upLoadImg={this.upLoadImg}/>
		});
		return <div data-page="gifts-custom" className="gifts-custom" style={{minHeight: $(window).height()}}>
			{this.state.load ?
				<loadingRound />
				:
				goNext ? <div style={{height: firH, position: "relative", overflow: "hidden"}}>
					{tipStatus && <div><img src="/src/img/giftscustom/tip.png" className="tip-img"/>
						<div style={style} className="tip">温馨提示：您有必填选项未填写，请填写后提交</div>
					</div>}
					<div style={{height: firH, overflow: "scroll", padding: "10px"}} ref="giftWrapper">
						{giftHtml}
						{giftItem.length >= 10 ? "" : <div className="add-button" onClick={this.addGift}>
							<img src="/src/img/giftscustom/add-item.png"/>
						</div>}
					</div>
					<div className="submit">
						<button className="btn-next" onClick={this.goNext}>下一步</button>
					</div>
				</div> : <RelationDetail submit={this.goSubmit}/>}
		</div>
	}
}

export function giftsCustomState(state, props) {
	return {
		...state.global
	}
}

export default connect(giftsCustomState)(GiftsCustom)

class GiftsDetail extends Component {

	componentDidMount() {
		let self = this;
		mySwiper = new Swiper(this.refs.swiperNav, {
			observer: true,
			freeMode: true,
			slidesPerView: 'auto',
		});
	}

	render() {
		let {item, i, giftItem, status, len} = this.props;
		let {delateImg, delateItem, handleItem, handleFocus, handleBlue, handleCloseItem, upLoadImg} = this.props;
		let GImg = giftItem["images"].map((item, index) => {
			return <li key={index} className="each-img swiper-slide">
				<img src={item} className="img"/>
				<img src="/src/img/giftscustom/cut.png" className="cut" onClick={() => {
					delateImg(i, index)
				}}/>
			</li>
		});
		let style = i === 9 ? {marginBottom: "65px"} : {marginBottom: "10px"};
		return (
			<div className="c-fs15 c-c35 gift" style={style}>
				<p className="gift-title">商品信息
					{len !== 1 && <i className="close" id={`close${i}`} onClick={delateItem}>×</i>}
				</p>
				<div className="gift-detail">
					<label className="each-one"><i className={`sign1${i}`}>商品名称</i>
						<i className={`sign1${i}`}>*</i>
						{status["item_name"] && giftItem["item_name"] ?
							<img src="/src/img/giftscustom/close.png" className={`item_name-${i}`}
								 onTouchStart={handleCloseItem}/> : "" }
						<input type="text" placeholder="请输入商品名称" maxLength="50" className={`item_name-${i}`}
							   onChange={handleItem}
							   onBlur={handleBlue} onFocus={handleFocus} value={giftItem["item_name"]}/>
					</label>
					<label className="each-one">商品型号
						{status["item_model"] && giftItem["item_model"] ?
							<img src="/src/img/giftscustom/close.png" className={`item_model-${i}`}
								 onTouchStart={handleCloseItem}/> : ""}
						<input type="text" placeholder="请输入商品型号" className={`item_model-${i}`}
							   style={{marginLeft: "0.65rem"}}
							   onChange={handleItem}
							   onBlur={handleBlue}
							   onFocus={handleFocus} value={giftItem["item_model"]}/>
					</label>
					<label className="each-one"><i className={`sign2${i}`}>采购预算</i>
						<i className={`sign2${i}`}>*</i>
						{status["budget_amount"] && giftItem["budget_amount"] ?
							<img src="/src/img/giftscustom/close.png" className={`budget_amount-${i}`}
								 onTouchStart={handleCloseItem}/> : ""}
						<input type="text" placeholder="¥" className={`budget_amount-${i}`} onChange={(e) => {
							$(`.budget_amount-${i}`).val((e.target.value).replace(/\D/g, ''));
							handleItem(e);
						}}
							   onBlur={handleBlue}
							   onFocus={handleFocus} value={giftItem["budget_amount"]}/>
					</label>
					<label className="each-one"><i className={`sign3${i}`}>采购数量</i>
						<i className={`sign3${i}`}>*</i>
						{status["purchase_quantity"] && giftItem["purchase_quantity"] ?
							<img src="/src/img/giftscustom/close.png" className={`purchase_quantity-${i}`}
								 onTouchStart={handleCloseItem}/> : ""}
						<input type="text" placeholder="请输入采购数量" className={`purchase_quantity-${i}`} onChange={(e) => {
							$(`.purchase_quantity-${i}`).val((e.target.value).replace(/\D/g, ''));
							handleItem(e);
						}}
							   onBlur={handleBlue}
							   onFocus={handleFocus} value={giftItem["purchase_quantity"]}/>
					</label>
					<label className="each-one">商品链接
						{status["item_url"] && giftItem["item_url"] ?
							<img src="/src/img/giftscustom/close.png" className={`item_url-${i}`}
								 onTouchStart={handleCloseItem}/> : ""}
						<input type="text" placeholder="请输入该商品在网站的链接" className={`item_url-${i}`}
							   style={{marginLeft: "0.65rem"}}
							   onChange={handleItem}
							   onBlur={handleBlue}
							   onFocus={handleFocus} value={giftItem["item_url"]}/>
					</label>
					<div data-plugin="swiper" className="img-detail">
						<p className="image-title">商品图片</p>
						<div className="swiper-container" ref="swiperNav">
							<ul className="swiper-wrapper">
								{GImg}
								{giftItem["images"].length < 6 && <li className="swiper-slide each-img">
									{ status["loading"] && <img src="/src/img/home/loading.gif" className="loading"/> }
									{!status["loading"] && <form className="image-load" id={i}>
										<input type="file" name="file" accept="image/*" onChange={upLoadImg}
											   className={i}/>
										<img src="/src/img/giftscustom/add-photo.png"/>
										<p className="c-fs15 c-c999">{giftItem["images"].length} / 6</p>
									</form>}</li>}
							</ul>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

class RelationDetail extends Component {
	constructor(props) {
		super(props);
		let date = new Date();
		this.state = {
			shadySlide: false,
			dateSlideIn: false,

			nowYear: date.getFullYear(),
			nowMonth: date.getMonth() + 1,
			nowDay: date.getDate(),

			dayArr: this.dayGenerator(date.getFullYear(), date.getMonth() + 1),

			yearInit: this.getInit("year"),
			monthInit: date.getMonth(),
			dayInit: date.getDate(),

			yearCnt: 0,
			monthCnt: 0,
			dayCnt: 0,

			dateReleased: "",
			datePurchase: "",
			flag: 0,
			status1: false,
			status2: false,
			status3: false,
			name: "",
			phone: "",
			notice: ""
		}
	}

	changeState = (stateName) => {
		this.setState(stateName);
	};

	//初始化swiper
	initSwiper = () => {
		if (daySwiper) {
			daySwiper.destroy()
		}
		if (monthSwiper) {
			monthSwiper.destroy()
		}
		if (yearSwiper) {
			yearSwiper.destroy()
		}
		let {yearInit, monthInit, dayInit, yearCnt, monthCnt, dayCnt} = this.state;
		let self = this;
		let daySwiper = new Swiper(".day-container", {
			preventClicks: true,
			direction: 'vertical',
			slideToClickedSlide: true,
			slidesPerView: 3,
			centeredSlides: true,
			initialSlide: dayInit - 1,
		});
		let monthSwiper = new Swiper(".month-container", {
			preventClicks: true,
			direction: 'vertical',
			slideToClickedSlide: true,
			slidesPerView: 3,
			centeredSlides: true,
			initialSlide: monthInit,
			onSlideChangeEnd: function (swiper) {
				if (monthCnt > 0) {
					let {year, month, day} = self.getSelTime(); //获取当前swiper选择的年月日
					let dayArr = self.dayGenerator(year, month);
					let dayNum = self.getDayNum(year, month);
					self.setState({dayArr: dayArr}, function () {
						daySwiper.updateSlidesSize();
						if (!day || day > dayNum) {
							daySwiper.slideTo(dayNum - 1, 200, true); //不存在的日期，回滚到当前月最后一天
						}
					});
				}
				monthCnt++
			}
		});
		let yearSwiper = new Swiper(".year-container", {
			preventClicks: true,
			direction: 'vertical',
			slideToClickedSlide: true,
			slidesPerView: 3,
			centeredSlides: true,
			initialSlide: yearInit,
			onSlideChangeEnd: function (swiper) {
				if (yearCnt > 0) {
					let {year, month, day} = self.getSelTime(); //获取当前swiper选择的年月日
					let dayArr = self.dayGenerator(year, month);
					let dayNum = self.getDayNum(year, month);
					self.setState({dayArr: dayArr}, function () {
						daySwiper.updateSlidesSize();
						if (!day || day > dayNum) {
							daySwiper.slideTo(dayNum - 1, 200, true); //不存在的日期，回滚到当前月最后一天
						}
					});
				}
				yearCnt++;
			}
		});
	};

	//初始化选择日期
	getInit = (data) => {
		let date = new Date();
		let nowYear = date.getFullYear();
		if (data === "year") {
			for (let i = 1950, j = 0; i < 2066; i++, j++) {
				if (i === nowYear) {
					return j;
				}
			}
		}
	};

	//获取当前选择swiper选择的年月日值
	getSelTime = () => {
		return {
			year: parseInt($(".year-container .swiper-slide-active").text().split("年")[0]),
			month: parseInt($(".month-container .swiper-slide-active").text().split("月")[0]),
			day: parseInt($(".day-container .swiper-slide-active").text().split("日")[0])
		}
	};

	//判断当前年月下的天数
	getDayNum = (year, month) => {
		let dayNum;
		switch (month) {
			case 1:
			case 3:
			case 5:
			case 7:
			case 8:
			case 10:
			case 12:
				dayNum = 31;
				break;
			case 4:
			case 6:
			case 9:
			case 11:
				dayNum = 30;
				break;
			case 2:
				dayNum = (( year % 4 == 0 && year % 100 != 0) || year % 400 == 0) ? 29 : 28;
				break;
		}
		return dayNum;
	};

	//生成包含当前年月下的天数数组
	dayGenerator = (year, month) => {
		let dayArr = [],
			dayNum = this.getDayNum(year, month);
		for (let i = 1; i <= dayNum; i++) {
			dayArr.push(i);
		}
		return dayArr;
	};

	//选择交付日期
	chooseDateReleased = (flag) => {
		// this.initSwiper();
		this.setState({shadySlide: true, dateSlideIn: true, flag: flag});
	};

	render() {
		let {shadySlide, dateSlideIn, dayArr, dateReleased, datePurchase, flag, name, phone, status1, status2, notice} = this.state;
		return (
			<div className="relation-detail" style={{height: firH, position: "relative", overflow: "hidden"}}>
				<div className={`shady ${shadySlide ? '' : 'c-dpno'}`} style={{height: $(window).height()}}
					 onClick={() => {
						 this.changeState({shadySlide: false, dateSlideIn: false})
					 }}></div>
				<ChooseData shadySlide={shadySlide} dateSlideIn={dateSlideIn} dayArr={dayArr} flag={flag}
							changeState={this.changeState} initSwiper={this.initSwiper}
							dayGenerator={this.dayGenerator}/>
				<div className="date-choose">
					<ul className="date1 c-fs15 c-c35" onClick={() => {
						this.chooseDateReleased(1)
					}}>
						<li className="c-fl">交付日期<i className="sign2">*</i></li>
						<li className="c-fr">{dateReleased || "请选择"}
							<img src="/src/img/giftscustom/trArror.png"/></li>
					</ul>
					<ul className="date1 c-fs15 c-c35" style={{borderBottom: "none"}} onClick={() => {
						this.chooseDateReleased(2)
					}}>
						<li className="c-fl">采购日期<i className="sign2">*</i></li>
						<li className="c-fr">{datePurchase || "请选择"}
							<img src="/src/img/giftscustom/trArror.png"/></li>
					</ul>
				</div>
				<div className="gift-detail">
					<label className="each-one">联系人
						<i className="sign2">*</i>
						{status1 && name && <img src="/src/img/giftscustom/close.png" onTouchStart={() => {
							this.setState({name: "", status1: false})
						}}/>}
						<input type="text" placeholder="请输入采购联系人" value={name} maxLength="30" onChange={(e) => {
							this.setState({name: e.target.value, status1: true})
						}} onFocus={() => {
							this.setState({status1: true})
						}} onBlur={() => {
							this.setState({status1: false})
						}}/>
					</label>
					<label className="each-one">电话
						<i className="sign2">*</i>
						{status2 && phone && <img src="/src/img/giftscustom/close.png" onTouchStart={() => {
							this.setState({phone: "", status2: false})
						}}/>}
						<input type="text" placeholder="建议填写手机号，客服将联系您" value={phone} maxLength="11" className="phone"
							   style={{marginLeft: "0.9rem", width: "72%"}} onChange={(e) => {
							$(".phone").val((e.target.value).replace(/\D/g, ''));
							this.setState({phone: e.target.value, status2: true});
							{/*if (+e.target.value||"0") {
							 } else {
							 $(".phone").val((e.target.value).replace(/\D/g, ''));
							 }*/
							}

						}} onFocus={() => {
							this.setState({status2: true})
						}} onBlur={() => {
							this.setState({status2: false})
						}}/>
					</label>
					<div style={{position: "relative"}}>
						<p className="image-title">备注</p>
						<textarea className="text-area" maxLength="300" value={notice} onChange={(e) => {
							this.setState({notice: e.target.value})
						}}>
							</textarea>
						{!notice && <div className="place-holder c-fs14 c-cc9" onClick={() => {
							$(".text-area").focus()
						}}>
							<div>如有特殊需求，请给客户留言</div>
							<div>例如LOGO定制</div>
						</div>}
					</div>
				</div>
				<p className="c-fs12 c-c999 c-mt15 c-mb5">注：审核时间为48小时，法定节假日顺延</p>
				<p className="c-fs12 c-c999">企业专享热线：<span className="c-cgold">400-669-6610</span></p>
				<div className="submit">
					<button onClick={() => {
						this.props.submit(dateReleased, datePurchase, name, phone, notice)
					}}>提交
					</button>
				</div>
			</div>
		)
	}
}

//选择日期
class ChooseData extends Component {
	constructor(props) {
		super(props);
		let date = new Date();

		this.state = {
			nowYear: date.getFullYear(),
			nowMonth: date.getMonth() + 1,
			nowDay: date.getDate(),

		}
	}

	componentDidMount() {
		this.props.initSwiper();
	}

	//取消
	cancelDate = () => {
		this.props.changeState({shadySlide: false, dateSlideIn: false});
	};

	confirmDate = () => {
		let {flag} = this.props;
		let year = $(".year-container .swiper-slide-active").text().split("年")[0],
			month = $(".month-container .swiper-slide-active").text().split("月")[0],
			day = $(".day-container .swiper-slide-active").text().split("日")[0],
			dateVal = year + "-" + month + "-" + day;
		if (flag === 1) {
			this.props.changeState({dateReleased: dateVal, shadySlide: false, dateSlideIn: false})
		} else if (flag === 2) {
			this.props.changeState({datePurchase: dateVal, shadySlide: false, dateSlideIn: false})
		}
	};

	getYear = () => {
		let yearArr = [];
		for (let i = 1950; i < 2066; i++) {
			yearArr.push(i + "年");
		}
		return yearArr;
	};

	getMonth = () => {
		let monthArr = [];
		for (let i = 1; i <= 12; i++) {
			monthArr.push((i < 10 ? '0' + i : i) + "月");
		}
		return monthArr;
	};

	render() {
		let {dateSlideIn, dayArr} = this.props;
		let yearList = this.getYear().map(function (item, i) {
			return <div key={i} className="swiper-slide">
				<p className="each-year">{item}</p>
			</div>
		});
		let monthList = this.getMonth().map(function (item, i) {
			return <div key={i} className="swiper-slide"><p className="each-month">{item}</p></div>
		});
		let dayList = dayArr.map(function (item, i) {
			return <div key={i} className="swiper-slide"><p
				className="each-day">{(item < 10 ? "0" + item : item) + "日"}</p>
			</div>
		});
		return (
			<div className="animation-date">
				<div className={`choose-date ${dateSlideIn ? "animation1" : "animation2"}`}>
					<ul className="nav">
						<li className="cancel" onClick={this.cancelDate}>取消</li>
						<li className="confirm" onClick={this.confirmDate}>完成</li>
					</ul>
					<div className="fixed-line c-pa" style={{top: "110px"}}></div>
					<div className="fixed-line c-pa" style={{top: "180px"}}></div>
					<div className="date-content" data-plugin="swiper">
						<div className="swiper-container year-container">
							<div className="swiper-wrapper">
								{yearList}
							</div>
						</div>

						<div className="swiper-container month-container">
							<div className="swiper-wrapper">
								{monthList}
							</div>
						</div>

						<div className="swiper-container day-container">
							<div className="swiper-wrapper">
								{dayList}
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}


