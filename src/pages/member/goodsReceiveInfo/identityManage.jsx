import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import {Link, browserHistory} from 'react-router';
import {connect} from 'react-redux';
import {LoadingRound} from 'component/common';
import {tip} from 'component/modules/popup/tip/tip';
import {concatPageAndType, actionAxios} from 'js/actions/actions';
import {compress} from 'js/common/compressImage';
import {PopupModal} from 'component/modal';
import axios from 'js/util/axios';
import {WXAPI, DIR} from 'config/index';
import {handleId} from 'js/util/index';

import './addressAndIdentityInfo.scss';

//接口请求
const pageApi = {
	identityCardList: {url: `${WXAPI}/user/getIdentityCardList`, method: "get"}, //用户身份证列表
	getIdentityCardInfo: {url: `${WXAPI}/user/getIdentityCardInfo`, method: "get"}, //获取身份证详细信息
	certifyIdentityCard: {url: `${WXAPI}/user/certifyIdentityCard`, method: "get"}, //身份证认证
	modifyIdentityCard: {url: `${WXAPI}/user/modifyIdentityCard`, method: "post"}, //修改身份证
	removeIdentityCard: {url: `${WXAPI}/user/removeIdentityCard`, method: "get"}, //删除身份证
	addIdentityCard: {url: `${WXAPI}/user/addIdentityCard`, method: "post"}, //新增身份证
	uploadImage: {url: `${WXAPI}/uploadImage`, method: "post"}, //上传图片

};

let isCertify, firH;
const orderConfirmActions = concatPageAndType("orderConfirm");
export default class IdentityManage extends Component {
	constructor(props) {
		super(props);
		let {id, is_certify, from, status} = props.location.query;
		this.state = {
			cardId: id,
			update: false,
			isAdd: true,
			identityData: [],
			idData: "",
			from: from,
			status: status
		};
		this.showMsg = "";
		isCertify = is_certify;
	}

	componentWillMount() {
		let self = this;
		let {cardId} = self.state;
		if (cardId) {
			self.editorIddentity(cardId);
		} else {
			this.getIDList();
		}
	}

	componentDidMount() {
		firH = $(window).height();
	}

	//获取身份列表
	getIDList = () => {
		let self = this;
		let {pathname, search} = this.props.location;
		axios.request({...pageApi.identityCardList}).then(({data}) => {
				if (data.code === 401) {
					browserHistory.replace(`${DIR}/login?redirect_uri=${ encodeURIComponent(pathname + search)}`);
					return;
				}
				self.setState({update: true, identityData: data.data, isAdd: true});
				$("#identity-manage").css({minHeight: $(window).height()});
			}
		).catch(error => {
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		})
	};


	//新增身份证
	addIdentity = () => {
		let {identityData} = this.state;
		if (identityData.card.count < 20) {
			this.setState({isAdd: false, idData: ""});
		} else {
			//	提示
			tip.show({msg: "亲~身份证不能超过20条哦"});
		}
	};

	//编辑身份证
	editorIddentity = (card_id, is_certify) => {
		let self = this;
		axios.request({...pageApi.getIdentityCardInfo, params: {card_id: card_id}}).then(({data}) => {
				self.setState({update: true, idData: data.data.card, isAdd: false, is_certify: is_certify});
			}
		).catch(error => {
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		})
	};

	//改变from
	changeFrom = () => {
		this.setState({from: "1", isAdd: true})
	};

	render() {
		let {update, isAdd, identityData, idData, cardId, from, status} = this.state;
		let flag = (isCertify == 0 || isCertify == 1) ? true : false;
		document.title = from ? (from === "2" ? "添加身份证信息" : isAdd && from === "1" ? "选择身份证信息" : "编辑身份证信息") : "身份证管理";
		//from 1:有地址，展示身份证列表模块  2:展示新增/编辑身份证页面模块
		return (
			update ?
				<div data-page="identity-manage">
					<section id="identity-manage" ref="identity-manage">
						{(from === "2" ? isAdd = false : isAdd) ? <div>
							<IdentityList identityData={identityData} fn={this.editorIddentity} fn1={this.getIDList}
										  from={from}
										  status={status}/>
							<button className="add-identity" onClick={this.addIdentity}>添加身份证信息</button>
						</div>
							: <IdentityManageEditor idData={idData} cardId={cardId} fn={this.getIDList}
													is_certify={(isCertify == 0 || isCertify == 1) ? isCertify : this.state.is_certify}
													flag={flag} changeFrom={this.changeFrom} from={from}/> }
					</section>
				</div>
				: <LoadingRound />
		)
	}
}

