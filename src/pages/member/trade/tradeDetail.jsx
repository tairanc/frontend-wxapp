import React, {Component} from 'react';
import {browserHistory, Link} from 'react-router';
import {connect} from 'react-redux';
import Clipboard from "clipboard";
import {LoadingRound, NoMoreOrderInfo, Shady, CustomerService,FastGuide } from 'component/common';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import Popup from 'component/modal2.jsx';
import {timeUtils} from 'js/common/utils';
import {addImageSuffix, dateUtil, handleId} from "js/util/index";
import {
    afterstatusDeal,
    confimStatus,
    dispatchDelivery,
    dispatchType,
    groupStatus,
    orderClosereason,
    ordermainStatusAndIconMap,
    ordersubStatusAndIconMap,
    payType,
    storeIcon
} from 'js/filters/orderStatus';
import {WXAPI} from 'config/index';
import axios from 'js/util/axios';
import {ModalAComp} from 'component/modal';
import './trade.scss';
import {PopupCancelDetail} from './newOrderCancel';

const pageApi = {
    init: {url: `${WXAPI}/user/order/info`, method: "get"},   //平台订单详情
    shopinit: {url: `${WXAPI}/user/shopOrder/info`, method: "get"}, //店铺级订单详情
    del: {url: `${WXAPI}/user/shopOrder/discard`, method: "post"},
    conf: {url: `${WXAPI}/user/shopOrder/confirmReceived`, method: "post"},
    GroupBuy: {url: `${WXAPI}/promotion/checkGroupBuy`, method: "post"},
};
const createActions = concatPageAndType("tradeDetail");
const axiosCreator = actionAxios("tradeDetail");
const popupActions = concatPageAndType('popup');

const invoiceTypeMap = {
    1: "普通发票",
    2: "增值税发票",
    3: "电子发票"
};
const contentOption = {
    1: "明细"
};

//订单详情页
class TradeDetail extends Component {
    componentWillMount() {
        this.props.resetData();
        this.props.getData();
    }

    //支付信息弹窗
    onPayPopup = (status) => {
        this.props.dispatch(createActions('payPopup', {status}))
    };

    componentWillUnmount() {
        this.props.resetData();
    }

    componentDidMount() {
        let clipboard = new Clipboard('.copy');
        clipboard.on('success', function (e) {
            //优雅降级:safari 版本号>=10,以及部分安卓机，提示复制成功;否则提示需在文字选中后，手动选择“拷贝”进行复制
            Popup.MsgTip({msg: "订单编号复制成功!"});
        });

        clipboard.on('error', function (e) {
            Popup.MsgTip({msg: "请长按订单编号进行复制"});

        });
    }

