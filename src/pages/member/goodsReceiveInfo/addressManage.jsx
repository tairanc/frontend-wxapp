import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import {Link, browserHistory} from 'react-router';
import {tip} from 'component/modules/popup/tip/tip';
import {connect} from 'react-redux';
import {LoadingRound} from 'component/common';
import {PopupModal, PopupTip} from 'component/modal';
import {concatPageAndType, actionAxios} from 'js/actions/actions';
import axios from 'js/util/axios';
import {WXAPI, DIR} from 'config/index';

import './addressAndIdentityInfo.scss';

//接口请求
const pageApi = {
	addressList: {url: `${WXAPI}/user/getAddressList`, method: "get"}, //用户地址列表
	getAddressDetail: {url: `${WXAPI}/user/getAddressDetail`, method: "get"}, //获取地址详细信息
	setDefaultAddress: {url: `${WXAPI}/user/setDefaultAddress`, method: "get"}, //设置默认地址
	removeAddress: {url: `${WXAPI}/user/removeAddress`, method: "get"}, //删除地址
	modifyAddress: {url: `${WXAPI}/user/modifyAddress`, method: "post"}, //修改地址
	addAddress: {url: `${WXAPI}/user/addAddress`, method: "post"}, //新增地址

};
let mySwiper, firH = $(window).height();
const orderConfirmActions = concatPageAndType("orderConfirm");
@connect(null, oneListDispatch)
export default class AddressManage extends Component {
	constructor(props) {
		super(props);
		let {id, from, name} = props.location.query;
		this.state = {
			addrId: id,
			update: false,
			addressData: [],
			isAdd: "",
			editorData: "",
			from: from
		};
		this.showMsg = "";
	}

	componentWillMount() {
		let self = this;
		let {addrId} = self.state;
		if (addrId) {
			axios.request({...pageApi.getAddressDetail, params: {address_id: addrId}}).then(
				({data}) => {
					self.handleEditorPage(false, data.data);
				}
			).catch(error => {
				console.log(error);
				tip.show({msg: error.response.data.message || '服务器繁忙'});
			})
		} else {
			this.getAddressList();
		}
	}

	//获取地址列表
	getAddressList = () => {
		let self = this;
		let {pathname, search, query: {name}} = this.props.location;
		axios.request({...pageApi.addressList}).then(({data}) => {
				if (data.data.data.length === 1 && self.state.from === "1" && self.state.goFlag) {//新用户，从订单页进来，编辑翻地址直接跳转订单页面
					self.props.listSelect(data.data.data[0], self.state.from, false, name);
				}
				self.setState({update: true, addressData: data.data, isAdd: true});
				$("#address-manage").css({minHeight: $(window).height()});
			}
		).catch(error => {
			console.log(error);
			if (error.response.status === 401) {
				browserHistory.replace(`${DIR}/login?redirect_uri=${ encodeURIComponent(pathname + search)}`);
				return;
			}
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		})

	};

	//新建地址
	addAddress = () => {
		let {addressData} = this.state;
		if (addressData.count < addressData.limitCount) {
			this.setState({isAdd: false, editorData: ""})
		} else {
			//	提示
			tip.show({msg: "亲~地址不能超过20条哦！"});
		}
	};

	//编辑地址
	handleEditorPage = (isAdd, data) => {
		this.setState({update: true, isAdd: isAdd, editorData: data});
	};

	//改变from
	changeFrom = () => {
		this.setState({from: "1", isAdd: true, goFlag: true})
	};


