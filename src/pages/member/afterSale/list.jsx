import React, {Component} from 'react';
import {browserHistory, Link} from 'react-router';
import {connect} from 'react-redux';
import {asProcess, asStatus, asTypes, ordersubStatusAndIconMap, storeIcon} from 'js/filters/orderStatus';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import {timeUtils} from 'js/common/utils';
import {LoadingRound, NoMorePage} from 'component/common';
import Popup from 'component/modal2';
import {ModalAComp} from 'component/modal';
import {WXAPI} from 'config/index'
import axios from 'js/util/axios';
import {dateUtil,addImageSuffix} from "js/util/index";


const pageApi = {
    init: {url: `${WXAPI}/user/sold/list`, method: "get"},
    revoke: {url: `${WXAPI}/user/sold/recall`, method: "post"}
};

const createActions = concatPageAndType('afterSaleList');
const axiosCreator = actionAxios("afterSaleList");

class AfterSaleList extends Component {
    componentWillMount() {
        this.props.getData();
    }

    componentDidMount() {
        let self = this;
        $(window).bind('scroll.loadmore', function () {
            let $this = $(this);
            let scrollH = $this.scrollTop();
            let scrollHeight = $(".order-list").height() - $(window).height() - 30;
            if (scrollH > scrollHeight) {
                if (self.props.hasMore && (!self.props.sending)) {
                    self.props.changeSending(true);
                    self.props.addData(self.props.page);
                }
            }
        })
    }

    componentWillUnmount() {
        $(window).unbind('scroll.loadmore');
        this.props.dispatch(createActions('resetData'));
    }

    render() {
        let {reminderKnow} = this.props;
        if (this.props.load) {
            return <LoadingRound/>;
        }
        if (!(this.props.data && this.props.data.length)) {
            return <NoMorePage text={"您还没有售后记录哦"}/>;
        }
        return (
            <div data-page="after-sale-list">
                <div className="order-list">
                    <OrderList data={this.props.data} reminderKnow={reminderKnow}/>
                    <div style={{height: '30px', marginTop: '-10px'}}
                         className="c-tc c-fs14 c-lh30 c-cc9">{this.props.hasMore ? '加载中...' : '别拉了，我是有底线的~'}</div>
                    <ModalAComp active={this.props.AS}
                                msg={this.props.msg}
                                btns={[{
                                    text: "我知道了", cb: () => {
                                        this.props.dispatch(createActions('ctrlModal', {
                                            modal: "AS",
                                            status: false
                                        }))
                                    }
                                }]}/>
                </div>
            </div>
        )
    }
}

class OrderList extends Component {
    render() {
        let {data, reminderKnow} = this.props;
        return <div> {
            data.map((item, i) => {
                return <OneOrderGrid data={item} key={i} reminderKnow={reminderKnow}/>
            })
        }</div>
    }
}

const OneOrderGrid = ({data, reminderKnow}) => {
    return (
        <div className="one-order-grid">
            <StripTop data={data}/>
            <OneOrder data={data}/>
            <Dealstatus data={data}/>
            {/*{( ( ( data.aftersales_type === "REFUND_GOODS" && (data.progress == 0 || data.progress == 1) ) ||
                (data.aftersales_type === "ONLY_REFUND" && (data.progress == 0 || data.progress == 8)))
                || Number(data.progress) === 1)
			&& 	<OrderCtrl data={data} />}*/}
            {/*{(((data.type == 20 && (data.status == 10 || data.status == 40)) ||
                    (data.type == 10 && (data.status == 10 || data.status == 20)))
                    || data.status == 40)
                && <OrderCtrl data={data} reminderKnow={reminderKnow}/>}*/}
            {!(data.status == 50 || data.status == 30) && <OrderCtrl data={data} reminderKnow={reminderKnow}/>}
        </div>
    )
}