    render() {
        let {cancelOrderPoup, PopupCancelMsg, changeReason, cancel_reason, dispatch, reminderKnow} = this.props;
        let {data} = this.props.data;
        let orderflag = this.props.location.query.orderflag;
        let tid = this.props.location.query.tid;
        return (
            !this.props.load && data ?
                <div data-page="trade-detail" style={{minHeight: $(window).height()}}>
                    {orderflag === "1" ?
                        (!(data instanceof Array) ?
                            <div>
                                <section id="tradeDetail">
                                    <OrderNumStatus created_at={data.created_at} timeout={data.timeout_action_at}
                                                    orderNum={data.no}
                                                    status={data.status}
                                                    cancel_reason={data.cancel_from === 10 ? data.cancel_reason : orderClosereason[data.cancel_from]}/>
                                    {data.platform_from !== "TR_WRD" && data.platform_from !== "catering" &&
                                    <AddressInfo data={data.receiver}/>}
                                    <OrderDetailMid data={data.order_shops} orderflag={orderflag}
                                                    payPopupMsg={this.props.payPopupMsg} payPopup={this.onPayPopup}
                                                    platform={data.platform_from}/>
                                    <UserInfo data={data}/>
                                    <InvoiceInfo data={data}/>
                                    <OrderTotal data={data} orderflag={orderflag}/>
                                    <OrderTime data={data}/>
                                    <OrderCtrlConnect status={data.status}
                                                      order_shops={data.order_shops}
                                                      isWrd={data.platform_from}
                                                      buyType={data.pay_type}
                                                      tid={data.no} payPopup={this.onPayPopup}
                                                      isGroupBuy={data.isGroupBuy} pay_status={data.pay_status}
                                                      cancelOrderPoup={cancelOrderPoup} PopupCancelMsg={PopupCancelMsg}
                                                      cancel_reason={cancel_reason}/>

                                </section>
                                <PopupCancelDetail PopupCancelMsg={PopupCancelMsg} cancelOrderPoup={cancelOrderPoup}
                                                   webcancelFrom={'tradeDetail'}
                                                   changeReason={changeReason} cancel_reason={cancel_reason} tid={tid}
                                                   dispatch={dispatch} createActions={createActions}/>

                            </div> : <NoMoreOrderInfo/>)

                        : (orderflag === "2" ?
                            (!(data instanceof Array) ? <div>
                                {/*店铺级订单***********/}
                                <section id="tradeDetail">
                                    {data.group_buy_info && !(data.group_buy_info instanceof Array) &&
                                    <FightGroupStatus info={data.group_buy_info} status={data.status}/>}
                                    <ShoporderStatus created_at={data.created_at} orderNum={data.no}
                                                     consign_status={data.consign_status}
                                                     status={data.status}
                                                     timeout_received_at={data.timeout_received_at}
                                                     cancel_reason={data.cancel_from === 10 ? data.cancel_reason : orderClosereason[data.cancel_from]}/>
                                    {data.order.platform_from !== "TR_WRD" && data.order.platform_from !== "catering" &&
                                    <AddressInfo data={data.order.receiver}/>}
                                    <OrderDetailMid data={data} orderflag={orderflag}
                                                    payPopupMsg={this.props.payPopupMsg} payPopup={this.onPayPopup}
                                                    platform={data.order.platform_from} reminderKnow={reminderKnow}/>
                                    <UserInfo data={data.order}/>
                                    <InvoiceInfo data={data.order}/>
                                    <OrderTotal data={data} orderflag={orderflag}/>
                                    <OrderTime data={data}/>
                                    <OrderCtrlConnect status={data.status}
                                                      isWrd={data.order.platform_from}
                                                      buyType={data.order.pay_type}
                                                      tid={data.no} payPopup={this.onPayPopup}
                                                      order_goods={data.order_goods}
                                                      consign_status={data.consign_status} consigned_at={data.consigned_at}/>
                                </section>
                                <PopupPayDetail payPopupMsg={this.props.payPopupMsg} payPopup={this.onPayPopup}
                                                payType={data.order.pay_type}/>
                                <ModalAComp active={this.props.modalAS.status}
                                            msg={this.props.modalAS.msg}
                                            btns={[{
                                                text: "我知道了", cb: () => {
                                                    this.props.dispatch(createActions('ctrlModalapply', {
                                                        status: false
                                                    }))
                                                }
                                            }]}/>
                            </div> : <NoMoreOrderInfo/>)
                            : null)}
                    <FastGuide />
                </div>
                : <LoadingRound/>

        )

    }
}


//拼团倒计时
class Groupclock extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        let {timeout} = this.props;
        return (
            <i>
                还剩<Countdown timeout={timeout}/>拼团结束
            </i>
        )
    }
}

//拼团状态
class FightGroupStatus extends Component {
    render() {
        const {info = {}, status} = this.props;
        let {object = {}, object_id = 0} = info;
        let {required_person = 0, current_person = 0, group_status = ''} = object;
        let styleCtrl = {};
        let html = "";
        switch (group_status) {
            case 2:
                if (status <= 25) {
                    html = <img src="src/img/icon/trcSuccessful2.png" style={{"width": "60px"}} alt=""/>;
                    styleCtrl = {"position": "absolute", top: 0, right: "20px"};
                } else {
                    html = "";
                    styleCtrl = {"position": "absolute"};
                }
                break;
            case 1:
                if (status == 20) {
                    html =
                        <div>
                            <div className="trcBubble">
                                <img src="src/img/icon/trcBubble.png" style={{"width": "95%"}} alt=""/>
                                <div className="object-info">
                                    <div className="object-person">
                                        <img src="src/img/icon/trcOngoing.png"/>
                                        <span className="person-info">
                                    <p style={{paddingRight: "20px"}}>拼团中</p>
                                            {!!required_person && !!current_person &&
                                            <p>拼团还差{required_person - current_person}人</p>}
                                </span>
                                    </div>
                                    <div className="object-time ">
                                        <Groupclock
                                            timeout={info.object.expire_time}/>
                                    </div>

                                </div>
                            </div>
                            <div className="invite-container">
                                <Link className="invite-friends" key="1"
                                      to={`/groupDetail?object_id=${object_id}`}>邀请好友参团</Link>
                            </div>
                        </div>
                    ;
                    styleCtrl = {"position": "fixed", bottom: "55px", right: "5px"};
                } else {
                    html = "";
                    styleCtrl = {"position": "absolute"};
                }
                break;
            case 0:
                html = <img src="src/img/icon/trcFailure2.png" style={{"width": "60px"}} alt=""/>;
                styleCtrl = {"position": "absolute", top: 0, right: "20px"};
                break;
            default:
                html = "";
                styleCtrl = {"position": "absolute"};
        }
        return (
            <div className="fight-group-status c-tc c-cfff" style={styleCtrl}>
                {html}
            </div>
        );
    }
}