	render() {
		let {update, addressData, isAdd, editorData, addrId, from} = this.state;
		const {name} = this.props.location.query || '';
		document.title = from ? (from === "2" ? "添加收货地址" : isAdd && from === "1" ? "选择收货地址" : "编辑收货地址") : "地址管理";
		//from 1:有地址，展示地址列表模块  2:展示新增/编辑地址页面模块
		return (
			update ?
				<div data-page="address-manage">
					<section id="address-manage" ref="address-manage">
						{(from === "2" ? isAdd = false : isAdd) ? (
							<div>
								<AddressList addressData={addressData} fn={this.handleEditorPage}
											 getList={this.getAddressList}
											 from={from} name={name}/>
								<button className="add-address" onClick={this.addAddress}>添加收货地址</button>
							</div>
						) :
							(<AddressManageEditor editorData={editorData} addrId={addrId} fn={this.getAddressList}
												  changeFrom={this.changeFrom} from={from} addressData={addressData}/>)}
					</section>
				</div>
				: <LoadingRound />
		)
	}
}

//地址列表
class AddressList extends Component {
	render() {
		let {addressData, fn, getList, from, name} = this.props;
		let list = addressData.data.map(function (item, i) {
			return <div key={item.address_id}>
				<OneListConnect item={item} fn={fn} key={i} getList={getList} from={from} name={name}/>
			</div>
		});
		return (
			!addressData.count ?
				<div className="goods-addressImg">
					<img src="../src/img/addressAndIdentityInfo/trGoodsAddress.png"/>
				</div>
				: <div className="goods-address">
				<img src="../src/img/addressAndIdentityInfo/trBgStriae.png"/>
				{list}
			</div>
		)
	}
}

//单个地址
class EachList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			showModal: false,
			defaultC: true
		};
		this.showMsg = ""
	}

	//删除会员地址
	delateAddress = (e) => {
		/*let {item, getList} = this.props;
		 let target = e.currentTarget;
		 if ($(target).parent().parent().children().hasClass('bg1')) {
		 tip.show({msg: "默认地址不能删除哦~"});
		 } else {
		 this.setState({showModal: true});
		 }*/
		this.setState({showModal: true});
	};
	//默认地址修改
	handleDefaultAddress = (e) => {
		let target = e.currentTarget;
		let self = this;
		let {item, getList} = self.props;
		// self.setState({defaultC: false});
		axios.request({...pageApi.setDefaultAddress, params: {address_id: item.address_id}}).then(
			({data}) => {
				/*self.setState({defaultC: true});
				$(".ctrl-btn").removeClass("bg1").addClass("bg2");
				$(target).removeClass("bg2").addClass("bg1");*/
				getList();
			}
		).catch(error => {
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		})
	};
	//编辑地址
	editorAddress = (e) => {
		let self = this;
		let {item, fn} = self.props;
		e.stopPropagation();
		axios.request({...pageApi.getAddressDetail, params: {address_id: item.address_id}}).then(
			({data}) => {
				fn(false, data.data);
			}
		).catch(error => {
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		})
	};

	closeModal = () => {
		this.setState({showModal: false})
	};
	sureCloseModal = () => {
		let self = this;
		let {item, getList} = self.props;
		axios.request({...pageApi.removeAddress, params: {address_id: item.address_id}}).then(
			({data}) => {
				self.setState({showModal: false});
				getList();
			}
		).catch(error => {
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		})
	};

	render() {
		let {item, from, listSelect, name} = this.props;
		let {showModal, defaultC} = this.state;
		//截取地址
		return (
			<div>
				{from ? <SelectAddressItem data={item} from={from} listSelect={listSelect}
										   editorAddress={this.editorAddress} name={name}/> :
					<div className="wrapper">
						<div className="c-fs14 c-c35 address-info">
							<span className="name">{item.name}</span>
							<span className="phone-number">{item.mobile}</span>
							<p className="c-mb15 detail-address">{item.detail_address}</p>
						</div>
						<div style={{position: "relative"}}>
							<div className={item.is_default ? "ctrl-btn bg1" : "ctrl-btn bg2"} onClick={(e) => {
								e.stopPropagation();
								if (defaultC) {
									this.handleDefaultAddress(e)
								}
							}}>
								<span className="c-fs12 c-c666 default-address">默认地址</span>
							</div>
							<span className="btn">
					<button onClick={this.editorAddress}>编辑</button>
					<button className="delate-btn" onClick={e => {
						e.stopPropagation();
						this.delateAddress(e)
					}}>删除</button>
					</span>
						</div>
						<PopupModal active={showModal} msg="确认删除地址？" onClose={this.closeModal}
									onSure={this.sureCloseModal}/>
					</div>}
			</div>
		)
	}
}

