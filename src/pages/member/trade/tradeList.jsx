import React, {Component} from 'react';
import {browserHistory, Link} from 'react-router';
import {connect} from 'react-redux';
import {AllNoMoreOrder, LoadingRound, NoMore, NoMoreOrder,FastGuide} from 'component/common';
import {ModalAComp, PopupModal, PopupTip} from 'component/modal.jsx';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import {
    afterstatusDeal,
    cancelOrderMap,
    orderStatusMap,
    ordersubStatusAndIconMap,
    storeIcon,
    confimStatus
} from 'js/filters/orderStatus';
import {timeUtils} from 'js/common/utils';
import {addImageSuffix} from "js/util/index";
import axios from 'js/util/axios';
import {WXAPI} from 'config/index'
import './trade.scss';
import {PopupCancelDetail} from './newOrderCancel'
import {groupCheckaxios} from './tradeDetail'

const pageApi = {
    init: {url: `${WXAPI}/user/order/list`, method: "get"},
    initshop: {url: `${WXAPI}/user/shopOrder/list`, method: "get"},
    del: {url: `${WXAPI}/user/shopOrder/discard`, method: "post"},
    conf: {url: `${WXAPI}/user/shopOrder/confirmReceived`, method: "post"}
};

const createActions = concatPageAndType("tradeList");
const axiosCreator = actionAxios("tradeList");
let listSwiper;

//订单列表
class TradeList extends Component {
    constructor(props) {
        super(props);
        this.orderStatus = ["all", "waitPay", "waitSend", "waitConfirm", "waitRate"];
    }

    componentWillMount() {
        if (!this.props.flag) {
            this.props.resetData();
        } else {
            //原来数据
            let { currentPage, status, dispatch} = this.props;
            let crtlbackPage;
            status == 0 || status == 1 ? crtlbackPage = {...pageApi.init} : crtlbackPage = {...pageApi.initshop};
            dispatch(axiosCreator("getbackData",
                {
                    ...crtlbackPage,
                    params: {page: Number(currentPage), page_size: 10, status: this.orderStatus[status]}
                },
                {type: this.orderStatus[status], page: currentPage, url: location.pathname}))
        }
    }

    componentDidMount() {
        if (this.props.flag) {
            this.props.dispatch(createActions('saveHistroy', {flag: false}));
        }
        this.addSlide(this.refs.list);
    }

    addSlide(dom) {
        let {dispatch, status, location, flag} = this.props, self = this;
        listSwiper = new Swiper(dom, {
            initialSlide: status,
            onSlideChangeStart: (swiper) => {
                !self.props.flag && dispatch(createActions('resetData'));
                //防止数据未返回就渲染页面
                let crtlPage;
                swiper.activeIndex === 0 || swiper.activeIndex === 1 ? crtlPage = {...pageApi.init} : crtlPage = {...pageApi.initshop};
                browserHistory.replace(this.props.navList[swiper.activeIndex].url);
                !self.props.flag && dispatch(axiosCreator("getData",
                    {...crtlPage, params: {page: 1, page_size: 10, status: this.orderStatus[swiper.activeIndex]}},
                    {type: this.orderStatus[swiper.activeIndex], page: 1, url: location.pathname}));
                if (self.props.flag) {
                    dispatch(createActions('saveHistroy', {flag: false}));
                }
            },
            onTouchStart: (swiper) => {
                if (swiper.activeIndex === 0) {
                    swiper.lockSwipeToPrev();
                } else {
                    swiper.unlockSwipeToPrev();
                }
                if (swiper.activeIndex === swiper.slides.length - 1) {
                    swiper.lockSwipeToNext();
                } else {
                    swiper.unlockSwipeToNext();
                }
            }
        });
        if (Number(listSwiper.activeIndex) === 0 && !flag) {
            dispatch(axiosCreator("getData",
                {...pageApi.init, params: {page: 1, page_size: 10, status: this.orderStatus[0]}},
                {type: this.orderStatus[0], page: 1, url: location.pathname}
            ))
        }
    }

    navClickHandle = (index) => {
        listSwiper.slideTo(index, 300, true);
    }

