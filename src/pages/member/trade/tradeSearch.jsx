import React, {Component} from 'react';
import {browserHistory, Link} from 'react-router';
import {connect} from 'react-redux';
import {LoadingRound} from 'component/common';
import {DropDownLoad} from 'component/HOC.jsx';
import {ModalAComp, PopupModal, PopupTip} from 'component/modal.jsx';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import {cancelOrderMap, orderStatusMap, ordersubStatusAndIconMap,
    storeIcon,
    afterstatusDeal,
    confimStatus
} from 'js/filters/orderStatus';
import {timeUtils} from 'js/common/utils';
import {WXAPI,DIR} from 'config/index'
import axios from 'js/util/axios';
import './trade.scss';
import {GoodsList} from './tradeList'
import {miniProgramLogin} from 'js/util/miniProgramLogin';

const pageApi = {
    init: {url: `${WXAPI}/user/shopOrder/list`, method: "get"},
    del: {url: `${WXAPI}/user/shopOrder/discard`, method: "post"},
    conf: {url: `${WXAPI}/user/shopOrder/confirmReceived`, method: "post"}
};
const createActions = concatPageAndType("tradeSearch");
const axiosCreator = actionAxios("tradeSearch");

class TradeSearch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            keyword: '',
            list: [],
            searchHistory: []
        }
    }

    componentWillMount() {
        let history = JSON.parse(window.localStorage.getItem("ordersearchHistory"));
        this.setState({searchHistory: history})
    }

    componentWillUnmount() {
        this.props.resetData();
    }

    btnClick = () => {
        let {dispatch, status, location} = this.props;
        if (this.keyword.value === '') {
            this.props.dispatch(createActions('ctrlPrompt', {prompt: {show: true, msg: "请输入搜索词"}}));
            return;
        } else {
            let keyValue = this.keyword.value;
            dispatch(createActions('keyword', {keyword: keyValue}));
            document.title = '搜索结果';
            let self = this;
            dispatch(axiosCreator("getData",
                {...pageApi.init, params: {page: 1, page_size: 10, status: 'all', keyword: keyValue}},
                {type: 'all', page: 1}));
            this.addHistoryHandle(keyValue)
        }
    }
    //添加本地搜索历史
    addHistoryHandle = (key) => {
        if (key.trim() === "") return false;
        let {searchHistory} = this.state;  //搜索历史
        searchHistory = searchHistory ? searchHistory : [];
        for (let i = 0, item; item = searchHistory[i++];) {
            if (item.word === key) {
                searchHistory.splice(i - 1, 1);
            }
        }
        searchHistory.unshift({word: key}); //将关键词从历史中删除，并添加到搜索历史第一位
        if (searchHistory.length > 10) {
            searchHistory.length = 10;  //搜索历史大于10条，则只保留前10条
        }
        let storage = JSON.stringify(searchHistory);
        window.localStorage.setItem("ordersearchHistory", storage); //存搜索历史到localStorage中
    };
    promptClose = () => {
        this.props.dispatch(createActions('ctrlPrompt', {prompt: {show: false, msg: ""}}));
    }
    modalClose = () => {
        this.props.dispatch(createActions('ctrlModal', {prompt: {show: false, msg: "", modalSure: ""}}));
    };
    //子组件操作父组件dom;
    handleEmail = (event) => {
        $("#keywords").val(event);
    };
    //清除搜索历史
    clearHistory = () => {
        window.localStorage.removeItem("ordersearchHistory");
        this.setState({
            searchHistory: []
        });
    };

    render() {
        let {dispatch, keyword} = this.props;
        return (
            <div data-page="trade-search">

                <div className="searchBox">
                    <div className="searchIpt">
                        <span className="searchIcon"></span>
                        <input type='search' placeholder='商品名称' autoFocus='autoFocus' id="keywords"
                               ref={(keyword) => this.keyword = keyword}/>
                    </div>
                    <button className="searchBtn" onClick={this.btnClick}>搜索</button>
                </div>

                <div className="list-main">
                    <div data-page="trade-list"
                         style={{overflow: "hidden", minHeight: $(window).height(), background: '#f8f8f8'}}>
                        <section className="trade-list" style={{paddingTop: 60}}>
                            {!keyword ?
                                <div className="history-block" style={{overflow: "hidden",}}>
                                    <SearchKeyWord data={this.state.searchHistory} searchKeyWord={this.btnClick}
                                                   dispatch={dispatch} handleEmail={this.handleEmail.bind(this)}
                                                   clearHistory={this.clearHistory}
                                    />
                                </div> :
                                <OneListInfoCtrlConnect status={'all'} keyword={this.keyword}/>
                            }
                        </section>
                        <PopupModal active={this.props.modal.show} msg={this.props.modal.msg} onClose={this.modalClose}
                                    onSure={this.props.modal.modalSure}/>
                        <PopupTip active={this.props.prompt.show} msg={this.props.prompt.msg}
                                  onClose={this.promptClose}/>
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
                    </div>
                </div>
            </div>
        )
    }
}


