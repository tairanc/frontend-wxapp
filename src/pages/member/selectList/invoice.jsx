import React, {Component} from 'react';
import {LoadingRound, Shady} from 'component/common';
import {connect} from 'react-redux';
import {Link, browserHistory} from 'react-router';
import {concatPageAndType, actionAxios, actionAxiosAll} from 'js/actions/actions'
import {PopupTip} from 'component/modal';
import PopupLoading from 'component/modules/popup/loading/PopupLoading';
import axios from 'js/util/axios';
import {WXAPI} from 'config/index'
import './invoice.scss';
import {tip} from "component/modules/popup/tip/tip";

const createActions = concatPageAndType('invoiceSelect');
const orderConfirmActions = concatPageAndType('orderConfirm');
const axiosActions = actionAxios('invoiceSelect');
const axiosAllActions = actionAxiosAll('invoiceSelect');

const mapTypeInvoice = {
	"common": "NORMAL",
	"tax": "VAT",
	"electron": "ELEC"
};
const invoiceTypeMap = {
    "NORMAL": "common",
    "VAT": "tax",
    "ELEC": "electron"
};
const mapInvoiceType = {
    "common": 1,
    "tax": 2,
    "electron": 3
};

const pageApi = {
	initPage: {url: `${WXAPI}/user/getUserInvoice`, method: "get"},
	invoiceSave: {url: `${WXAPI}/user/saveUserInvoice`, method: "post"}
};

class Invoice extends Component {
	constructor(props, context) {
		super(props);
	}

	componentWillMount() {
		if (this.props.confirmLoad) {
			browserHistory.goBack();
			return;
		}
		this.props.dispatch(orderConfirmActions('setOrigin', {origin: 'invoice'}));
		if (this.props.origin === "address") {
			this.props.setOrigin(createActions('setOrigin', {origin: ""}));
			return;
		}
		this.props.initialPage();

	}

	render() {
		let {winHeight, invoiceSelData, invoiceType, commonInvoice, commonInvoice_1, commonInvoice_2, electronInvoice, electronInvoice_1, electronInvoice_2, taxInvoice, taxInvoice_1, taxInvoice_2, invoiceContent, showModal, invoiceNote, userForm, addressForinvoice} = this.props,
			{changeType, changeStatus, modalSelect, modalCtrl, changeForm, selectAddress} = this.props;
		let invoiceAction = commonInvoice.postData.action
		let invoiceId = ''
		if(userForm && userForm.length > 0){
            switch (invoiceType) {
                case 'common':
                    invoiceAction = commonInvoice.postData.action
                    userForm.some((user) => {
                        if(user.type === 1 && user.action == invoiceAction){
                            invoiceId = user.invoice_id
                            return true
                        }
                    })
                    break
                case 'electron':
                    invoiceAction = electronInvoice.postData.action
                    userForm.some((user) => {
                        if(user.type === 3 && user.action == invoiceAction){
                            invoiceId = user.invoice_id
                            return true
                        }
                    })
                    break
                case 'tax':
                    invoiceAction = taxInvoice.postData.action
                    userForm.some((user) => {
                        if(user.type === 2 && user.action == invoiceAction){
                            invoiceId = user.invoice_id
                            return true
                        }
                    })
                    break
                default:
                    invoiceId = ''
                    break
            }
		}
		return <div data-page="invoice-select" style={{background: "#f4f4f4", minHeight: winHeight}}>
			{ this.props.load ? <LoadingRound/> : <form id="invoiceForm">
				{ this.props.update && <PopupLoading/> }
				<div className="invoice-note" onClick={ e => this.props.popupNote(true) }></div>
				{ invoiceNote && <PopupItem onClose={  e => this.props.popupNote(false) }/>}
				{ !!invoiceId && <input type="hidden" name="id" value={ invoiceId }/>}
				<InvoiceType data={ invoiceSelData } type={ invoiceType } changeType={ changeType }
							 name="type"/>
				{ invoiceType === "common" &&
				<CommonInvoice data={ commonInvoice } commonInvoiceOne={ commonInvoice_1 } commonInvoiceTwo={ commonInvoice_2 } changeStatus={ changeStatus.bind(null, "commonInvoice") }
							   modalCtrl={ modalCtrl } modalSelect={ modalSelect.bind(null, invoiceType + "Invoice") }
							   contentList={ invoiceContent }
							   showModal={ showModal } changeForm={ changeForm.bind(null, "commonInvoice") }/>
				}
				{ invoiceType === "electron" &&
				<ElectronInvoice data={ electronInvoice } electronInvoiceOne={ electronInvoice_1 } electronInvoiceTwo={ electronInvoice_2 } changeStatus={ changeStatus.bind(null, "electronInvoice") }
								 modalCtrl={ modalCtrl } modalSelect={ modalSelect.bind(null, invoiceType + "Invoice") }
								 contentList={ invoiceContent }
								 showModal={ showModal } changeForm={ changeForm.bind(null, "electronInvoice") }/>
				}
				{ invoiceType === "tax" &&
				<TaxInvoice data={ taxInvoice }
                            taxInvoiceOne={ taxInvoice_1 } taxInvoiceTwo={ taxInvoice_2 }
							changeForm={ changeForm.bind(null, "taxInvoice") }
							setOrigin={ this.props.setOrigin }
							selectAddress={ selectAddress }
                            addressForinvoice={ addressForinvoice }
				/>
				}
				<SubmitBtn formSubmit={ this.props.formSubmit }/>
			</form>
			}
			<PopupTip active={ this.props.prompt.show } msg={ this.props.prompt.msg }
					  onClose={ this.props.promptClose }/>
		</div>
	}
}