    promptClose = () => {
        this.props.dispatch(createActions('ctrlPrompt', {prompt: {show: false, msg: ""}}));
    }
    modalClose = () => {
        this.props.dispatch(createActions('ctrlModal', {prompt: {show: false, msg: "", modalSure: ""}}));
    }
    cancelOrderPoup = (status) => {
        this.props.dispatch(createActions('cancelPopup', {status}));
    }
    changeReason = (type) => {
        this.props.dispatch(createActions('changeReason', {reason: type}));
    };

    render() {
        let {cancel_reason, dispatch, PopupCancelMsg, saveTop} = this.props;
        return (
            <div data-plugin="swiper" data-page="trade-list" style={{height: $(window).height(), overflow: "hidden"}}>
                <section ref="list" className="swiper-container trade-list">
                    <ListNav data={this.props.navList} status={this.props.status}
                             clickHandle={this.navClickHandle}/>
                    <ListInfo listLength="5" orderStatus={this.orderStatus}
                              swiper={listSwiper} {...this.props} />
                </section>
                <PopupCancelDetail PopupCancelMsg={PopupCancelMsg} cancelOrderPoup={this.cancelOrderPoup}
                                   changeReason={this.changeReason} cancel_reason={cancel_reason} dispatch={dispatch}
                                   createActions={createActions}/>
                <PopupModal active={this.props.modal.show} msg={this.props.modal.msg}
                            onClose={this.modalClose}
                            onSure={this.props.modal.modalSure}/>
                <PopupTip active={this.props.prompt.show} msg={this.props.prompt.msg} onClose={this.promptClose}/>
                <TradeSearch/>
                <ModalAComp active={this.props.custom.show}
                            msg={"快去评论商品，给小伙伴一个参考吧"}
                            title={'确认收货成功！'}
                            btns={[
                                {
                                    text: "下次再说", cb: () => {
                                        location.reload();
                                        this.props.dispatch(createActions('ctrlCustom', {custom: {show: false}}));
                                    }
                                },
                                {
                                    text: "立即评论", cb: () => {
                                        this.props.dispatch(createActions('ctrlCustom', {custom: {show: false}}));
                                        //location.reload();
                                        browserHistory.push('/evaluateInput?tid=' + this.props.custom.tid);
                                    }
                                }
                            ]}
                />
                <FastGuide orderPage={true}/>
            </div>
        );
    }
}

//导航栏
class ListNav extends Component {
    clickHandle = (url, index, e) => {
        e.preventDefault();
        browserHistory.replace(url);
        this.props.clickHandle(index);
    };

    render() {
        return (
            <nav className="trade-list-nav">
                {
                    this.props.data.map((item, i) => {
                        return <Link to={item.url} className="nav-list" key={i} activeClassName="active"
                                     onClick={this.clickHandle.bind(this, item.url, i)}>
                            <span>{item.text}</span>
                        </Link>
                    })
                }
            </nav>
        );
    }
}

class ListInfo extends Component {
    getHtml() {
        let {orderStatus, list, dispatch, PopupCancelMsg, tradeDetailClick, saveTop, hasMore, isSending} = this.props;
        let l = this.props.listLength,
            html = [],
            i = 0;
        while (l > i) {
            html.push(<OneListInfoCtrlConnect status={orderStatus[i]} swiper={this.props.swiper} key={i} orderStatus={orderStatus}
                                              PopupCancelMsg={PopupCancelMsg} tradeDetailClick={tradeDetailClick}
                                              saveTop={saveTop} hasMore={hasMore} isSending={isSending}/>);
            i++;
        }
        return html;
    }

    render() {
        return (
            <div className="swiper-wrapper list-main">
                {this.getHtml()}
            </div>
        )
    }
}

//一个列表控制
class OneListInfoCtrl extends Component {
    //下拉加载函数
    addData = () => {
        let {dispatch, isSending, list, swiper, orderStatus} = this.props;
        let crtlPage;
        swiper.activeIndex === 0 || swiper.activeIndex === 1 ? crtlPage = {...pageApi.init} : crtlPage = {...pageApi.initshop};
        if (isSending) {
            axios.request({
                ...crtlPage,
                params: {page: Number(list.page) + 1, page_size: 10, status: orderStatus[swiper.activeIndex]}
            })
                .then(result => {
                    dispatch(createActions('concatDataSuccess', {
                        result: result.data,
                        dataType: orderStatus[swiper.activeIndex],
                        page: Number(list.page) + 1
                    }));
                }).catch(error => {
                console.log(error);
                dispatch(createActions('concatDataError', {error: error}));
                return;
            })
        }
    };