class SearchKeyWord extends Component {

    searchchildKeyWord = (item) => {
        let {dispatch} = this.props;
        dispatch(createActions('keyword', {keyword: item.word}));
        this.props.handleEmail(item.word);
        this.props.searchKeyWord();
    };

    render() {
        let {data, clearHistory} = this.props;
        const title = {
            text: "历史搜索",
            del: true
        };
        return (
            <div className="search-key-list c-clrfix">
                <h3>
                    <span>{title.text}</span>
                    {title.del && <i className="delete-box-icon" onClick={clearHistory}> </i>}
                </h3>
                {data && data.length ?
                    <div className="search-key">
                        {data.map((item, i) => {
                            return (<div className="grid-key" key={i} onClick={() => {
                                    this.searchchildKeyWord(item)
                                }}>
                                    <span>{item.word}</span>
                                </div>
                            )
                        })}
                    </div>
                    :
                    <div className="search-null">暂无{title.text}</div>
                }
            </div>
        )
    }
}

//搜索结果为空
class SearchNull extends Component {
    render() {
        return (
            <div className="searchNull">
                <ul>
                    <li className="searchNullIcon"></li>
                    <li className="searchNulNo">暂未找到相关订单哦~</li>
                    <a onClick={(e)=>{
                        e.preventDefault();
						miniProgramLogin()
                    }}>
                        <li>可以去商城逛逛></li>
                    </a>
                </ul>
            </div>
        )
    }
}