//平台级订单号和状态
export class OrderNumStatus extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        let {status, cancel_reason,timeout} = this.props;
        let style = ordermainStatusAndIconMap[status]['status'] === "交易关闭" ? {
            display: "inline-block",
            marginTop: "14px",
            lineHeight: "18px"
        } : {};
        return (
            <div className="status-info">
                <img src={ordermainStatusAndIconMap[status]['icon']}/>
                <span className="c-cfff c-ml25" style={style}>{ordermainStatusAndIconMap[status]['status']}
                    {ordermainStatusAndIconMap[status]['status'] === "交易关闭" &&
                    <span className="c-cfff c-fs11 c-dpb">取消原因：{cancel_reason}</span>}
                    {ordermainStatusAndIconMap[status]['status'] === "等待付款" &&
                    <span className="c-fr c-fs12">剩余支付时间<Countdown timeout={timeout}/></span>}</span>
            </div>
        );

    }
}
//倒计时组件
export class Countdown extends Component {
    constructor(props) {
        super(props);
        let retime = parseInt(new Date(this.props.timeout.replace(/-/g, '/')).getTime() / 1000) - (parseInt(new Date().getTime() / 1000));
        if (retime > 0) {
            this.state = {
                retime: retime
            }
        } else {
            this.state = {
                retime: 0
            }
        }

    }


    componentDidMount() {
        let {retime} = this.state;
        retime > 0 && this.intervalreTime();
    }

    componentWillUnmount() {
        window.clearInterval(this.retimer);
    }

    intervalreTime = () => {
        this.retimer = setInterval(() => {
            let t = --this.state.retime;
            if (t < 0) {
                window.clearInterval(this.retimer);
                this.setState({retime: 0})
            } else {
                this.state.retime = t;
                this.setState(this.state)
            }
        }, 1000)
    };

    formatTime(time) {
        return dateUtil.formatNum(parseInt(time))
    }

    dealTime = (retime) => {
        let html = '';
        let day, hours, min, sec;
        day = this.formatTime(retime / 3600 / 24);
        hours = this.formatTime(retime / 3600 % 24);
        min = this.formatTime(retime % 3600 / 60);
        sec = this.formatTime(retime % 60);
        html = day != 0 ? `${day}天${hours}时` : (hours != 0 ? `${hours}时${min}分` : `${min}分${sec}秒`);
        return html;
    };

    render() {
        let {retime} = this.state;
        return (
            <span className="block-time">
                <span>{this.dealTime(retime)}</span>
            </span>
        );

    }
}
//店铺级订单号和状态
export class ShoporderStatus extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        let {status, cancel_reason, consign_status,timeout_received_at} = this.props;
        let style = ordersubStatusAndIconMap[status]['status'] === "交易关闭" ? {
            display: "inline-block",
            marginTop: "14px",
            lineHeight: "18px"
        } : {};
        return (
            <div className="status-info">
                <img src={ordersubStatusAndIconMap[status]['icon']}/>
                <span className="c-cfff c-ml25"
                      style={style}>{status == 40 ? confimStatus[consign_status] : ordersubStatusAndIconMap[status]['status']}
                    {ordersubStatusAndIconMap[status]['status'] === "交易关闭" &&
                    <span className="c-cfff c-fs11 c-dpb">取消原因：{cancel_reason}</span>}
                    {ordersubStatusAndIconMap[status]['status'] === "已发货" &&
                    <span className="c-fr c-fs12">还剩 <Countdown timeout={timeout_received_at}/>
                      <i>自动确认收货</i></span>}
                      </span>
            </div>
        );

    }
}

//收货人信息
const AddressInfo = ({data}) => {
    return (
        <div className="address-info-grid">
            <div className="address-info">
                <ReceivePerson data={data.address}/>
                <ReceiveAddr data={data.address}/>
                {data.idCard.id_number && <ReceiverId data={data}/>}
            </div>
        </div>
    )
};