//一个订单头部
class StripTop extends Component {
    render() {
        let {shop, type} = this.props.data;
        let {is_open, id, alias, name, shop_icon} = shop;
        return (
            <div className="order-info-time">
                <div className="shop-name">
                    {storeIcon(shop_icon)}
                    <a href={is_open === 1 ? `/store/home?shop=${id}` : 'javascript:void(0)'}>
                        <span className="left">{alias ? alias : name}</span>
                    </a>
                </div>
                {is_open === 1 &&
                <div className="arrow-right">
                    <a href={is_open === 1 ? `/store/home?shop=${id}` : 'javascript:void(0)'}>
                        <img src="/src/img/icon/arrow/arrow-right-m-icon.png"/>
                    </a>
                </div>}
                <span className="right order-status">{asTypes[type]}</span>
            </div>

        )
    }
}

//订单处理状态
class Dealstatus extends Component {
    render() {
        let {status,extra,now} = this.props.data;
        return (
            <div className="order-ctrl deal-status">
                <span>{asProcess[status]}</span>
                {status == 40 &&extra&&<LogicBlock timeout = {extra.delivery_due} now={now}/>}
            </div>
        )
    }
}

//一件商品订单
class OneOrder extends Component{
    render(){
        let {data} = this.props;
        // let {bn,gifts=[]} = data;
        return (
            <div className="one-order">
                <OneOrderInfo data={data}/>
                {/*{!!gifts.length&&gifts.map((item,i)=>{
                    return <Gifts data={item} key={i} bn={bn}/>
                })}*/}
            </div>
        )
    }

};
class Gifts extends Component {
    render() {
        let {data,bn} = this.props;
        let {} = data;
        return (
            <div className="one-order">
                <div className="order-info">
                    <div className="list-body">
                        <div className="list-img">
                            <Link to={`/afterSale/detail?oid=${bn}`}>
                                <img src={data.primary_image}/>
                            </Link>
                        </div>
                        <div className="list-body-ctt">
                            <div className="order-info-detail">
                                <div className="order-info-top">
                                    <Link to={`/afterSale/detail?oid=${bn}`}
                                          className="order-info-title">{data.title}</Link>
                                    <div className="order-info-type">{data.spec_nature_info}</div>
                                    <span className="gifts-lable">赠品</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <div className="gifts">
                            <span className="tag">【赠品】</span>
                            <div className="gTitle">{data.title}</div>
                            <span className="price">× {data.num}</span>
                        </div>*/}
                </div>
            </div>
        )
    }
}
//一件商品订单信息
const OneOrderInfo = ({data}) => {
    let {bn, goods_order,item_type} = data;
    return (
        <div className="order-info">
            <div className="list-body">
                <div className="list-img">
                    <Link to={`/afterSale/detail?oid=${bn}`}>
                        <img
                            src={goods_order.primary_image ? addImageSuffix(goods_order.primary_image, '_s') : require('../../../img/icon/loading/default-no-item.png')}/>
                    </Link>
                </div>
                <div className="list-body-ctt">
                    <div className="order-info-detail">
                        <div className="order-info-top">
                            <Link to={`/afterSale/detail?oid=${data.bn}`}
                                  className="order-info-title">{goods_order.title}
                            </Link>
                            <div className="info-price">
                                <div className="order-info-type">{goods_order.spec_nature_info}</div>
                                {/*<div className="right">×{data.num}</div>*/}
                            </div>
                            {item_type==20&&<div>
                                <span className="gifts-lable">赠品</span>
                            </div>}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
};


class OrderCtrl extends Component {
    cancelDelete = () => {
        Popup.Modal({
            isOpen: true,
            msg: "您最多可以在售后保障期内发起3次申请，确定撤销？"
        }, () => {
            axios.request({
                ...pageApi.revoke,
                data: {after_sale_bn: this.props.data.bn}
            }).then(result => {
              Popup.MsgTip({msg: "撤销成功"});
              window.location.reload();

            }).catch(err => {
                Popup.MsgTip({msg: err.response.data.message||"小泰发生错误，请稍后再试~"});
            })
        })
    };
    btnOrlink = (isTimeout, isCountout) => {
        let {data, reminderKnow} = this.props;
        if (isTimeout) {
            reminderKnow(true, "商品无法申请售后，可能已经超过售后保障期");
        } else if (isCountout) {
            reminderKnow(true, "最多可以发起3次售后申请");
        } else {
            browserHistory.push(`/afterSale/apply?tid=${data.order_good_no}&refund=${ordersubStatusAndIconMap[data.goods_order.order_shop.status]['status'] === "待发货" ? 1 : 0}`)
        }

    };
    render() {
        let {data, reminderKnow} = this.props;
        let {type, status, bn, is_timeout, is_count_run_out} = data;
        return <div className="order-ctrl">
            {/*{ ( ( data.aftersales_type === "REFUND_GOODS" && (data.progress == 0 || data.progress == 1) ) ||
                (data.aftersales_type === "ONLY_REFUND" && (data.progress == 0 || data.progress == 8))) &&
            <Link onClick={this.cancelDelete} className="btn-red">撤销退款</Link>}
			{ Number(data.progress) === 1 && <Link to={`/afterSale/logistics?asid=${data.aftersales_bn}`} className="btn">填写物流</Link> }*/}
            {/*{((data.type == 20 && (data.status == 10 || data.status == 40)) ||
                (data.type == 10 && (data.status == 10 || data.status == 20))) &&
            <Link onClick={this.cancelDelete} className="btn-red">撤销退款</Link>}*/}
            {status == 10
            && <Link onClick={this.cancelDelete} className="btn-red">撤销退款</Link>}
            {status == 40 &&
            <Link to={`/afterSale/detail?oid=${bn}`} className="btn">填写物流</Link>}
            {/*{data.status != 30 && data.applicable && <Link
                to={`/afterSale/apply?tid=${data.order_good_no}&refund=${ordersubStatusAndIconMap[data.goods_order.order_shop.status]['status'] === "待发货" ? 1 : 0}&payment=${+data.goods_order.payment}`}
                className="btn">申请售后</Link>}*/}
            {/60|70|80/.test(status) && <a className="btn" onClick={() => {
                this.btnOrlink(is_timeout, is_count_run_out)
            }}>
                申请售后
            </a>}
        </div>
    }
}



function afterSaleListState(state) {
    return {
        ...state.afterSaleList
    }
}

//物流超时倒计时
export class LogicBlock extends Component {
    constructor(props) {
        super(props);
        let retime;
        let {timeout,now} = this.props;
        //retime = parseInt(new Date(timeout.replace(/-/g, '/')).getTime() / 1000) - (parseInt(new Date().getTime() / 1000));
        retime = timeout - now;
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
        let html='';
        let day,hours,min,sec;
        day=this.formatTime(retime / 3600 / 24);
        hours=this.formatTime(retime / 3600 % 24);
        min=this.formatTime(retime % 3600/60);
        sec=this.formatTime(retime %60);
        html=day!=0? `${day}天${hours}时`: (hours!=0? `${hours}时${min}分`:`${min}分${sec}秒`);
        return html;
    };
    render() {
        let {retime} = this.state;
        return (
            <span className="block-time">
                <span>还剩{this.dealTime(retime)}</span>
            </span>
        );

    }
}


function afterSaleListDispatch(dispatch) {
    return {
        dispatch,
        getData: () => {
            dispatch(axiosCreator('getData', {...pageApi.init, params: {page: 1, page_size: 10}}, {page: 1}));
        },
        addData: (page) => {
            dispatch(axiosCreator('addData', {...pageApi.init, params: {page: page, page_size: 10}}, {page: page}));
        },
        changeSending: (tof) => {
            dispatch(createActions('changeSending', {value: tof}));
        },
        reminderKnow: (status, msg) => {
            dispatch(createActions('ctrlModal', {modal: "AS", status: status, msg: msg}))
        },
    }
}

export default connect(afterSaleListState, afterSaleListDispatch)(AfterSaleList);