//身份证列表
class IdentityList extends Component {
	render() {
		let {identityData, fn, fn1, from, status} = this.props;
		let list = identityData.card.data.map(function (item, i) {
			return <div key={i}>
				<OneListConnect item={item} fn={fn} fn1={fn1} from={from} status={status}/>
			</div>
		});
		return (
			!identityData.card.count ?
				<div className="id-addressImg">
					<img src="../src/img/addressAndIdentityInfo/trIdAddress.png"/>
				</div>
				: <div className="id-address">
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
			showModal: false
		};
		this.msg = ""
	}

	//删除身份证信息
	deleteId = () => {
		this.setState({showModal: true});
	};

	closeModal = () => {
		this.setState({showModal: false})
	};
	sureCloseModal = () => {
		let {item} = this.props;
		axios.request({...pageApi.removeIdentityCard, params: {card_id: item.card_id}}).then(
			({data}) => {
				this.props.fn1();
			}
		).catch(error => {
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		})
	};

	//马上认证
	goCertify = () => {
		let {item} = this.props;
		axios.request({...pageApi.certifyIdentityCard, params: {card_id: item.card_id}}).then(({data}) => {
				this.props.fn1();
			}
		).catch(error => {
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		})
	};

	render() {
		let {item, from, listSelect, status, fn} = this.props;
		let {showModal} = this.state;
		return (
			<div>
				{from ? <SelectIdentityItem data={item} from={from} listSelect={listSelect} status={status}
											goCertify={this.goCertify} fn={fn}/> :
					<div className="wrapper" onClick={ this.props.listSelect }>
						<div className="c-fs14 c-c35 address-info">
							<span className="name">{item.name}</span>
							{item.is_certify ? <span>
								<img src="/src/img/addressAndIdentityInfo/trcAuthenticated.png" className="is-certify"/>
								<span className="no-certify c-c616">已认证</span></span>
								: <span>
								<img src="/src/img/addressAndIdentityInfo/trcUnAuthenticated.png"
									 className="is-certify"/>
								<span className="no-certify c-c999">未认证</span></span>}
							<div className="c-mb15">
								<span className="c-mr15">身份证号</span>
								<span>{handleId(item.id_number)}</span>
								{/*<img style={{width:"20px",height:"20px"}} src={item.face && item.inverse ? "../src/img/addressAndIdentityInfo/trChooseGreen.png" : "../src/img/addressAndIdentityInfo/trUnChooseGray.png"}
								 className="choose"/>*/}
								<div
									className="c-fs12 c-c666 default-address c-mt5">{item.face && item.inverse ? "已上传身份证照片" : "未上传身份证照片"}</div>
							</div>
						</div>
						<div className="ctrl-btn">
							<span className="btn">
								{!item.is_certify && <button className="c-ml10" onClick={(e) => {
									e.stopPropagation();
									this.goCertify()
								}}>去认证</button>}
								<button className="c-ml10" onClick={(e) => {
									e.stopPropagation();
									this.deleteId(item.card_id)
								}}>删除</button>
						<button className="c-ml10" onClick={(e) => {
							e.stopPropagation();
							this.props.fn(item.card_id, item.is_certify)
						}}>编辑</button>
					</span>
						</div>
						<PopupModal active={showModal} msg="确认删除身份证？" onClose={this.closeModal}
									onSure={this.sureCloseModal}/>
					</div>}

			</div>
		)
	}
}