//收货人姓名和电话
const ReceivePerson = ({data}) => {
    return (
        <div className="receive-person g-row-flex">
            <div className="left">
                <i className="location-address-icon"> </i>
            </div>
            <div className="right">{data.name} {data.mobile}</div>
        </div>
    );
};
//收货地址
const ReceiveAddr = ({data}) => {
    return (
        <div className="receive-addr">
            <div className="address-text g-col-1">{data.state}{data.city}{data.district}{data.address}</div>
        </div>
    )
};
//收货人身份证
const ReceiverId = ({data}) => {
    let idNum = data.idCard.id_number.toString();
    return (
        <div className="receiver-id-grid">
            <div className="receiver-id g-row-flex">
                <div className="left">
                    <i className="identify-card-icon" style={{marginTop: "15px", display: "block"}}> </i>
                </div>
                <div
                    className="receiver-id-text g-col-1">身份证信息：{handleId(idNum)}
                </div>
            </div>
        </div>
    )
};


//页面中部
class OrderDetailMid extends Component {
    render() {
        let {orderflag, data, payPopupMsg, payPopup, reminderKnow} = this.props;
        let shops = "";
        if (orderflag === "1") {  //平台级订单多个店铺
            let self = this;
            shops = this.props.data.map(function (item, i) {
                return <ShopList {...self.props} platform={self.props.platform}  data={item}
                                 key={i}
                                 cancel_status={self.props.cancel_status} />
            });
        } else if (orderflag === "2") {  //店铺级订单
            shops = <ShopList data={data} orderflag={orderflag} platform={this.props.platform}
                              payPopupMsg={this.props.payPopupMsg}
                              payPopup={this.props.payPopup} reminderKnow={this.props.reminderKnow}/>
        }

        return (
            <div>
                {shops}
            </div>
        )
    }
}

//店铺列表
class ShopList extends Component {
    constructor(props, context) {
        super(props);
        this.state = {
            isOpen: false
        }
    };

    changeOpen = () => {
        this.setState({
            isOpen: !this.state.isOpen
        })
    }

    render() {
        let {data, data:{shop_info:{id, is_open, name, alias, shop_icon, attr}}} = this.props;
        let goodsArr = data.order_goods;
        let goods = goodsArr.map((item, i)=>{
            return <ItemList {...this.props} data={item} key={i} outdata={data}/>
        });
        let shortGoods = goods.slice(0, 2);
        let {isOpen} = this.state;
        return (
            <div className="shop">
                <div className="shop-top">
                    <div className="shop-name">
                        {storeIcon(shop_icon)}
                        <Link className="shop-long" to={is_open === 1 ? `/store/home?shop=${id}` : 'javascript:void(0)'}>
                            {alias ? alias : name}
                        </Link>
                    </div>
                    <div className="arrow-right">
                        {is_open === 1 && <Link to={`/store/home?shop=${id}`}>
                            <img src="/src/img/icon/arrow/arrow-right-s-icon.png"/></Link>}
                    </div>
                    <CustomerService className="server" shopAttr={attr}></CustomerService>
                </div>
                <div className="order-detail-mid">
                    {(goods.length > 1000) && (!isOpen) ? shortGoods : goods}
                    {goods.length > 1000 &&
                        <div onClick={this.changeOpen} className="c-tc c-fs12" style={{color: '#808080', lineHeight: '22px'}}>
                            {isOpen ? '' : '还有' + (goods.length - 2) + '件'}
                            <img style={{width: '17px', marginLeft: '5px'}}
                                 src={`src/img/afterSale/${isOpen ? "close" : "open"}.png`}/>
                        </div>}
                </div>
                {data.buyer_message && <div className="leave-message">
                    <img src="/src/img/icon/message.png"/>
                    <span>留言:{data.buyer_message}</span>
                </div>}
            </div>
        )
    }
}

// 商品列表
const ItemList = (props) => {
    return (
        <div>
            <OneItemInfo outdata={props.outdata} platform={props.platform} data={props.data} orderflag={props.orderflag}
                         payPopup={props.payPopup} payPopupMsg={props.payPopupMsg} reminderKnow={props.reminderKnow}/>
        </div>
    )
};