/*发票选择*/
class InvoiceType extends Component {
	getHtml() {
		let {data, type} = this.props;
		return data.map((item, i) => {
			return <span onClick={ item.able && this.props.changeType.bind(this, item.type) }
						 className={`type-li ${ type === item.type ? "active" : "" } ${ !item.able ? "disabled" : ""  }`}
						 key={i}>
				{ item.text }
				</span>
		})
	}

	getText() {
		let {data, type} = this.props;
		if (type === "electron") {
			return <div className="bottom">电子发票与纸制发票具备同等法律效力，可支持报销入账。</div>
		}
		if (type === "tax") {
			return <div className="bottom">※ 增值税发票在订单完成后开票。</div>
		}

	}

	render() {
		return <div className="invoice-type">
			<div className="title">发票类型</div>
			<input type="hidden" name={ this.props.name } value={ mapInvoiceType[this.props.type] }/>
			<div className="body">
				{ this.getHtml()}
			</div>
			{ this.getText() }
		</div>
	}
}

//普通发票
class CommonInvoice extends Component {
	render() {
		let {data, changeStatus, modalSelect, modalCtrl, contentList, showModal, changeForm, commonInvoiceOne, commonInvoiceTwo} = this.props;
		let commonData = data.postData.action === 1 ? commonInvoiceOne.postData : commonInvoiceTwo.postData
		return <div className="common-invoice">
			<InvoiceHeader serverData={ commonData } postData={ data.postData } inputHolder="请输入发票抬头" headName="action" contentName="title"
						   changeForm={ changeForm }/>
			<DivideLine/>
			<InvoiceContent modalSelect={ modalSelect } modalCtrl={ modalCtrl } postData={ data.postData }
							name="content_option"/>
			<InvoiceContentSelect modalSelect={ modalSelect } list={ contentList }
								  selectId={ data.postData.invoice_content } modalCtrl={ modalCtrl }
								  show={ showModal }/>
			{ data.postData.action === 2 &&
			<StripArray serverData={ commonData } data={ data.postData } status={ data.status } changeStatus={ changeStatus }
						changeForm={ changeForm }/> }
		</div>
	}
}