class SelectAddressItem extends Component {
	render() {
		let {data, from, name} = this.props;
		return <div className="one-list">
			<div className="list-info" onClick={ () => {
				this.props.listSelect(data, from, false, name)
			} }>
				<div className="top">
					<span>{ data.name }</span> { data.mobile }
				</div>
				<div className="text">
					{ data.is_default ? <span>默认</span> : "" } {data.detail_address}
				</div>
			</div>
			<button className="edit" onClick={this.props.editorAddress}>
				<i className="edit-icon"> </i>
			</button>
		</div>
	}
}

function oneListDispatch(dispatch, props) {
	return {
		listSelect: (data, from, flag, name) => {
			if (from === "1" || from === "2") {
				dispatch(orderConfirmActions('selectAddress', {data: data, from: "address", name: name}));
				!flag && browserHistory.goBack();
			}
		}
	}
}

const OneListConnect = connect(null, oneListDispatch)(EachList);

//地址编辑
class AddressManageEditor extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isDefaultAddress: true,
			animalStatus: false,
			slideIn: false,
			chooseedAddress: "",
			addSucMsg: "",
			isEditor: false,
			rightName: false,
			rightNumber: false,
			rightaddress: false
		};
		this.showMsg = "";
	}

	//选择地址
	chooseAddress = () => {
		this.setState({animalStatus: true, slideIn: true});
	};

	//选择为默认地址
	handleDefaultAddress = () => {
		console.log(this.props);
		this.setState({isDefaultAddress: !this.state.isDefaultAddress})
	};

	//确定/取消地址选择
	confirmAnimal = (provincetxt, citytxt, countytxt, provinceId, cityId, countyId) => {
		if (countytxt) {
			this.setState({
				chooseedAddress: provincetxt + " " + citytxt + " " + countytxt,
				provinceId: provinceId,
				cityId: cityId,
				countyId: countyId
			})
		} else {
			this.setState({chooseedAddress: provincetxt + " " + citytxt, provinceId: provinceId, cityId: cityId})
		}
		this.setState({animalStatus: false, slideIn: false})
	};

	//保存地址
	saveNewAddress = () => {
		let self = this;
		let name = $(".people").val(), phoneNum = $(".phone").val(), address = $(".address").val();
		let {chooseedAddress, provinceId, cityId, countyId, isDefaultAddress, isEditor, address_id, rightName, rightNumber, rightaddress} = self.state;
		let {addrId} = self.props;
		let chooseRet = chooseedAddress.split(" ");
		let area = {};
		if (countyId) {
			area = {
				"province": {
					"code": provinceId,
					"text": chooseRet[0]
				},
				"city": {
					"code": cityId,
					"text": chooseRet[1]
				},
				"district": {
					"code": countyId,
					"text": chooseRet[2]
				}
			};
		} else {
			area = {
				"province": {
					"code": provinceId,
					"text": chooseRet[0]
				},
				"city": {
					"code": cityId,
					"text": chooseRet[1]
				}
			};
		}

		//是否默认地址
		let is_default;
		if (isDefaultAddress) {
			is_default = 1;
		} else {
			is_default = 0;
		}
		//判断输入信息是否正确
		if (!(/^[\u4E00-\u9FA5]+(·[\u4E00-\u9FA5]+)*$/).test(name) || name.length < 2) {
			tip.show({msg: "请输入正确的名字"});
		} else {
			if (!(/\d{11}/.test(phoneNum))) {
				tip.show({msg: "您输入的手机号有误"});
			} else {
				if (chooseedAddress.length === 0) {
					tip.show({msg: "请选择所在区域"});
				} else {
					if (address.length < 5 || address.length > 60) {
						tip.show({msg: "详细地址最少5个字，最多不能超多60个字"});
					} else {
						axios.request(isEditor ? {
							...pageApi.modifyAddress,
							data: {
								address_id: address_id,
								name: name,
								mobile: phoneNum,
								area: JSON.stringify(area),
								address: address,
								is_default: is_default
							}
						} : {
							...pageApi.addAddress, data: {
								address_id: "",
								name: name,
								mobile: phoneNum,
								area: JSON.stringify(area),
								address: address,
								is_default: is_default
							}
						}).then(
							({data}) => {
								if (addrId) {
									setTimeout(function () {
										window.history.go(-1);
									}, 1000)
								} else {
									setTimeout(function () {
										self.props.fn();
									}, 1000)
								}
								if (self.props.from) { //表示从订单页跳转到当前页面
									self.props.changeFrom();
								}
							}
						).catch(error => {
							console.log(error);
							tip.show({msg: error.response.data.message || '服务器繁忙'});
						})
					}
				}
			}
		}
	};

	componentDidMount() {
		let self = this;
		let {editorData} = self.props;
		if (editorData) {
			self.handleEditorData();
			//判断是否是编辑状态，设为true
			// this.setState({rightName: true, rightNumber: true, rightaddress: true})

		}
		$(".shady").click(function (e) {
			self.setState({animalStatus: false, slideIn: false})
		});
	}

	handleEditorData = () => {
		let {editorData} = this.props;
		let {province, city, district} = editorData.area;
		this.setState({
			address_id: editorData.address_id,
			chooseedAddress: province.text + " " + city.text + " " + district.text,
			isDefaultAddress: editorData.is_default,
			provinceId: province.code,
			cityId: city.code,
			countyId: district.code,
			isEditor: true
		});
		$(".phone").val(editorData.mobile);
		$(".address").val(editorData.address);
		$(".people").val(editorData.name);
	};
    clearCoutryId = () => {
        this.setState({countyId: ""});
	}

	render() {
		let {isDefaultAddress, animalStatus, slideIn, chooseedAddress} = this.state;
		let {editorData, addressData} = this.props;
		return (
			<div id="address-editor" ref="address-editor"
					 style={{overflow: "hidden", position: "relative", height: firH}}>
        <div className="shady" style={{display: slideIn ? "block" : "none", height: $(window).height()}}></div>
        <ChooseAddress animalStatus={animalStatus}
                       slideIn={slideIn} confirm={this.confirmAnimal}
                       clearCoutryId={this.clearCoutryId}/>
				<div>
					<div className="editor-info c-fs14">
						<span className="title">收货人</span>
						<input type="text" maxLength="12" className="people"/>
					</div>
					<div className="editor-info c-fs14">
						<span className="title">联系电话</span>
						<input type="text" className="phone" maxLength="11"/>
					</div>
					<div className="editor-info c-fs14" onClick={this.chooseAddress}>
						<span className="title">所在地区</span>
						<img src="../src/img/addressAndIdentityInfo/trArror.png" className="chooseImg"/>
						<p className="choose-addressA">{chooseedAddress}</p>
					</div>
					<div className="editor-info c-fs14">
						<textarea placeholder="如街道、小区、楼栋号、单元室等" className="address"/>
					</div>
					{editorData.is_default ? "" : <div className="default-choose">
						<img
							src={isDefaultAddress ? '../src/img/addressAndIdentityInfo/trChoose.png' : '../src/img/addressAndIdentityInfo/trUnChoose.png'}
							onClick={!!addressData.count && this.handleDefaultAddress}/>
						<span className="c-fs14 c-c666 c-ml30">设为默认地址</span>
					</div>}
					<button className="address-save" onClick={this.saveNewAddress}>保存</button>
				</div>
			</div>
		)
	}
}
//选择地址
export class ChooseAddress extends Component {
	constructor(props) {
		super(props);
		this.state = {
			provincetxt: "",
			cityData: [],
			cityTxt: "",
			countyData: [],
			countyTxt: "",
			cityClickAble: false,
			countyClickAble: false,
			confirmClickAble: false,
			isCounty: true
		}
	}