class SelectIdentityItem extends Component {
	render() {
		let {data, from, status} = this.props, self = this;
		return <div className="one-list">
			<div className="list-info">
				<div className="text" onClick={ this.props.listSelect }>
					<div className="top">{ data.name }
						{data.is_certify ?
							<img src="/src/img/addressAndIdentityInfo/is_certify.png" className="is-certify"/> :
							<span className="c-fs12 c-cc9" style={{fontWeight: "normal"}}><img
								src="/src/img/addressAndIdentityInfo/trcUnAuthenticated.png"
								className="is-not-certify"/>未认证</span> }
					</div>
					<div className="main">身份证号 <span className="c-fs15 c-fb">{ handleId(data.id_number) }</span></div>
				</div>
				<button className="edit" onClick={() => {
					self.props.fn(data.card_id, data.is_certify)
				}}>
					<i className="edit-icon"> </i>
				</button>
			</div>
			<div className={`list-status ${ data.face && data.inverse ? 'success' : ( status === "true" ? 'error' : 'warn' ) }`}>
				<i> </i>
				{ data.face && data.inverse ? '已上传身份证照片' : ( status === "true" ? '您购买的是海淘商品，请上传身份证照片' : '未上传身份证照片' )}
				{!data.is_certify && <span className="no-certify c-fs12 c-cdred c-fr" onClick={(e) => {
					e.stopPropagation();
					self.props.goCertify(data.card_id, self.props);
				}
				}>去认证</span>
				}
			</div>
		</div>
	}
}

function oneListDispatch(dispatch, props) {
	return {
		listSelect: () => {
			if (props.from === "1" || props.from === "2") {
				if (!props.item.face && props.status == "true") {
					tip.show({msg:'您购买的是海淘商品，请上传身份证照片'});
					return;
				}
				dispatch(orderConfirmActions('selectIdentify', {data: props.item}));
				setTimeout(() => {
					browserHistory.goBack();
				}, 500);
			}
		}
	}
}

const OneListConnect = connect(null, oneListDispatch)(EachList);

//身份证编辑页面
class IdentityManageEditor extends Component {
	constructor(props) {
		super(props);
		this.state = {
			realName: "",
			idNumber: "",
			idImgFront: "",
			idImgBack: "",
			card_id: "",
			photoFSuc: false,
			photoBSuc: false,
			isEditor: false,
			imgFront: false,
			imgBack: false,
			isSave: false,
			upload: true,
		};
		this.showMsg = ""
	}

	//填写姓名
	handleName = (e) => {
		this.setState({realName: e.target.value});
	};

	//填写身份证号码
	handleIdNumber = (e) => {
		this.setState({idNumber: e.target.value});
	};

	//保存身份信息
	handleSaveIdCard = () => {
		let self = this;
		let {realName, idNumber, isEditor, card_id, idImgFront, idImgBack,_idImgFront,_idImgBack} = self.state;
		let {cardId} = self.props;
		//判断是否上传了身份证（正反面都有）
		if ((idImgFront !== "" && idImgBack !== "") || (idImgFront === "" && idImgBack === "")) {
			axios.request(isEditor ? {
				...pageApi.modifyIdentityCard,
				data: {
					card_id: card_id,
					name: realName,
					idNumber: idNumber,
					face: _idImgFront,
					inverse: _idImgBack
				}
			} : {
				...pageApi.addIdentityCard, data: {
					card_id: '',
					name: realName,
					idNumber: idNumber,
					face: _idImgFront,
					inverse: _idImgBack
				}
			}).then(
				({data}) => {
					if (cardId) {
						setTimeout(function () {
							window.history.go(-1);
						}, 1000)
					} else {
						setTimeout(function () {
							self.props.fn();
						}, 1000)
					}
					if (self.props.from) {
						self.props.changeFrom();
					}
				}
			).catch(error => {
				console.log(error);
				tip.show({msg: error.response.data.message || '服务器繁忙'});
			})

		} else if (idImgFront !== "" && idImgBack === "") {
			this.setState({isSave: false});
			tip.show({msg: "请上传身份证照片"});
		} else if (idImgFront === "" && idImgBack !== "") {
			this.setState({isSave: false});
			tip.show({msg: "请上传身份证照片"});
		}
	};