//电子发票
class ElectronInvoice extends Component {
    hasProperty = (name) => {
        let {data, electronInvoiceOne, electronInvoiceTwo, changeForm} = this.props;
        let {postData} = data
        let electronData = postData.action === 1 ? electronInvoiceOne.postData : electronInvoiceTwo.postData
        if(postData[name]){
            return postData[name]
        } else {
            return electronData[name]
        }
    }
	render() {
		let {data, changeStatus, modalSelect, modalCtrl, contentList, showModal, changeForm, electronInvoiceOne, electronInvoiceTwo} = this.props;
        let electronData = data.postData.action === 1 ? electronInvoiceOne.postData : electronInvoiceTwo.postData
		let hasProperty = this.hasProperty
		return <div className="electron-invoice">
			<input type="hidden" name="user_id" value={ data.postData.user_id }/>
			<InvoiceHeader serverData={ electronData } postData={ data.postData } inputHolder="请输入发票抬头" headName="action" contentName="title"
						   changeForm={ changeForm }/>
			<DivideLine/>
			<InvoiceContent modalSelect={ modalSelect } modalCtrl={ modalCtrl } postData={ data.postData }
							name="content_option"/>
			<InvoiceContentSelect modalSelect={ modalSelect } list={ contentList }
								  selectId={ data.postData.invoice_content } modalCtrl={ modalCtrl }
								  show={ showModal }/>
			<div className="receiver-email">
				<StripInput text="*收票人邮箱" textHolder="用于接收电子发票" name="receiver_email" inputValue={ hasProperty('receiver_email') }
							inputChange={ changeForm.bind(this, "receiver_email")} action={data.postData.action}/>
			</div>
			{ data.postData.action === 2 &&
			<StripArray serverData={ electronData } data={ data.postData } status={ data.status } changeStatus={ changeStatus }
						changeForm={ changeForm }/> }
		</div>
	}
}

//增值税发票
class TaxInvoice extends Component {
	render() {
		let {data, selectAddress, setOrigin, taxInvoiceOne, taxInvoiceTwo, addressForinvoice} = this.props;
        let taxInvoiceData = data.postData.action === 1 ? taxInvoiceOne.postData : taxInvoiceTwo.postData
		return <div className="tax-invoice">
			<input type="hidden" name="user_id" value={ data.postData.user_id }/>
            <input type="hidden" name="action" value='2'/>
			<InvoiceContent edit={false} contentText={ data.contentText } postData={ data.postData }
							name="content_option"/>
			<StripArrayTax changeForm={ this.props.changeForm } data={ data.postData } serverData={ taxInvoiceData }/>
			<InvoiceAddress data={ data.postData }
							setOrigin={ setOrigin }
							selectAddress={ selectAddress }
                            addressForinvoice = { addressForinvoice }

			/>
		</div>
	}
}

//发票抬头
class InvoiceHeader extends Component {
	constructor(props) {
		super(props);
		let invoiceName = props.postData['title'] || ( props.postData['title'] === undefined ? props.serverData['title'] : props.postData['title'])
		this.state = {
			inputValue: invoiceName !== undefined ? invoiceName : "",
			showClose: false
		}
	}

	componentWillReceiveProps(newProps) {
        let invoiceName = newProps.postData['title'] || ( newProps.postData['title'] === undefined ? newProps.serverData['title'] : newProps.postData['title']);
		this.setState({inputValue: invoiceName !== undefined ? invoiceName : ""})
	}

	closeChange = (value) => {
		this.setState({showClose: value});
	};
	inputValueChange = (value, isGet, close) => {
		this.setState({inputValue: value});
		if (isGet) {
			this.props.changeForm('title', value.trim());
		}
		if (close) {
			this.closeChange(false);
		}
	};