	componentWillMount() {
		let cityData = this.getCity("北京市");
		this.setState({provincetxt: "北京市", cityData: cityData, cityClickAble: "true", isCounty: false});
	}

	componentDidMount() {
		let self = this;
		//默认选中北京市
		$("#110100").addClass("active-one").siblings().removeClass("active-one");
		mySwiper = new Swiper(".swiper-container-address", {
			preventClicks: true,
			onSlideChangeStart: function (swiper) {
				self.handleActiveClass(swiper.activeIndex);
			},
		});
		//点击每个省
		$(".each-address").click(function (e) {
			let txt = this.innerText;
			let provinceId = $(this).attr("id");
			$(this).addClass("active-one").siblings().removeClass("active-one");
			mySwiper.slideTo(1, 300);
			//点击的同时获取城市数据
			let cityData = self.getCity(txt);
			self.setState({isCounty: false, countyData: []});
			mySwiper.update();
			if (txt === "北京市" || txt === "天津市" || txt === "上海市" || txt === "重庆市" || txt === "澳门") {
				self.setState({isCounty: false});
                self.handleCoutryId();//清空原来的countryId
				mySwiper.update();
			} else {
				self.setState({isCounty: true});
				// mySwiper.update();
			}
			self.setState({
				provincetxt: txt,
				provinceId: provinceId,
				cityData: cityData,
				cityClickAble: true,
				countyClickAble: false,
				cityTxt: "",
				countyTxt: "",
				confirmClickAble: false
			});
			$(".each-cityaddress").removeClass("active-one");
			$(".each-countyaddress").removeClass("active-one");
		});
	}
	handleCoutryId = () => {
		let clearCoutryId = this.props.clearCoutryId;
        typeof clearCoutryId == "function" ? clearCoutryId() : null;
	};
	//点击nav切换
	clickNavProvince = (e) => {
		let idName = $(e.target).attr("id");
		if ($(e.target).hasClass("active-one")) {

		} else {
			mySwiper.slideTo(idName, 300);
			$(e.target).addClass("active-one").siblings().removeClass("active-one");
		}
	};
	clickNavCity = (e) => {
		let idName = $(e.target).attr("id");
		let {cityClickAble} = this.state;
		if (cityClickAble) {
			if ($(e.target).hasClass("active-one")) {

			} else {
				mySwiper.slideTo(idName, 300);
				$(e.target).addClass("active-one").siblings().removeClass("active-one");
			}
		}
	};
	clickNavCounty = (e) => {
		let idName = $(e.target).attr("id");
		let {countyClickAble} = this.state;
		if (countyClickAble) {
			if ($(e.target).hasClass("active-one")) {

			} else {
				mySwiper.slideTo(idName, 300);
				$(e.target).addClass("active-one").siblings().removeClass("active-one");
			}
		}
	};