	componentDidMount() {
		let self = this;
		let {idData} = this.props;
		if (idData) {
			self.handleIdentityData();
			self.setState({isEditor: true});
		}
	}

	//处理身份信息
	handleIdentityData = () => {
		let {idData} = this.props;
		if (idData.face.complete_url !== "" && idData.inverse.complete_url !== "") {
			this.setState({imgFront: true, imgBack: true})
		} else if (idData.face.complete_url === "" && idData.inverse.complete_url !== "") {
			this.setState({imgFront: false, imgBack: true})
		} else if (idData.face.complete_url !== "" && idData.inverse.complete_url === "") {
			this.setState({imgFront: true, imgBack: false})
		}
		this.setState({
			card_id: idData.card_id,
			realName: idData.name,
			idNumber: idData.id_number,
			idImgFront: idData.face.complete_url,
			_idImgFront: idData.face.url,
			idImgBack: idData.inverse.complete_url,
			_idImgBack: idData.inverse.url
		});
	};

	//删除身份证正面图片
	handleFrontImg = (e) => {
		e.stopPropagation();
		this.setState({imgFront: false, idImgFront: ""})
	};
	//删除身份证反面图片
	handleBackImg = (e) => {
		e.stopPropagation();
		this.setState({imgBack: false, imgBack: false, idImgBack: ""})
	};

	//图片上传
	upLoadImg = async (e) => {
		let cName = e.target.className, files;
		if (e.target.className === "upLoadFrontImg") {
			files = $("#uploadFrontForm")[0].firstChild.files;
			this.setState({photoFSuc: true})
		} else {
			files = $("#uploadBackForm")[0].firstChild.files;
			this.setState({photoBSuc: true})
		}

		if (!/^image\/(jpg|png|jpeg|bmp)$/.test(files[0].type)) {
			tip.show({msg: "亲，请上传jpg/png/jpeg/bmp格式的图片哦~"});
		}
		if (!files.length) return;
		let file = Array.prototype.slice.call(files)[0];
		let photoData = await compress(file);
		this.upLoadAjax(photoData, cName);
	};

	upLoadAjax = (basestr, cName) => {
		let self = this;
		axios.request({...pageApi.uploadImage, data: {img: basestr,private:true}}).then(
			({data}) => {
				if (cName === "upLoadFrontImg") {
					self.setState({
						idImgFront: data.data.file.complete_url,
						_idImgFront: data.data.file.url,
						imgFront: true,
						photoFSuc: false
					})
				} else {
					self.setState({
						idImgBack: data.data.file.complete_url,
						_idImgBack: data.data.file.url,
						imgBack: true,
						photoBSuc: false
					})
				}
			}
		).catch(error => {
			self.setState({
				photoFSuc: false
			});
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		})
	};