	render() {
		let {changeForm, postData, headName, contentName} = this.props;
		return <div className="invoice-header">
			<div className="title">*发票抬头</div>
			<input type="hidden" name={ headName } value={ postData.action }/>
			<div className="check-grid">
				<div className="check-box" onClick={  e => changeForm("action", 1) }>
					<span className={`check-icon ${ postData.action === 1 ? "check" : "" }`}> </span> 个人
				</div>
				<div className="check-box" onClick={  e => changeForm("action", 2) }>
					<span className={`check-icon ${ postData.action === 2 ? "check" : "" }`}> </span> 单位
				</div>
			</div>
			<label className="input">
				<input type="text"
					   name={contentName}
					   placeholder={this.props.inputHolder}
					   value={ this.state.inputValue }
					   onFocus={ (e) => this.closeChange(true)}
					   onChange={ (e) => this.inputValueChange(e.target.value)}
					   maxLength="50"
					   onBlur={ (e) => this.inputValueChange(e.target.value, true, true) }/>
				{this.state.inputValue !== "" && this.state.showClose &&
				<i className="grey-close-icon" onTouchTap={ (e) => this.inputValueChange("", true)}> </i> }
			</label>
		</div>
	}
}

/*分割线*/
const DivideLine = () => (
	<div className="divide-line">
		<div className="line"></div>
	</div>
);

/*发票内容*/
class InvoiceContent extends Component {
	static defaultProps = {
		edit: true
	};

	render() {
		return <div className="invoice-content g-row-flex">
			<div className="left">*发票内容</div>
			<input type="hidden" name={ this.props.name } value={ this.props.postData.invoice_content }/>
			<div className="right g-col-1">{ this.props.postData.contentText }
			</div>
		</div>
	}
}

//条组
class StripArray extends Component {
    hasProperty = (name) => {
        let {data, serverData, changeForm} = this.props;
        if(data[name]){
        	return data[name]
		} else {
        	return serverData[name]
		}
	}
	render() {
		let {status, changeStatus, changeForm} = this.props;
		let hasProperty = this.hasProperty
		return <div className="strip-array">
			<StripInput text="*纳税人识别码" textHolder="请输入纳税人识别码" inputValue={ hasProperty('taxpayer_idNumber') }
						name="taxpayer_idNumber" inputChange={ changeForm.bind(this, "taxpayer_idNumber")}/>
			<div className={`more-info-grid ${ status.infoMore ? "active" : ""}`}>
				<DivideLine/>
				<StripInput text="注册地址" textHolder="请输入注册地址" inputValue={ hasProperty('reg_address') } name="reg_address"
							inputChange={ changeForm.bind(this, "reg_address")} limitNum="100"/>
				<DivideLine/>
				<StripInput text="注册电话" textHolder="请输注册电话" inputValue={ hasProperty('reg_tel') } name="reg_tel"
							inputChange={ changeForm.bind(this, "reg_tel")}/>
				<DivideLine/>
				<StripInput text="开户银行" textHolder="请输入开户银行" inputValue={ hasProperty('open_bank') } name="open_bank"
							inputChange={ changeForm.bind(this, "open_bank")}/>
				<DivideLine/>
				<StripInput text="银行账户" textHolder="请输入银行账户" inputValue={ hasProperty('bank_account') } name="bank_account"
							inputChange={ changeForm.bind(this, "bank_account")}/>
			</div>
			<DivideLine/>
			<div className="more-info-click" onClick={ (e) => changeStatus("infoMore", !status.infoMore) }>更多单位信息 <i
				className={`arrow-btm-icon ${ status.infoMore ? "active" : "" }`}> </i></div>
		</div>
	}
}