const OneItemInfo = (props) => {
    let {data, platform, orderflag} = props;
    let {isExchange, isGift, isGroupBuy} = data;
    let unWrd = (platform !== "TR_WRD" && platform !== "catering"); //是否为无人店订单，若是，无主图且不跳转
    return (
        <div>
            <Link to={`/item?item_id=${data.item_id}`} onClick={e => !unWrd && e.preventDefault()}>
                <div className="one-item g-row-flex">
                    <div className="item-img">
                        <img
                            src={data.primary_image ? addImageSuffix(data.primary_image, "_s") : require('../../../img/icon/loading/default-no-item.png')}
                            width="70" height="70"/>
                    </div>
                    <div className="item-info g-col-1">
                        <div className="info-top g-row-flex">
                            <div className="info-text g-col-1">
                                <div className="info-title">
                                    {/*{data.promotion_tags === "换购" ? addTag &&
                        <span className="act-label  c-fb">{data.promotion_tags}</span> :
                        data.promotion_tags && <span className="act-label  c-fb">{data.promotion_tags}</span>}*/}
                                    {data.title}
                                </div>
                                <div className="info-props">
                                    {data.spec_nature_info}
                                </div>
                                <div className="info-price">
                                    <span className="left">¥{Number(data.price).toFixed(2)}</span>
                                    <span className="right">×{data.num}</span>
                                </div>
                                <div className="tag-container">
                                    {isExchange && <span className="label deepred-label">换购</span>}
                                    {isGift && <span className="label deepred-label">赠品</span>}
                                    {isGroupBuy && <span className="label deepred-label">拼团</span>}
                                    {!!(!isGift && data.is_free_refund && data.is_free_refund === 1) &&
                                    <span className="label violet-label">7天可退</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
            {orderflag == 2 && <OneItemCtrl {...props} />}
        </div>
    )
};


//控制商品行btn权限
class OneItemCtrl extends Component {
    btnOrlink = () => {
        let {data, outdata,reminderKnow} = this.props;
        let {showAfterSaleTimeOutMsg, showGtAfterSaleCountMsg}=data;
        if (showAfterSaleTimeOutMsg) {
            reminderKnow(true, "商品无法申请售后，可能已经超过售后保障期");
        } else if (showGtAfterSaleCountMsg) {
            reminderKnow(true, "最多可以发起3次售后申请");
        } else {
            browserHistory.push(`/afterSale/apply?tid=${data.no}&refund=${ordersubStatusAndIconMap[outdata.status]['status'] === "待发货" ? 1 : 0}`)
        }

    };
    afterStatus = () => {
        let {data} = this.props;
        let afterStatus;
        switch (data.afterSaleStatus) {
            case 10:
            case 40:
            case 50:
                if (data.canAfterSale && data.afterSaleInfo) {
                 afterStatus =
                        <Link to={`/afterSale/detail?oid=${data.afterSaleInfo.bn}`} className="btn">售后中</Link>;
                }
                break;
            case 20:
            case 30:
                if (data.afterSaleInfo) {
                    afterStatus =
                        <Link to={`/afterSale/detail?oid=${data.afterSaleInfo.bn}`} className="btn">售后完成</Link>;
                }
                break;
            default:
                if(data.canAfterSale){
                    afterStatus =<a className="btn" onClick={this.btnOrlink}>
                        申请售后
                    </a>
                }
        }
        return  afterStatus;
    };

    render() {
        let {data, payPopup, payPopupMsg, outdata} = this.props;
        let {isGift} = data;
        return (
            <div className="one-item-ctrl">
                {data.isGroupBuy && outdata.status != 30 &&
                <Link to={`/groupDetail?object_id=${outdata.group_buy_info.object_id}`} className="btn">查看团详情</Link>}
                {(outdata.status >= 20 && outdata.status != 30) && !isGift &&<div className="btn" onClick={() => {
                    payPopup({show: !payPopupMsg.show, Msg: data})
                }}>支付信息
                </div>}
                {this.afterStatus()}
            </div>
        )

    }
};
//联系客服
const LinkServer = () => (
    <CustomerService className="link-server">
        <i className="server-line-icon"> </i> <span>联系客服</span>
    </CustomerService>
);

//用户信息
const UserInfo = ({data}) => {
    return (
        <div className="user-info order-list">
            <div className="list">
                <div className="left">支付方式</div>
                <div className="right">{payType[data.pay_type]}</div>
            </div>
            <div className="list">
                <div className="left">配送方式</div>
                <div className="right">
                    {dispatchDelivery[data.shipping_type]}
                </div>
            </div>
        </div>
    )
};

//发票信息
class InvoiceInfo extends Component {
    render() {
        let {data} = this.props;
        let {is_need_invoice, invoice} = data;
        return (
            <div className="user-info order-list">
                {is_need_invoice ?
                    <div>
                        <div className="list" key="invoiceType">
                            <div className="left">发票类型</div>
                            <div className="right">{invoiceTypeMap[invoice.type]}</div>
                        </div>
                        {(invoice.type == 1 || invoice.type == 3) && <div className="list" key="invoice_header">
                            <div className="left">发票抬头</div>
                            <div className="right">{invoice.title}</div>
                        </div>}
                        {(invoice.type == 1 || invoice.type == 3) && <div className="list" key="contentOption">
                            <div className="left">发票内容</div>
                            <div className="right">{contentOption[invoice.info.content_option]}</div>
                        </div>}
                        {invoice.type == 3 && <div className="list" key="invoiceEmail">
                            {invoice.info.receiver_email && <div className="left">收票人邮箱</div>}
                            {invoice.info.receiver_email &&
                            <div className="right">{invoice.info.receiver_email}</div>}
                        </div>}
                        {invoice.type == 2 && <div className="list" key="invoiceUnitname">
                            {invoice.unit_name && <div className="left">单位名称</div>}
                            {invoice.unit_name && <div className="right">{invoice.unit_name}</div>}
                        </div>}
                        {invoice.type == 2 && <div className="list" key="invoiceAddress">
                            {invoice.info.receiver_address && <div className="left">收票地址</div>}
                            {invoice.info.receiver_address &&
                            <div className="right">{invoice.info.receiver_address}</div>}
                        </div>}
                    </div> :
                    <div className="list">
                        <div className="left">发票信息</div>
                        <div className="right">不开发票</div>
                    </div>
                }
            </div>
        )

    }
}

//单号价格信息
class OrderTotal extends Component {
    render() {
        let {data, orderflag} = this.props;
        let {discount_summary, post_fee, total_fee, tax_fee = 0, payment} = data;
        let {promotion = 0, coupon = 0, hb = 0, vip = 0} = discount_summary;
        let UNWRDANDCAT = true;   //不是无人店或者咖啡店隐藏运费税费 平台级订单数据结构与店铺级不一致做判断
        orderflag == 1 ?
            UNWRDANDCAT = (data.platform_from !== "TR_WRD" && data.platform_from !== "catering") :
            UNWRDANDCAT = (data.order.platform_from !== "TR_WRD" && data.order.platform_from !== "catering");
        return (
            <div className="order-list">
                <div className="total-list">
                    <div className="list">
                        <div className="left">商品总额</div>
                        <div className="right">¥{(+total_fee).toFixed(2)}</div>
                    </div>
                    {promotion > 0 && <div className="list">
                        <div className="left">促销优惠</div>
                        <div className="right">- ¥{(+promotion).toFixed(2)}</div>
                    </div>}
                    {vip > 0 && <div className="list">
                        <div className="left">会员折扣</div>
                        <div className="right">- ¥{(+vip).toFixed(2)}</div>
                    </div>}
                    {UNWRDANDCAT &&
                    <div className="list">
                        <div className="left">运费</div>
                        <div className="right"> ¥{(+post_fee).toFixed(2)}</div>
                    </div>}
                    {tax_fee > 0 && UNWRDANDCAT &&
                    <div className="list">
                        <div className="left">税费</div>
                        <div className="right"> ¥{(+tax_fee).toFixed(2)}</div>
                    </div>}
                    {coupon > 0 && <div className="list">
                        <div className="left">优惠券抵扣</div>
                        <div className="right">- ¥{(+coupon).toFixed(2)}</div>
                    </div>}
                    {hb > 0 && <div className="list">
                        <div className="left">红包抵扣</div>
                        <div className="right">- ¥{(+hb).toFixed(2)}</div>
                    </div>}
                    <div className="total-pay">
                         <span
                             className="payleft">订单总价&nbsp;&nbsp;
                            </span>
                        <span className="payright">
                            ¥{(+payment).toFixed(2)}
                        </span>
                    </div>
                </div>

            </div>
        )
    }
}

//单号时间
const OrderTime = ({data}) => {
    return (
        <div className="order-list">
            <div className="total-price">
                <div className="time">订单编号：
                    <textarea id="copyText" defaultValue={data.no} readOnly/>
                    <button className="copy" data-clipboard-target="#copyText">复制</button>
                </div>
                <div className="time">创建时间：{data.created_at}</div>
                {data.payed_at && <div className="time">付款时间：{data.payed_at}</div>}
                {data.consigned_at && <div className="time">发货时间：{data.consigned_at}</div>}
                {data.received_at && <div className="time">成交时间：{data.received_at}</div>}

            </div>
        </div>
    )
};


//商城2支付控制
//支付信息弹窗
class PopupPayDetail extends Component {
    render() {
        let {payPopupMsg, payPopup, payType} = this.props;
        const payDetailType = {
            'EcardRecharge': '充值e卡',
            'EcardActivity': '活动e卡',
            'Alipay': '支付宝',
            'Weixin': '微信',
            'Loan': '口袋钱包',
        };
        return (
            <div onClick={() => {
                payPopup({show: false})
            }}>
                {payPopupMsg.show && <Shady/>}
                <div className={`popup-total ${payPopupMsg.show ? "active" : ""}`} onClick={(e) => e.stopPropagation()}>
                    <div className="popup-top">
                        <span>支付分摊明细</span>
                        <i className="close-nobg-icon" onClick={() => {
                            payPopup({show: false})
                        }}></i>
                    </div>
                    {payPopupMsg.Msg &&
                    <div className="list-grid">
                        {payPopupMsg.Msg.payments.length ?
                            (payType === 10 ?
                                payPopupMsg.Msg.payments.map((item, i) => {
                                    return <div className="list g-row-flex" key={i}>
                                        <div className="left">{payDetailType[item.biz]}</div>
                                        <div className="right g-col-1">¥{parseFloat(item.amount).toFixed(2)}</div>
                                    </div>
                                })
                                :
                                <div className="list g-row-flex">
                                    <div className="left">线下支付</div>
                                    <div
                                        className="right g-col-1">¥{parseFloat(payPopupMsg.Msg.payment).toFixed(2)}</div>
                                </div>) : <NoPayMessage/>
                        }
                    </div>}
                </div>
            </div>
        )
    }
}

const NoPayMessage = () => (
    <div className="c-tc" style={{padding: "43px 0 55px"}}>
        <img src={require('../../../img/icon/fenTan.png')} width="58" height="54"/>
        <p className="c-cc9 c-fs12 c-mt15">暂无支付分摊明细</p>
    </div>
);
//拼团校验接口（订单列表，收银台（未引入）也是引入此方法）
export const groupCheckaxios = (params) => {
    let {promotion_id, tid, object_id, isGroupBuy} = params;
    axios.request({
        ...pageApi.GroupBuy,
        data: {
            promotion_id: promotion_id,
            object_id: object_id || 0,
            order_no: tid
        }
    }).then(({data}) => {
        if (data.data.status) {
            browserHistory.push(`/cashier?tid=${tid}&from=list&zeroBuy=1&isGroupBuy=${isGroupBuy}&promotionId=${promotion_id}&backUrl=${location.href}`);
        }
    }).catch(err => {
        console.log(err);
        Popup.MsgTip({msg: err.response.data.message});
    })

}

//底部操作按钮
class OrderCtrl extends Component {
    render() {
        let {
            status, tid, buyType, isWrd, isGroupBuy = false, order_shops,
            pay_status, order_goods = [], cancelOrderPoup, PopupCancelMsg,consign_status,consigned_at
        } = this.props;
        //halfSend部分发货oreadySend已经发货
        let halfSend = consign_status==20;
        let oreadySend=consigned_at!=null;
        let unWrd = (isWrd !== "TR_WRD" && isWrd !== "catering");  //是否为无人店订单
        let btnGroup = "";
        //isGroupBuy拼团校验字段
        let promotion_id = 0;
        if (isGroupBuy) {
            let promotions = order_shops[0].order_goods[0].promotions;
            promotions.map((item, i) => {
                if (item.extra.type === 'GroupBuy') {
                    promotion_id = item.extra.promotion_id;
                }
            })
        }
        ;
        let checkParams = {
            isGroupBuy: isGroupBuy,
            promotion_id: promotion_id,
            tid: tid
        };
        //canFrim控制确认收货提示（若有售后中提示下）
        let canFrim = order_goods.some((item) =>
            afterstatusDeal[item.afterSaleStatus] === '售后中'
        );
        switch (status) {
            //<Link className="ctrl-block cancel-order" key="1" href={`/orderCancel?tid=${tid}`}>取消订单</Link>,
            //href={`/cashier?tid=${tid}&from=list&zeroBuy=1&isGroupBuy=${isGroupBuy}&promotionId=${promotion_id}`}
            case 10:
                btnGroup = [
                    pay_status !== 2 &&
                    <a className="ctrl-block cancel-order" key='1' onClick={() => {
                        cancelOrderPoup({show: !PopupCancelMsg.show, Msg: tid})
                    }}>取消订单
                    </a>,
                    pay_status !== 2 && <a className={unWrd ? 'ctrl-red pay-order' : 'ctrl-grey'} key="3" onTouchTap={(e) => {
                        unWrd ? this.props.checkGroupBuy(checkParams) : e.preventDefault();
                    }}>
                        {buyType === 20 ? "线下公司转账" : "立即支付"}
                    </a>];
                break;
            case 40:
                btnGroup = [
                    unWrd && <Link className="ctrl-block" key="1" to={`/logistics?tid=${tid}`}>查看物流</Link>,
                    <a className="ctrl-red pay-order" key="2" onClick={() => {
                        this.props.onConf(halfSend, canFrim)
                    }}
                       href="javascript:;">确认收货</a>
                ];
                break;
            case 50:
                btnGroup = [
                    <a className="ctrl-block" key="3" onClick={this.props.onDelete}>删除订单</a>,
                    unWrd && <Link className="ctrl-block" key="2" to={`/logistics?tid=${tid}`}>查看物流</Link>,
                    <Link className="ctrl-red pay-order" key="31" to={`/evaluateInput?tid=${tid}`}>评价晒单</Link>
                ];
                break;
            case 60:
                btnGroup = [
                    unWrd && <Link className="ctrl-block" key="2" to={`/logistics?tid=${tid}`}>查看物流</Link>,
                    <a className="ctrl-block" key="3" onClick={this.props.onDelete}>删除订单</a>
                ];
                break;
            case 30:
            case 31:
                btnGroup = [<a className="ctrl-block" key="40" onClick={this.props.onDelete}>删除订单</a>,
                unWrd && oreadySend && <Link className="ctrl-block" key="41" to={`/logistics?tid=${tid}`}>查看物流</Link>]
                break;
            default:
                break;
        }
        return (
            <div className="order-ctrl c-tr">
                {btnGroup}
            </div>
        )
    }
}

let isReq = false;


const orderCtrlState = function (state, props) {
    return {...state.tradeDetail}
};
const orderCtrlDisp = (dispatch, props) => {
    return {
        dispatch,
        checkGroupBuy: (params) => {
            let {isGroupBuy, promotion_id, tid} = params;
            if (isGroupBuy) {
                groupCheckaxios(params);
            } else {
                browserHistory.push(`/cashier?tid=${tid}&from=list&zeroBuy=1&isGroupBuy=${isGroupBuy}&promotionId=${promotion_id}`);
            }
        },
        onDelete: function () {
            Popup.Modal({
                isOpen: true,
                msg: "是否要删除订单？删除后，您可在泰然城官网的订单回收站恢复"
            }, () => {
                if (isReq) return;
                isReq = true;
                axios.request({
                    ...pageApi.del,
                    params: {no: props.tid}
                }).then(result => {

                    isReq = false;
                    Popup.MsgTip({msg: "删除成功"});
                    window.setTimeout(() => {
                        browserHistory.goBack();
                    }, 1000);
                }).catch(err => {
                    isReq = false;
                    Popup.MsgTip({msg: err.response.data.message || "网络错误，删除失败"});
                    console.log(err);
                })
            });
        },
        onConf: function (halfSend, canFrim) {
            Popup.Modal({
                isOpen: true,
                msg: `${halfSend ? `订单存在未发货的商品，是否要确认收货？` : (canFrim ? `订单存在售后中的商品，是否确认收货？` : `是否要确认收货？`)}`
            }, () => {
                if (isReq) return;
                isReq = true;
                axios.request({
                    ...pageApi.conf,
                    params: {no: props.tid}
                }).then(result => {
                    if (result.data.code === 0) {
                        isReq = false;
                        Popup.MsgTip({msg: "确认收货成功"});
                        window.setTimeout(() => {
                            dispatch(axiosCreator('getData', {...pageApi.shopinit, params: {no: props.tid}}));
                        }, 1000);
                    }
                })
            });
        }
    }
};
const OrderCtrlConnect = connect(orderCtrlState, orderCtrlDisp)(OrderCtrl);

//结束

function tradeDetailState(state, props) {
    return {
        ...state.tradeDetail,
        ...state.popup
    }
}

function tradeDetailDispatch(dispatch, props) {
    let request = false;
    //let tid = props.location.query.tid;
    let no = props.location.query.tid;
    let orderflag = props.location.query.orderflag;
    let url = props.location.pathname + props.location.search;
    return {
        dispatch: dispatch,
        resetData() {
            dispatch(createActions('resetData'));
        },
        promptClose() {
            dispatch(popupActions('ctrlPrompt', {prompt: {show: false, msg: ""}}));
        },
        modalClose() {
            dispatch(createActions('ctrlModal', {prompt: {show: false, msg: "", modalSure: ""}}));
            request = false;
        },
        getData: () => {
            let ctrlPage;
            orderflag == 1 ? ctrlPage = {...pageApi.init} : ctrlPage = {...pageApi.shopinit};
            dispatch(axiosCreator('getData', {...ctrlPage, params: {no: no}}, url));

        },
        //支付信息弹窗
        onPayPopup: (status) => {
            dispatch(createActions('payPopup', {status}));
        },
        //取消订单弹窗
        cancelOrderPoup: (status) => {
            dispatch(createActions('cancelPopup', {status}));
        },
        changeReason: (type) => {
            dispatch(createActions('changeReason', {reason: type}));
        },
        //售后提示语弹窗
        reminderKnow: (status, msg) => {
            dispatch(createActions('ctrlModalapply', {modalAS: {status: status, msg: msg}}))
        },
    }
}
export default connect(tradeDetailState, tradeDetailDispatch)(TradeDetail);