	//处理swiper滑动样式
	handleActiveClass = (index) => {
		if ($("#" + index).hasClass("active-one")) {

		} else {
			$("#" + index).addClass("active-one").siblings().removeClass("active-one");
		}
	};
	//获取城市数据
	getCity = (province) => {
		for (let i = 0; i < addressData.length; i++) {
			if (addressData[i].value == province) {
				return addressData[i].children;
			}
		}
	};
	//获取区县数据
	getCounty = (city) => {
		let {cityData} = this.state;
		if (cityData[0].children) {
			for (let i = 0; i < cityData.length; i++) {
				if (cityData[i].value == city) {
					return cityData[i].children;
				}
			}
		} else {
			//没有城市（）
			this.setState({countyTxt: ""})
		}
	};

	//点击每个城市
	clickCity = (e) => {
		let {cityData} = this.state;
		let parentId = cityData[0].parentId;
		let txt = e.target.innerText;
		let cityId = $(e.target).attr("id");
		$(e.target).addClass("active-one").siblings().removeClass("active-one");
		//点击的同时获取县数据
		let countyData = this.getCounty(txt);
		if (countyData) {
			this.setState({isCounty: true}, function () {
				mySwiper.update();
				mySwiper.slideTo(2, 300);
			});
		} else {
			this.setState({confirmClickAble: true, isCounty: false}, function () {
				this.confirm()
			});
		}
		this.setState({
			cityTxt: txt,
			cityId: cityId,
			countyData: countyData,
			countyClickAble: true,
			countyTxt: "",
			parentId: parentId
		});
		$(".each-countyaddress").removeClass("active-one");
	};
	//点击每个区县
	clickCounty = (e) => {
		let txt = e.target.innerText;
		let countyId = $(e.target).attr("id");
		$(e.target).addClass("active-one").siblings().removeClass("active-one");
		this.setState({countyTxt: txt, countyId: countyId}, function () {
			this.confirm();
		});
	};