//搜索列表
class ShopList extends Component {
    render() {
        let {data, count_goods, payment, platform, orderflag, swiper} = this.props;
        let {shop_info, status, no,order_goods,consign_status} = data;
        let {id, is_open, name, alias, shop_icon} = shop_info;
        let goods = data.order_goods.map(function (item, i) {
            return <GoodsList data={item} key={i}/>
        });
        return (
            <div className="item-list">
                <div className="order-info-time">
                    <div className="shop-name">
                        {storeIcon(shop_icon)}
                        <a href={is_open === 1 ? `/store/home?shop=${id}` : 'javascript:void(0)'}><span
                            className="left">{alias ? alias : name}</span>
                        </a>
                    </div>
                    <div className="arrow-right" >
                        <a>{is_open === 1 &&
                        <img src="/src/img/icon/arrow/arrow-right-m-icon.png"/>}</a>
                    </div>
                    <span className="right order-status">{status==40?confimStatus[consign_status]:ordersubStatusAndIconMap[status]['status']}</span>
                </div>
                <Link to={`/tradeDetail?tid=${no}&orderflag=${orderflag}`} className="one-item">
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

//列表内容
export class OneListInfo extends Component {
    getHtml() {
        return this.props.list.map((item, i) => {
            return <li key={i} className="one-order">
                <div className="order-info"><ShopList data={item} payment={item.payment} swiper={this.props.swiper}
                                                      count_goods={item.order_goods.length}
                                                      platform={item.order.platform_from} no={item.no} orderflag={2}
                                                      listStatus={this.props.listStatus}/></div>
            </li>
        });
    }

    render() {
        return (
            <div className="list-data">
                {this.getHtml()}
            </div>

        )
    }
}

const DropDownList = DropDownLoad(OneListInfo);

//一个列表控制
class OneListInfoCtrl extends Component {
    dropDown = (me) => {
        let {dispatch, page, total, keyword} = this.props;
        if (page >= total) {
            me.lock();
            me.noData();
            me.resetload();
            return;
        }
        axios.request({
            ...pageApi.init,
            params: {page: Number(page) + 1, page_size: 10, status: 'all', keyword: keyword}
        }).then(result => {
            dispatch(createActions('concatDataSuccess', {
                result: result.data,
                dataType: 'all',
                page: Number(page) + 1
            }));
            me.resetload();
        }).catch(error => {
            me.resetload();
            dispatch(createActions('concatDataError', {error: error}));
            throw new Error(error);
        })
    }

    render() {
        let {list, load} = this.props;
        return <div ref="list" style={{overflow: 'auto', height: document.body.clientHeight + 30}}>
            {
                load ? <LoadingRound/> :
                    list && list.length ?
                        <DropDownList scrollArea={$(this.refs.list)} dropDown={this.dropDown} list={list}
                                      listStatus={'all'}/> : <SearchNull/>

            }
        </div>
    }
}

function dropDownListState(state, props) {
    return state.tradeSearch;
}

const OneListInfoCtrlConnect = connect(dropDownListState)(OneListInfoCtrl);


//订单控制
export class OrderCtrl extends Component {
    //canFrim提示是否确认收货
    getHtml() {
        let {status, tid, platform, orderflag,canAfterSale,canFrim,consign_status} = this.props;
        let unWrd = (platform !== "TR_WRD" && platform !== "catering");  //是否为无人店订单
        //halfSend部分发货oreadySend已经发货
        let halfSend = consign_status==20;
        let oreadySend =consign_status!=10;
        let btnGroup = "";
        switch (status) {
            case 20:
            case 25:
                btnGroup = [
                    canAfterSale && <Link className="ctrl-block" key="1"
                                   to={`/tradeDetail?tid=${tid}&orderflag=${orderflag}`}>申请售后</Link>
                ];
                break;
            //case "待收货":
            case 40:
                btnGroup = [
                    canAfterSale && <Link className="ctrl-block" key="1"
                                   to={`/tradeDetail?tid=${tid}&orderflag=${orderflag}`}>申请售后</Link>,
                    unWrd && <Link className="ctrl-red pay-order" key="2" to={`/logistics?tid=${tid}`}>查看物流</Link>,
                    <a className="ctrl-red pay-order" key="3" onClick={() => {this.props.confirmReceipt(halfSend,canFrim)}}>确认收货</a>
                ];
                break;
            //case "待评价":
            case 50:
                btnGroup = [
                    <a className="ctrl-block" key="31" onClick={this.props.deleteOrder}>删除订单</a>,
                    unWrd && <Link className="ctrl-red pay-order" key="2" to={`/logistics?tid=${tid}`}>查看物流</Link>,
                    <Link className="ctrl-red pay-order" key="3" to={`/evaluateInput?tid=${tid}`}>立即评价</Link>
                ];
                break;
            //case '已完成':
            case 60:
                btnGroup = [
                    unWrd && <Link className="ctrl-block" key="2" to={`/logistics?tid=${tid}`}>查看物流</Link>,
                    <a className="ctrl-block" key="3" onClick={this.props.deleteOrder}>删除订单</a>
                ];
                break;
            //case '已取消':
            //unWrd && oreadySend && <Link className="ctrl-block" key="41" to={`/logistics?tid=${tid}`}>查看物流</Link>
            case 30:
            case 31:
                btnGroup = [<a className="ctrl-block" key="43" onClick={this.props.deleteOrder}>删除订单</a>];
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
    let canAfterSale=order_goods.some(item => item.canAfterSale );
    let canFrim = order_goods.some((item) =>
        afterstatusDeal[item.afterSaleStatus] === '售后中'
    );
    return {
        canAfterSale:canAfterSale,
        canFrim:canFrim,
        confirmReceipt(halfSend,canFrim) {
            dispatch(createActions('ctrlModal', {
                modal: {
                    show: true,
                    msg: `${halfSend?`订单存在未发货的商品，是否确认收货？`:(canFrim?`订单存在售后中的商品，是否确认收货？`:`是否要确认收货？`)}`,
                    modalSure: () => {
                        axios.request({...pageApi.conf, data: {no: props.tid}}).then(result => {
                            setTimeout(() => {
                                dispatch(createActions('ctrlCustom', {custom: {show: true, tid: props.tid}}));
                            }, 1000);
                        }).catch(error => {
                            dispatch(createActions('ctrlPrompt', {
                                prompt: {
                                    show: true,
                                    msg: error.response.data.message || "服务器繁忙！"
                                }
                            }));
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
                    msg: "确定删除该订单？删除后，您可在泰然城官网的订单回收站恢复",
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
                            dispatch(createActions('ctrlPrompt', {
                                prompt: {
                                    show: true,
                                    msg: error.response.data.message || "服务器繁忙！"
                                }
                            }));
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


function tradeSearchState(state, props) {
    return {
        ...state.tradeSearch,
        status: props.params.status
    }

}

function tradeSearchDispatch(dispatch, props) {
    return {
        dispatch: dispatch,
        resetData: () => {
            dispatch(createActions('resetData'));
        }
    }
}


export default connect(tradeSearchState, tradeSearchDispatch)(TradeSearch);