class StripArrayTax extends Component {
    hasProperty = (name) => {
        let {data, serverData,changeForm} = this.props;
        if(data[name]){
            return data[name]
        } else {
            return serverData[name]
        }
    }
	render() {
		let {changeForm, data} = this.props;
        let hasProperty = this.hasProperty
		return <div className="strip-array">
			<StripInput text="*单位名称" textHolder="请输入单位名称" inputValue={ hasProperty('unit_name') } name="unit_name"
						inputChange={ changeForm.bind(this, "unit_name")}/>
			<DivideLine/>
			<StripInput text="*纳税人识别码" textHolder="请输入纳税人识别码" inputValue={ hasProperty('taxpayer_idNumber') }
						name="taxpayer_idNumber" inputChange={ changeForm.bind(this, "taxpayer_idNumber")}
						limitNum="20"/>
			<DivideLine/>
			<StripInput text="*注册地址" textHolder="请输入注册地址" inputValue={ hasProperty('reg_address') } name="reg_address"
						inputChange={ changeForm.bind(this, "reg_address")} limitNum="100"/>
			<DivideLine/>
			<StripInput text="*注册电话" textHolder="请输注册电话" inputValue={ hasProperty('reg_tel') } name="reg_tel"
						inputChange={ changeForm.bind(this, "reg_tel")} limitNum="20"/>
			<DivideLine/>
			<StripInput text="*开户银行" textHolder="请输入开户银行" inputValue={ hasProperty('open_bank') } name="open_bank"
						inputChange={ changeForm.bind(this, "open_bank")}/>
			<DivideLine/>
			<StripInput text="*银行账户" textHolder="请输入银行账户" inputValue={ hasProperty('bank_account') } name="bank_account"
						inputChange={ changeForm.bind(this, "bank_account")}/>
		</div>
	}
}

/*单条输入框*/
class StripInput extends Component {
	render() {
		let {text, limitNum, textHolder, inputChange, inputValue, name, action} = this.props;
		return (
            action ?
            <div className="one-strip g-row-flex" key={ `${name}_${action}` }>
                <div className="left">{text}</div>
                <div className="right g-col-1">
                    <input type="text" name={ name } maxLength={ limitNum ? limitNum : 50 }
                           placeholder={ textHolder ? textHolder : "" }
                           onBlur={ (e) => inputChange && inputChange(e.target.value) } defaultValue={ inputValue }/>
                </div>
            </div>
            : <div className="one-strip g-row-flex" key={ `${name}_${action}` }>
                <div className="left">{text}</div>
                <div className="right g-col-1">
                    <input type="text" name={ name } maxLength={ limitNum ? limitNum : 50 }
                           placeholder={ textHolder ? textHolder : "" }
                           onBlur={ (e) => inputChange && inputChange(e.target.value) } defaultValue={ inputValue }/>
                </div>
            </div>
		)
	}
}

class InvoiceAddress extends Component {
	toSelect = () => {
		this.props.setOrigin("address");
		const {receiver_address, receiver_name, receiver_region, receiver_tel} = this.props.data
		let _from = 2;
		if(receiver_address && receiver_name && receiver_region && receiver_tel) {
			_from = 1
		}
        browserHistory.push(`/goodsReceiveInfo/addressManage?from=${_from}&name=invoice`);
	}

	render() {
		let {data, addressForinvoice} = this.props;
        let address = data.receiver_address && data.receiver_region && data.receiver_tel && data.receiver_name;
        let receiver_region = data.receiver_region ? JSON.parse(data.receiver_region):''
        let receiver_address = data.receiver_address
		let receiver_tel = data.receiver_tel
		let receiver_name = data.receiver_name
		if(addressForinvoice){
            receiver_address = addressForinvoice.address
            receiver_tel = addressForinvoice.mobile
            receiver_name = addressForinvoice.name
            receiver_region = addressForinvoice.area ? addressForinvoice.area:''
		}
		return <div className="invoice-address">
			<div className="top">*收票地址</div>
			{ address ? <div>
				<input type="hidden" name="receiver_region" value={ JSON.stringify(receiver_region) }/>
				<input type="hidden" name="receiver_address" value={ receiver_address }/>
				<input type="hidden" name="receiver_tel" value={ receiver_tel }/>
				<input type="hidden" name="receiver_name" value={ receiver_name }/>
			</div> : ""
			}
			<DivideLine/>
			<div onClick={ this.toSelect } className="address-select g-row-flex g-col-mid g-col-ctr">
				<div className="left-icon">
					<i className="location-address-icon"> </i>
				</div>
				{address ?
					<div className="content-text g-col-1">
						<div className="text-top g-row-flex">
							<span className="g-col-1">收货人：{receiver_name}</span><span
							className="user-phone">{receiver_tel }</span>
						</div>
						<div className="text-bottom">收货地址：{`${(receiver_region.city && receiver_region.city.text)?receiver_region.city.text:'' }  ${(receiver_region.province && receiver_region.province.text)?receiver_region.province.text:'' }  ${receiver_address}`}</div>
					</div> :
					<div className="g-col-1 c-fs15">
						请填写收货地址
					</div>
				}
				<div className="right-icon">
					<i className="arrow-right-icon"> </i>
				</div>
			</div>
		</div>
	}
}