    componentDidMount() {
        //返回滚动事件
        let {saveTop} = this.props;
        //上拉加载事件
        let self = this;
        setTimeout(function () {
            $('.swiper-slide-active').bind('scroll.loadmore', function () {
                let $this = $(this);
                let scrollH = $this.scrollTop();
                let scrollHeight = $(".list-data").height() - $(window).height() - 30;
                let {dispatch, hasMore, isSending} = self.props;
                if (scrollH > scrollHeight && $(".list-data").height() != null) {
                    if (hasMore && (!isSending)) {
                        dispatch(createActions('changeSending', {isSending: true}));
                        self.addData()

                    }
                }
            })
            $('.swiper-slide-active').scrollTop(saveTop);
        }, 0);


    }

    componentWillUnmount() {
        $('.swiper-slide-active').unbind('scroll.loadmore');
    }

    componentWillReceiveProps(nextProps) {
        //点击tab进入详情返回点击其他tab滚动区域事件失效在绑定一次
        let {saveTop} = this.props;
        //上拉加载事件
        let self = this;
        setTimeout(function () {
            $('.swiper-slide-active').bind('scroll.loadmore', function () {
                let $this = $(this);
                let scrollH = $this.scrollTop();
                let scrollHeight = $(".list-data").height() - $(window).height() - 30;
                let {dispatch, hasMore, isSending} = self.props;
                if (scrollH > scrollHeight && $(".list-data").height() != null) {
                    if (hasMore && (!isSending)) {
                        dispatch(createActions('changeSending', {isSending: true}));
                        self.addData()
                    }
                }
            })
            //$('.swiper-slide-active').scrollTop(saveTop);
        }, 0);
    }

    render() {
        let {list, status, PopupCancelMsg, tradeDetailClick, saveTop, hasMore, isSending, dispatch} = this.props;
        return <div className="swiper-slide" ref="list"
                    style={{overflow: 'auto', height: document.body.clientHeight - 40}}>
            {list.load ?
                <LoadingRound/>
                :
                (list.data && list.data.length ?
                        <OneListInfo swiper={this.props.swiper}
                                     list={list} listStatus={status}
                                     PopupCancelMsg={PopupCancelMsg}
                                     tradeDetailClick={tradeDetailClick} saveTop={saveTop} hasMore={hasMore}
                                     isSending={isSending} dispatch={dispatch}/>
                        :
                        status == 'all' ? <AllNoMoreOrder/> : <NoMoreOrder/>
                )
            }
        </div>
    }

}

function OneListInfoDispatch(dispatch, props) {
    return {
        dispatch: dispatch
    }
}

function dropDownListState(state, props) {
    let status = props.swiper && props.orderStatus[props.swiper.activeIndex];
    return {
        list: state.tradeList.list[status||props.status]
    };
}

const OneListInfoCtrlConnect = connect(dropDownListState, OneListInfoDispatch)(OneListInfoCtrl);

//订单搜索与回顶
class TradeSearch extends Component {
    componentWillUnmount() {
        $(window).unbind('scroll.top');
    }

    componentDidMount() {
        let $window = $(window);
        let windowH = $window.height();
        let $toTop = $(".toTop");
        let time;
        $toTop.on("click", function () {
            clearInterval(time)
            let h = $('.swiper-slide-active').scrollTop();
            time = setInterval(function () {
                h -= 10;
                $('.swiper-slide-active').scrollTop(h);
                if (h <= 0) {
                    clearInterval(time)
                }
            }, 1)
        });
    }