	render() {
		let {idImgFront, idImgBack, isEditor, imgFront, imgBack, realName, idNumber, photoFSuc, photoBSuc} = this.state;
		let encryptId = idNumber.substr(0, 4) + "**********" + idNumber.substring(idNumber.length - 4);
		return (
			<div>
				<div className="identity-manageEditor">
					<p className="id-msg">身份证信息(必填)</p>
					{this.props.flag ? (!Number(this.props.is_certify) ?
							<div>
								<input type="text" placeholder="请填写真实姓名" maxLength="12" className="name realName"
									   onChange={this.handleName}
									   value={realName}/>
								<input type="text" placeholder="请填写您的身份证号（将加密处理）" maxLength="18" className="id realId"
									   onChange={this.handleIdNumber}
									   value={idNumber}/>
							</div>
							:
							<div className="identityMsg c-c999">
								<p>{realName}</p>
								<p>{encryptId}</p>
							</div>
					) : (
						!isEditor ?
							<div>
								<input type="text" placeholder="请填写真实姓名" maxLength="12" className="name realName"
									   onChange={this.handleName}
									   value={realName}/>
								<input type="text" placeholder="请填写您的身份证号（将加密处理）" maxLength="18" className="id realId"
									   onChange={this.handleIdNumber}
									   value={idNumber}/>
							</div>
							: (!(this.props.is_certify) ?
								<div>
									<input type="text" placeholder="请填写真实姓名" maxLength="12" className="name realName"
										   onChange={this.handleName}
										   value={realName}/>
									<input type="text" placeholder="请填写您的身份证号（将加密处理）" maxLength="18"
										   className="id realId"
										   onChange={this.handleIdNumber}
										   value={idNumber}/>
								</div>
								:
								<div className="identityMsg c-c999">
									<p>{realName}</p>
									<p>{encryptId}</p>
								</div>
						))}
					<p className="id-msg"><span>身份证照片（选填）</span><a href='/goodsReceiveInfo/identityExample'
																   className="c-fr"><img
						src="/src/img/icon/point-notice-icon.png" className="point-notice"/>照片示例</a></p>
					<div className="id-img">
						<p className="tips">
							温馨提示：请上传原始比例的身份证正反面，请勿随意涂改，保证身份
							信息清晰显示，否则影响审核通过。
						</p>
						<div className="id">
							<div className="id-box id-front">
								<form id="uploadFrontForm">
									<input type="file" name="file" accept="image/*" onChange={this.upLoadImg}
										   className="upLoadFrontImg"/>
								</form>
								<i className="i1" style={{display: imgFront ? "none" : "block"}}> </i>
								<i className="i2" style={{display: imgFront ? "none" : "block"}}> </i>
								<span className="upload-span" style={{display: imgFront ? "none" : "block"}}>上传照片</span>
								{photoFSuc ? <span className="i0"> 图片上传中 </span> : ""}
								{imgFront ?
									<div style={{height: "81px"}}>
										<img className="idImg" src={idImgFront}/>
										<img className="idImg-delete"
											 src="../src/img/addressAndIdentityInfo/trDelete.png"
											 onClick={this.handleFrontImg}/>
									</div> : ""}
								{/*<div className="text">示例</div>*/}
							</div>
							<div className="id-box id-back">
								<form id="uploadBackForm">
									<input type="file" name="file" accept="image/*" onChange={this.upLoadImg}
										   className="upLoadBackImg"/>
									{ /*image/jpeg,image/jpg,image/png,image/bmp*/ }
								</form>
								<i className="i1" style={{display: imgBack ? "none" : "block"}}> </i>
								<i className="i2" style={{display: imgBack ? "none" : "block"}}> </i>
								<span className="upload-span" style={{display: imgFront ? "none" : "block"}}>上传照片</span>
								{photoBSuc ? <span className="i0"> 图片上传中 </span> : ""}
								{imgBack ?
									<div style={{height: "81px"}}>
										<img className="idImg" src={ idImgBack }/>
										<img className="idImg-delete"
											 src="../src/img/addressAndIdentityInfo/trDelete.png"
											 onClick={this.handleBackImg}/>
									</div> : ""}
							</div>
						</div>
						<ul className="sample-img">
							<li className="sample-left">
								<div className="text">示例</div>
								<img src="../src/img/addressAndIdentityInfo/IDCard1.png"/>
							</li>
							<li className="sample-right">
								<div className="text">示例</div>
								<img src="../src/img/addressAndIdentityInfo/IDCard2.png"/>
							</li>
						</ul>
					</div>
					<IdentityTips />
					<button className="identity-save" onClick={this.handleSaveIdCard}>保存</button>
				</div>
			</div>
		)
	}
}

//实名认证tip
class IdentityTips extends Component {
	render() {
		return (
			<div className="id-tips">
				<p className="title">为什么要上传身份证信息？</p>
				<div className="c-fs10 c-c80">
					<p>
						根据海关规定，购买跨境商品需进行实名认证，用于个人物品入境申报。请填写您真实的身份证相关信息，以确保您购买的商品顺利通过海关检查。
					</p>
					<p>
						泰然城承诺您的身份信息只用于办理跨境商品清关手续，不作他途使用，其他任何人均无法查看。
					</p>
				</div>
			</div>
		)
	}
}