/*发票内容选择*/
class InvoiceContentSelect extends Component {
	getList = () => {
		const lists = [{text: "明细", content_id: 1}]
		return lists.map((list, i) => {
			return <div className="select-li g-row-flex" key={i} onClick={ this.props.modalSelect.bind(null, list)}>
				<div className="left g-col-1">{ list.text }</div>
				<div className="right"><span
					className={`check-icon ${this.props.selectId === list.content_id ? "check" : ""}`}> </span></div>
			</div>
		})
	}

	render() {
		return <div onClick={ this.props.modalCtrl.bind(null, false)}>
			{ this.props.show && <Shady /> }
			<div className={`modal-select ${ this.props.show ? "active" : ""}`} onClick={ e => e.stopPropagation()}>
				<div className="title">发票内容</div>
				<div className="select-list">
					{ this.getList() }
				</div>
				<div className="coupon-btm" onClick={ this.props.modalCtrl.bind(null, false) }>
					<div className="close-btn">
						关闭
					</div>
				</div>
			</div>
		</div>
	}
}

/*提交按钮*/
class SubmitBtn extends Component {
	render() {
		return <div className="submit-btn">
			<div className="red-btn" onClick={ this.props.formSubmit }>确认</div>
		</div>
	}
}

class PopupItem extends Component {
	componentDidMount() {
		$("html,body").css({height: "100%", overflowY: "hidden"})
	}

	componentWillUnmount() {
		$("html,body").css({height: "", overflowY: ""})
	}

	render() {
		return <div onClick={ this.props.onClose }>
			<Shady option={{zIndex: 108}}/>
			<div className="note-popup">
				<div className="popup-body" onClick={ (e) => {
					e.stopPropagation()
				}}>
					<h3><p>发票须知</p></h3>
					<div className="list">
						<p>1、使用活动赠送的小泰e卡（活动卡）支付的订单不支持开具发票；</p>
						<p>2、跨境保税、海外直邮商品属于跨境海外商品，不支持开具国内发票；</p>
						<p>3、如选择公司抬头的发票需提供纳税人识别号；</p>
						<p>4、电子普通发票的法律效力、基本用途及使用规定同纸质普通发票，可用于报销入账、售后维权等。如需纸质发票可自行下载打印。</p>
					</div>
				</div>
				<div className="popup-bottom">
					<i className="close-l-x-icon"> </i>
				</div>
			</div>
		</div>
	}
}

const formCheck = {
	checkObject(obj, validateArr, state){
		let result = {status: true, msg: ""};
		let {invoiceType} = state
		let Invoice = state[`${invoiceType}Invoice_${obj.action}`].postData
		validateArr.every((v, i) => {
			if (!v.validate || ( ( obj[v.key] === "" || obj[v.key] === undefined ) && !v.require )) {
				return result;
			}
			if ( obj[v.key] === undefined ){
                if (!v.validate(Invoice[v.key], v.require)) {
                    result = {status: false, msg: v.msg};
                    return false;
                }
			} else {
                if (!v.validate(obj[v.key], v.require)) {
                    result = {status: false, msg: v.msg};
                    return false;
                }
			}
			return true;
		});
		return result;
	},
	isEmpty(value){

		if (value === undefined || value.trim() === "") {
			return false;
		}
		return true;
	},
	telCheck(value, require){
		value = value !== undefined ? value.trim() : "";
		if (value === "" && require) {
			return false;
		}
		if (!(/^[0-9\-]+$/g ).test(value)) {
			return false;
		}
		return true;
	},
	character(value){

	},
	characterNum(value, require){
		value = value !== undefined ? value.trim() : "";
		if (value === "" && require) {
			return false;
		}
		if (!(/^[\u4e00-\u9fa5|0-9]+$/g).test(value)) {
			return false;
		}
		return true;
	},
	numberCheck(value, require){
		value = value !== undefined ? value.trim() : "";
		if (value === "" && require) {
			return false;
		}
		if (!(/^[0-9]+$/g ).test(value)) {
			return false;
		}
		return true;
	},
	emailCheck: function (value) {
		if (!( /^([a-zA-Z0-9_\.\-])+\@[a-zA-Z0-9\-]+\.com$/g).test(value)) {
			return false;
		}
		return true;
	},
	isObject(value){
		if (typeof value === "object" && value !== null) {
			return true;
		}
		return false;
	}
};