	//确定
	confirm = () => {
		let {provincetxt, cityTxt, countyTxt, provinceId, cityId, countyId, confirmClickAble} = this.state;
		if (confirmClickAble || countyTxt) {
			this.props.confirm(provincetxt, cityTxt, countyTxt, provinceId, cityId, countyId);
		}
	};

	render() {
		let {animalStatus, slideIn} = this.props;
		let {provincetxt, cityData, cityTxt, countyTxt, countyData, cityClickAble, countyClickAble, confirmClickAble, isCounty} = this.state;
		let provinceData = addressData.map(function (item, i) {
			return <p key={i} className="each-address" id={item.id}>{item.value}</p>
		});
		return (
			<div className="animal-address">
				<div className={`choose-address ${animalStatus ? (slideIn ? "animal1" : "animal2") : ""}`}>
					<ul className="nav">
						<li className="active-one" id="0" onClick={this.clickNavProvince}>{provincetxt || "省份"}</li>
						<li id="1" onClick={this.clickNavCity}
							style={{color: cityClickAble ? "" : "#c9c9c9"}}>{cityTxt || "城市"}</li>
						{isCounty ?
							<li id="2" onClick={this.clickNavCounty}
								style={{color: countyClickAble ? "" : "#c9c9c9"}}>{countyTxt || "区县"}</li>
							: ""}
						<li className="confirm" onClick={this.confirm}
							style={{color: (confirmClickAble || countyTxt) ? "" : "#c9c9c9"}}>完成
						</li>
					</ul>
					<div className="address-content" data-plugin="swiper">
						<div className="swiper-container swiper-container-address">
							<div className="swiper-wrapper ">
								<div className="swiper-slide each-list">{provinceData}</div>
								<div className="swiper-slide each-list">
									<CityList data={cityData} fn={this.clickCity}/>
								</div>
								{isCounty ? <div className="swiper-slide each-list">
									<CountyList data={countyData || []} fn={this.clickCounty}/>
								</div> : ""}
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

//城市
class CityList extends Component {
	render() {
		let {data} = this.props;
		let cityList = data.map((item, i) => {
			return <p key={i} className="each-cityaddress" onClick={this.props.fn} id={item.id}>
				{item.value}
			</p>
		});
		return (
			<div>{cityList}</div>
		)
	}
}

//区县
class CountyList extends Component {
	render() {
		let {data} = this.props;
		let countyList = data.map((item, i) => {
			return <p key={i} className="each-countyaddress" onClick={this.props.fn} id={item.id}>
				{item.value}
			</p>
		});
		return (
			<div>{countyList}</div>
		)
	}
}