    componentDidUpdate() {
        let $toTop = $(".toTop");
        let activeS = $('.swiper-slide-active');
        activeS.on('scroll', function (e) {
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

        return (
            <div className="search-toTop">
                <ul>
                    <Link to='/tradeSearch'>
                        <li className="search"></li>
                    </Link>
                    <li className="toTop"></li>
                </ul>
            </div>
        )
    }
}

//平台级订单（待支付）
class Platorder extends Component {
    render() {
        let {
            data, count_goods, payment, platform, no, status, orderflag, swiper, isGroupBuy,
            order_shops, pay_type, pay_status, PopupCancelMsg, tradeDetailClick, currentPage
        } = this.props;
        let {order_goods} = order_shops;
        return (
            <li className="one-order">
                <PlatorderInfo data={data} count_goods={count_goods} payment={payment} orderflag={orderflag} no={no}
                               tradeDetailClick={tradeDetailClick} currentPage={currentPage}/>
                <OrderCtrlConnect status={status} tid={no} platform={platform} listStatus={this.props.listStatus}
                                  swiper={swiper} isGroupBuy={isGroupBuy} order_shops={order_shops}
                                  orderflag={orderflag} pay_type={pay_type} pay_status={pay_status}
                                  PopupCancelMsg={PopupCancelMsg} webcancelFrom={'tradeList'}/>
            </li>
        )
    }
}

//平台级订单店铺模板
class ShopplatList extends Component {
    render() {
        let {data, no, orderflag, tradeDetailClick, currentPage} = this.props;
        let goods = data.order_goods.map(function (item, i) {
            return <GoodsList data={item} key={i}/>
        });
        return (
            <div className="item-list">
                {/* <Link className="one-item" to={`/tradeDetail?tid=${no}&orderflag=${orderflag}`}>
                    {goods}
                </Link>*/}
                <Link className="one-item" onClick={() => {
                    tradeDetailClick(no, orderflag, currentPage)
                }}>
                    {goods}
                </Link>
            </div>
        )
    }
}

//GoodsList
export class GoodsList extends Component {
    render() {
        let data = this.props.data;
        let {isExchange, isGift, isGroupBuy, afterSaleStatus} = data;
        return (
            <div className="item-info g-row-flex">
                <div className="item-img c-dpb">
                    <img
                        src={data.primary_image ? addImageSuffix(data.primary_image, "_s") : require('../../../img/icon/loading/default-no-item.png')}
                        width="75" height="75"/>
                    {/*<img src={data.primary_image} width="75" height="75"/>*/}
                </div>
                <div className="g-col-1">
                    <div className="info-top g-row-flex">
                        <div className="info-text g-col-1">
                            <div className="info-title">
                                {data.title}
                            </div>
                            <div className="info-props">
                                {data.spec_nature_info}
                            </div>
                            <div className="tag-container">
                                {isExchange && <span className="label deepred-label">换购</span>}
                                {isGift && <span className="label deepred-label">赠品</span>}
                                {isGroupBuy && <span className="label deepred-label">拼团</span>}
                                {!!(!isGift && data.is_free_refund && data.is_free_refund === 1) &&
                                <span className="label violet-label">7天可退</span>}
                            </div>
                        </div>
                        <div className="info-right">
                            <div className="info-price">¥{Number(data.transaction_price).toFixed(2)}</div>
                            {!!(afterSaleStatus) && <Afterstatus afterSaleStatus={afterSaleStatus}/>}
                        </div>
                    </div>
                    <div className="info-btm">
                        ×{data.num}
                    </div>
                </div>
            </div>
        )
    }
}

//平台级订单信息
class PlatorderInfo extends Component {
    render() {
        let {data, count_goods, payment, no, orderflag, tradeDetailClick, currentPage} = this.props;
        let {order_shops} = data;
        let shops = order_shops.map(function (item, i) {
            return <ShopplatList data={item} key={i} no={no} orderflag={orderflag} tradeDetailClick={tradeDetailClick}
                                 currentPage={currentPage}/>
        });
        return (
            <div className="order-info">
                <div className="order-info-time">
                    <div className="shop-name">
                        {order_shops.length > 1 ? <span className="left">{storeIcon('icon_self')}泰然城</span>
                            :
                            <a href={order_shops[0].shop_info.is_open === 1 ? `/store/home?shop=${order_shops[0].shop_info.id}` : 'javascript:void(0)'}>
                                <span className="left">
                                     {storeIcon(order_shops[0].shop_info.shop_icon)}{order_shops[0].shop_info.alias ? order_shops[0].shop_info.alias : order_shops[0].shop_info.name}
                                </span>
                            </a>}
                    </div>
                    <div className="arrow-right">
                        {order_shops.length == 1 && order_shops[0].shop_info.is_open === 1 &&
                        <a href={order_shops[0].shop_info.is_open === 1 ? `/store/home?shop=${order_shops[0].shop_info.id}` : 'javascript:void(0)'}>
                            <img src="/src/img/icon/arrow/arrow-right-m-icon.png"/></a>}
                    </div>

                    <span className="right order-status">等待付款</span>
                </div>
                {shops}
                <div className="order-count">
                    <span className="order-number">共{count_goods}件商品</span> 合计：<span
                    className="order-total-pay">¥{(+payment).toFixed(2)}</span>
                </div>
            </div>

        )

    }
}

//平台级拆分店铺级订单信息
class ShoporderInfo extends Component {
    render() {
        let {data, orderflag, listStatus, swiper, tradeDetailClick, currentPage} = this.props;
        let {platform_from} = data;
        let shops = data.order_shops.map(function (item, i) {
            return (
                <ShopList data={item} key={i} payment={item.payment} count_goods={item.count_goods}
                          platform={platform_from}
                          orderflag={orderflag} listStatus={listStatus} swiper={swiper}
                          tradeDetailClick={tradeDetailClick} currentPage={currentPage}
                          consign_status={item.consign_status}/>
            )
        });
        return (
            <div className="order-info">
                {shops}
            </div>
        )
    }
}

//平台级拆分店铺级店铺订单列表
class ShopList extends Component {

    render() {
        let {data, count_goods, payment, platform, orderflag, swiper, tradeDetailClick, currentPage} = this.props;
        let {shop_info, status, no, order_goods,consign_status} = data;

        let {id, is_open, name, alias, shop_icon} = shop_info;
        let goods = data.order_goods.map(function (item, i) {
            return <GoodsList data={item} key={i}/>
        });
        return (
            <div className="item-list">
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
                    <span className="right order-status">{status==40?confimStatus[consign_status]:ordersubStatusAndIconMap[status]['status']}</span>
                </div>
                {/* <Link to={`/tradeDetail?tid=${no}&orderflag=${orderflag}`} className="one-item">
                    {goods}
                </Link>*/}
                <Link className="one-item" onClick={() => {
                    tradeDetailClick(no, orderflag, currentPage)
                }}>
                    {goods}
                </Link>
                <div className="order-count">
                    <span className="order-number">共{count_goods}件商品</span> 合计：<span
                    className="order-total-pay">￥{(+payment).toFixed(2)}</span>
                </div>
                <OrderCtrlConnect status={status} tid={no} platform={platform} listStatus={this.props.listStatus}
                                  swiper={swiper}
                                  orderflag={orderflag} order_goods={order_goods} consign_status={consign_status}/>
            </div>
        )
    }
}

//平台级拆分店铺级级订单（支付后）
class Shoporder extends Component {
    render() {
        let {data, orderflag, swiper, tradeDetailClick, currentPage} = this.props;
        return (
            <li className="one-order">
                <ShoporderInfo data={data} no={data.no}
                               orderflag={orderflag} listStatus={this.props.listStatus} swiper={swiper}
                               tradeDetailClick={tradeDetailClick} currentPage={currentPage}/>
            </li>
        )
    }
}

//售后状态
class Afterstatus extends Component {
    render() {
        let {afterSaleStatus} = this.props;
        let html = "";
        switch (afterSaleStatus) {
            case 10:
            case 40:
            case 50:
                html = <div className="info-afterstatus">售后中</div>;
                break;
            case 20:
            case 30:
                html = <div className="info-afterstatus">售后完成</div>;
                break;
            case 60:
            case 70:
            case 80:
                html = null;
                break;
            default:
                html = null;
        }
        return (
            <div className="fight-group-status c-tc c-cfff">
                {html}
            </div>
        );
    }
}

//列表内容
export class OneListInfo extends Component {
    getHtml() {
        let {PopupCancelMsg, tradeDetailClick, saveTop} = this.props;
        return this.props.list.data.map((item, i) => {
            if (this.props.swiper.activeIndex === 0 || this.props.swiper.activeIndex === 1) {  //付款前平台级订单列表
                if (item.status === 10) {   //平台级订单展示(无人店不屏蔽)item.platform_from != "TR_WRD"
                        return <Platorder key={i} data={item} swiper={this.props.swiper} count_goods={item.count_goods}
                                          payment={item.payment} platform={item.platform_from} no={item.no}
                                          status={item.status} orderflag={1} listStatus={this.props.listStatus}
                                          isGroupBuy={item.isGroupBuy} order_shops={item.order_shops}
                                          pay_type={item.pay_type} pay_status={item.pay_status}
                                          PopupCancelMsg={PopupCancelMsg} tradeDetailClick={tradeDetailClick}
                                          currentPage={item.currentPage}/>
                } else {
                    //拆分为店铺级订单展示
                    return <Shoporder key={i} data={item} swiper={this.props.swiper} orderflag={2}
                                      listStatus={this.props.listStatus} tradeDetailClick={tradeDetailClick}
                                      currentPage={item.currentPage}/>
                }
            } else {//付款后店铺级订单  orderflag为2  为店铺级订单详情展示标志  为1为平台级订单详情展示标志
                return <li key={i} className="one-order">
                    <div className="order-info"><ShopList data={item} payment={item.payment} swiper={this.props.swiper}
                                                          count_goods={item.count_goods}
                                                          platform={item.order.platform_from} no={item.no} orderflag={2}
                                                          listStatus={this.props.listStatus}
                                                          tradeDetailClick={tradeDetailClick}
                                                          currentPage={item.currentPage}/></div>
                </li>
            }
        });

    }


    render() {
        let {list, hasMore, isSending} = this.props;
        return (
            <div>
                <div className="list-data">
                    {this.getHtml()}
                </div>
                {hasMore ?
                    (isSending ?
                        <div style={{textAlign: 'center', height: "30px", lineHeight: "30px"}}>
                            <img src={require('../../../img/icon/loading/loading-round.gif')} alt=""/>
                        </div>
                        : <span style={{height: "30px", lineHeight: "30px",textAlign:"center"}}>上拉加载更多</span>) : <NoMore/>}
            </div>


        )
    }


}

//插件写法
//const DropDownList = DropDownLoad(OneListInfo);
/*class DropDownList extends Component {
    render(){
        return(
            <div>
                <OneListInfo {...this.props} />
            </div>
        )
    }
}*/


//订单控制
export class OrderCtrl extends Component {
    getHtml() {
        //let {status, tid, virtual, type, showAfterSale, buyType, platform} = this.props;
        //let unWrd = platform !== "tairango";  //是否为无人店订单
        let {status, tid, platform, orderflag, isGroupBuy, order_shops, pay_type,
            pay_status, canAfterSale, canFrim, PopupCancelMsg,consign_status} = this.props;
        //halfSend部分发货oreadySend已经发货(服务端有bug状态暂时不能用来有物流)
        let halfSend = consign_status==20;
        let oreadySend=consign_status!=10;
        let unWrd = (platform !== "TR_WRD" && platform !== "catering");  //是否为无人店订单
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
        let checkParams = {
            isGroupBuy: isGroupBuy,
            promotion_id: promotion_id,
            tid: tid
        };
        switch (status) {
            case 10:
                btnGroup = [
                    pay_status !== 2 &&
                    <a className="ctrl-block cancel-order" key='1'
                       onClick={() => this.props.cancelOrderPoup({show: !PopupCancelMsg.show, Msg: tid})}>取消订单</a>,
                    pay_status !== 2 &&
                    <Link className={unWrd ? 'ctrl-red pay-order' : 'ctrl-grey'} key="3" onClick={(e) => {
                        unWrd ? this.props.checkGroupBuy(checkParams) : e.preventDefault();
                    }}>
                        {pay_type === 20 ? '线下公司转账' : '立即支付'}
                    </Link>
                ];
                break;
            case 20:
            case 25:
                btnGroup = [
                    canAfterSale && <Link className="ctrl-block" key="1"
                                          to={`/tradeDetail?tid=${tid}&orderflag=${orderflag}`}>申请售后</Link>
                ];
                break;
            //case "待收货/已发货":
            case 40:
                btnGroup = [
                    canAfterSale && <Link className="ctrl-block" key="5"
                                          to={`/tradeDetail?tid=${tid}&orderflag=${orderflag}`}>申请售后</Link>,
                    unWrd && <Link className="ctrl-block" key="2" to={`/logistics?tid=${tid}`}>查看物流</Link>,
                    <a className="ctrl-red pay-order" key="3" onClick={() => {
                        this.props.confirmReceipt(halfSend,canFrim)
                    }}>确认收货</a>
                ];
                break;
            //case "待评价":
            case 50:
                btnGroup = [
                    <a className="ctrl-block" key="29" data-www={this.props.listStatus} onClick={this.props.deleteOrder}>删除订单</a>,
                    unWrd && <Link className="ctrl-block" key="30" to={`/logistics?tid=${tid}`}>查看物流</Link>,
                    <Link className="ctrl-red pay-order" key="31" to={`/evaluateInput?tid=${tid}`}>立即评价</Link>
                ];
                break;
            //case '已完成':
            case 60:
                btnGroup = [
                    unWrd && <Link className="ctrl-block" key="4" to={`/logistics?tid=${tid}`}>查看物流</Link>,
                    <a className="ctrl-block" key="3" onClick={this.props.deleteOrder}>删除订单</a>
                ];
                break;
            //case '已取消':
            //unWrd && oreadySend && <Link className="ctrl-block" key="41" to={`/logistics?tid=${tid}`}>查看物流</Link>
            case 30:
            case 31:
                btnGroup = [<a className="ctrl-block" key="10" onClick={this.props.deleteOrder}>删除订单</a>];
                break;
            default:
                break;
        }
        return btnGroup;
    }

    render() {
        return (
            <div className="order-ctrl c-tr">
                {this.getHtml()}
            </div>
        )
    }
}

function orderCtrlState(state, props) {
    return {
        status: props.status
    }
}

function orderCtrlDispatch(dispatch, props) {
    let {order_goods = []} = props;
    //商品行项目未售后完成显示字段
    let canAfterSale = order_goods.some(item => item.canAfterSale);
    //确认收货提示（商品未完成售后）
    let canFrim = order_goods.some((item) =>
        afterstatusDeal[item.afterSaleStatus] === '售后中'
    );
    return {
        canFrim: canFrim,
        canAfterSale: canAfterSale,
        cancelOrderPoup: (status) => {
            dispatch(createActions('cancelPopup', {status}));
        },
        checkGroupBuy: (params) => {
            let {isGroupBuy, promotion_id, tid} = params;
            if (isGroupBuy) {
                groupCheckaxios(params);
            } else {
                browserHistory.push(`/cashier?tid=${tid}&from=list&zeroBuy=1&isGroupBuy=${isGroupBuy}&promotionId=${promotion_id}&backUrl=${location.href}`);
            }
        },
        confirmReceipt(halfSend,canFrim) {
            dispatch(createActions('ctrlModal', {
                modal: {
                    show: true,
                    msg: `${halfSend?`订单存在未发货的商品，是否要确认收货？`:(canFrim ? `订单存在售后中的商品，是否确认收货？` : `是否要确认收货？`)}`,
                    modalSure: () => {
                        axios.request({...pageApi.conf, data: {no: props.tid}}).then(result => {
                            setTimeout(() => {
                                dispatch(createActions('ctrlCustom', {custom: {show: true, tid: props.tid}}));
                            }, 1000);
                        }).catch(error => {
                            throw new Error(error);
                        })
                    }
                }
            }))
        },
        deleteOrder() {
            dispatch(createActions('ctrlModal', {
                modal: {
                    show: true,
                    msg: "是否要删除订单？删除后，您可在泰然城官网的订单回收站恢复",
                    modalSure: () => {
                        axios.request({...pageApi.del, data: {no: props.tid}}).then(result => {
                            dispatch(createActions('ctrlPrompt', {
                                prompt: {
                                    show: true,
                                    msg: result.data.message || "删除成功"
                                }
                            }));
                            dispatch(createActions('deleteOrder', {tid: props.tid, status: props.listStatus}));
                        }).catch(error => {
                            console.log(error);
                            throw new Error(error);
                        });
                    }
                }
            }));
        }
    }
}

const OrderCtrlConnect = connect(orderCtrlState, orderCtrlDispatch)(OrderCtrl);

function tradeListState(state, props) {
    return {
        ...state.tradeList,
        navList: state.tradeList.navList,
        status: props.params.status
    }
}

function tradeListDispatch(dispatch) {
    return {
        dispatch: dispatch,
        resetData: () => {
            dispatch(createActions('resetData'));
        },
        //点击跳转订单详情
        tradeDetailClick: (tid, orderflag, currentPage) => {
            let saveTop = $('.swiper-slide-active').scrollTop();
            dispatch(createActions('saveHistroy', {flag: true, saveTop: saveTop, currentPage: currentPage}));
            browserHistory.push(`/tradeDetail?tid=${tid}&orderflag=${orderflag}`)
        }
    }
}

export default connect(tradeListState, tradeListDispatch)(TradeList);