const invoiceValidate = {
	common: {
		"1": [
			{key: "invoice_name1", validate: formCheck.isEmpty, require: true, msg: "请输入发票抬头"}
		],
		"2": [
			{key: "title", validate: formCheck.isEmpty, require: true, msg: "请输入发票抬头"},
			{key: "taxpayer_idNumber", validate: formCheck.isEmpty, require: true, msg: "请输入纳税人识别码"},
			{key: "reg_address", validate: "", require: false, msg: "请输入正确的地址"},
			{key: "reg_tel", validate: formCheck.telCheck, require: false, msg: "请填写正确的注册电话"},
			{key: "open_bank", validate: formCheck.characterNum, require: false, msg: "请填写正确的开户银行"},
			{key: "bank_account", validate: formCheck.numberCheck, require: false, msg: "请填写正确的银行账户"}
		],
	},
	electron: {
		"1": [
			{key: "invoice_name1", validate: formCheck.isEmpty, require: true, msg: "请输入发票抬头"},
			{key: "receiver_email", validate: formCheck.emailCheck, require: true, msg: "请填写正确的收票人邮箱"},
		],
		"2": [
			{key: "title", validate: formCheck.isEmpty, require: true, msg: "请输入发票抬头"},
			{key: "receiver_email", validate: formCheck.emailCheck, require: true, msg: "请填写正确的收票人邮箱"},
			{key: "taxpayer_idNumber", validate: formCheck.isEmpty, require: true, msg: "请输入纳税人识别码"},
			{key: "reg_address", validate: "", require: false, msg: "请输入正确的地址"},
			{key: "reg_tel", validate: formCheck.telCheck, require: false, msg: "请填写正确的注册电话"},
			{key: "open_bank", validate: formCheck.characterNum, require: false, msg: "请填写正确的开户银行"},
			{key: "bank_account", validate: formCheck.numberCheck, require: false, msg: "请填写正确的银行账户"}
		],
	},
	tax: [
		{key: "unit_name", validate: formCheck.isEmpty, require: true, msg: "请输入单位名称"},
		{key: "taxpayer_idNumber", validate: formCheck.isEmpty, require: true, msg: "请输入纳税人识别码"},
		{key: "reg_address", validate: formCheck.isEmpty, require: true, msg: "请输入注册地址"},
		{key: "reg_tel", validate: formCheck.telCheck, require: true, msg: "请输入正确的电话"},
		{key: "open_bank", validate: formCheck.isEmpty, require: true, msg: "请输入正确的银行名称"},
		{key: "bank_account", validate: formCheck.numberCheck, require: true, msg: "请输入正确的账户"},
		{key: "receiver_address", validate: formCheck.isEmpty, require: true, msg: "请选择收票地址"},
		{key: "receiver_name", validate: formCheck.isEmpty, require: true, msg: "请选择收票地址"},
		{key: "receiver_region", validate: formCheck.isEmpty, require: true, msg: "请选择收票地址"},
		{key: "receiver_tel", validate: formCheck.isEmpty, require: true, msg: "请选择收票地址"},
	]
};


function invoiceState(state, props) {
	return {
		...state.global,
		...state.invoiceSelect,
		confirmLoad: state.orderConfirm.load,
        addressForinvoice: state.orderConfirm['newAddressForinvoice']
	}
}

function invoiceDispatch(dispatch, props) {
	let {shop_ids, invoice, action} = props.location.query;
	shop_ids = shop_ids.split(",");
	return {
		dispatch,
		setOrigin(origin){
			dispatch(createActions('setOrigin', {origin: origin}));
		},
		//提示框关闭
		promptClose: () => {
			dispatch(createActions('ctrlPrompt', {prompt: {show: false, msg: ""}}));
		},
		changeType: (type) => {
			dispatch(createActions("changeType", {invoiceType: type}))
		},
		changeStatus: (type, key, value) => {
			dispatch(createActions("changeStatus", {invoiceType: type, key: key, value: value}))
		},
		modalCtrl: (status) => {
			dispatch(createActions('modalCtrl', {status: status}));
		},
		modalSelect: (type, obj) => {
			dispatch(createActions('modalSelect', {selectType: type, obj: obj}));
			dispatch(createActions('modalCtrl', {status: false}));
		},
		changeForm(mode, name, value){
			dispatch(createActions("changeForm", {mode, name, value}));
		},
		selectAddress: (data) => {
			dispatch(createActions('selectAddress', {data: data}));
		},
		popupNote: (status) => {
			dispatch(createActions('popupNote', {status: status}));
		},
		initialPage: () => {
			dispatch(orderConfirmActions('setOrigin', {origin: 'invoice'}));
			dispatch(createActions('updateState'));
			axios.request({
				...pageApi.initPage,
				params: {shop_id: shop_ids}
			}).then(result => {
				dispatch(createActions('initialPage', {data: result.data, invoice, action: +action}))
			}).catch(error => {
                tip.show({msg: error.message || error.response.data.message||'小泰发生错误，请稍后再试~'});
				console.error(error);
			})
		}
	}
}

function invoiceProps(stateProps, dispatchProps, props) {
	let request = false;
	let {dispatch} = dispatchProps;
	return {
		...stateProps,
		...dispatchProps,
		...props,
		formSubmit: () => {
			if (request) return;
			request = true;
			let fromData = stateProps[stateProps.invoiceType + "Invoice"].postData;
			let result = {status: true, msg: ""};
			if (stateProps.invoiceType === "tax") {
				result = formCheck.checkObject(fromData, invoiceValidate[stateProps.invoiceType], stateProps);
			} else {
				result = formCheck.checkObject(fromData, invoiceValidate[stateProps.invoiceType][fromData.action], stateProps);
			}
			if (!result.status) {
				dispatch(createActions("ctrlPrompt", {prompt: {show: true, msg: result.msg}}));
				request = false;
				return;
			}
			axios.request({
				...pageApi.invoiceSave,
				data: $("#invoiceForm").serialize()
			}).then(result => {
				request = false;
				let data = result.data;
				if (data.code !== 0) {
					dispatch(createActions("ctrlPrompt", {prompt: {show: true, msg: data.message}}));
					return;
				}
				let postData = stateProps[stateProps.invoiceType + "Invoice"].postData;
                let {invoiceType} = stateProps
                let Invoice = stateProps[`${invoiceType}Invoice_${fromData.action}`].postData
				dispatch(orderConfirmActions('selectInvoice', {
					invoice: mapTypeInvoice[stateProps.invoiceType],
					action: postData.action,
					unitName: postData['unit_name'] === undefined ? Invoice['unit_name'] : postData['unit_name'],
					invoiceName: postData['title'] === undefined ? Invoice['title'] : postData['title'],
					id: data.data.invoice.result
				}));
				browserHistory.goBack();
			}).catch((error) => {
                tip.show({msg: error.response.data.message|| error.message ||'小泰发生错误，请稍后再试~'});
			})
		}
	}
}

export default connect(invoiceState, invoiceDispatch, invoiceProps)(Invoice);