import React, {Component} from 'react';
import {browserHistory, Link} from 'react-router';
import {connect} from 'react-redux';
import {LoadingRound, NoMoreOrder} from 'component/common';
import {DropDownLoad} from 'component/HOC.jsx';
import {PopupTip} from 'component/modal.jsx';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import {cancelOrderMap, groupStatus, orderStatusMap} from 'js/filters/orderStatus';
import axios from 'js/util/axios';
import {WXAPI,DIR} from 'config/index'
import './trade.scss';

const pageApi = {
    init: {url: `${WXAPI}/promotion/myGroupBuy`, method: "get"}
};

const createActions = concatPageAndType("groupList");
const axiosCreator = actionAxios("groupList");

let orderStatus = [4, 1, 2, 0];

//拼团列表
class GroupList extends Component {
    componentWillMount() {
        this.props.resetData();
    }

    componentDidMount() {
        this.addSlide(this.refs.list);
    }

    addSlide(dom) {
        let {dispatch, status, location} = this.props;
        this.listSwiper = new Swiper(dom, {
            initialSlide: status,
            //initialSlide : 0,
            onSlideChangeStart: (swiper) => {
                browserHistory.replace(`${DIR}${this.props.navList[swiper.activeIndex].url}`);
                dispatch(axiosCreator("getData",
                    {...pageApi.init, params: {page: 1, group_status: orderStatus[swiper.activeIndex], page_size: 10}},
                    //{ type: orderStatus[swiper.activeIndex] , pages:1, url: location.pathname }));
                    {
                        type: orderStatus[swiper.activeIndex],
                        pages: 1,
                        url: this.props.navList[swiper.activeIndex].url
                    }));
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

        if (Number(this.listSwiper.activeIndex) === 0) {
            browserHistory.replace(`${DIR}${this.props.navList[0].url}`);
            dispatch(axiosCreator("getData",
                {...pageApi.init, params: {page: 1, group_status: 4, page_size: 10}},
                {type: 4, pages: 1, url: this.props.navList[0].url}
            ))
        }
    }

    navClickHandle = (index) => {
        this.listSwiper.slideTo(index, 300, true);
    }

    promptClose = () => {
        this.props.dispatch(createActions('ctrlPrompt', {prompt: {show: false, msg: ""}}));
    }

    render() {
        return (
            <div data-plugin="swiper" data-page="trade-list" style={{height: $(window).height(), overflow: "hidden"}}>
                <section ref="list" className="swiper-container trade-list">
                    <ListNav data={this.props.navList} status={this.props.status} clickHandle={this.navClickHandle}/>
                    <ListInfo listLength="4" swiper={this.listSwiper} {...this.props} />
                </section>
                <PopupTip active={this.props.prompt.show} msg={this.props.prompt.msg} onClose={this.promptClose}/>
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
    }

    render() {
        return (
            <nav className="trade-list-nav">
                {
                    this.props.data.map((item, i) => {
                        return <Link to={item.url} className="nav-list" key={i} activeClassName="active"
                                     onClick={this.clickHandle.bind(this, `${DIR}${item.url}`, i)}>
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
        let {list, dispatch, status} = this.props;
        let l = this.props.listLength,
            html = [],
            i = 0;
        while (l > i) {
            //html.push( <OneListInfoCtrlConnect status={ i } swiper={this.props.swiper}  key={i} /> );
            html.push(<OneListInfoCtrlConnect status={i} swiper={this.props.swiper} key={i}/>);

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
    dropDown = (me) => {
        let {list, dispatch, status} = this.props;
        if (list.page > list.total / 10) {
            me.lock();
            me.noData();
            me.resetload();
            return;
        }
        axios.request({
            ...pageApi.init,
            params: {page: list.page + 1, group_status: orderStatus[status], page_size: 10}
        })
            .then(result => {
                dispatch(createActions('concatDataSuccess', {
                    result: result.data,
                    dataType: orderStatus[status],
                    page: list.page + 1
                }));
                me.resetload();
            }).catch(error => {
            me.resetload();
            dispatch(createActions('concatDataError', {error: error}));
            throw new Error(error);
        })
    };

    render() {
        let {list, status} = this.props;
        return <div className="swiper-slide" ref="list"
                    style={{overflow: 'auto', height: document.body.clientHeight - 40}}>
            {list.load ? <LoadingRound/> :
                ((list.data && list.data.length) ?
                        <DropDownList scrollArea={$(this.refs.list)} swiper={this.props.swiper} dropDown={this.dropDown}
                                      list={list} listStatus={status}/> : <NoMoreOrder/>
                )
            }
        </div>
    }
}

function dropDownListState(state, props) {
    return {
        list: state.groupList.list[orderStatus[props.status]]
    };
}

const OneListInfoCtrlConnect = connect(dropDownListState)(OneListInfoCtrl);

//列表内容
class OneListInfo extends Component {
    getHtml() {
        return this.props.list.data.map((item, i) => {
            let showCtrl = false;
            if (groupStatus[item.group_status] === "拼团中") showCtrl = true;
            return <OneOrder key={i} data={item} showCtrl={showCtrl}/>
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


//一件商品订单
class OneOrder extends Component {
    render() {
        const {data} = this.props;
        return (
            <li className="one-order">
                <OneOrderInfo data={data}/>
                {this.props.showCtrl ? <OrderCtrl tid={data.object_id}/> : ""}
            </li>
        )
    }
}

//一件商品订单信息
class OneOrderInfo extends Component {
    render() {
        const {data} = this.props;
        let {title, order_shop_no, pic_path, group_status, spec_nature_info, required_person = 0, num, payment} = data;

        let status = groupStatus[group_status];
        return (
            <div className="order-info">
                <div className="list-body">
                    <div className="list-img">
                        <Link to={`/tradeDetail?tid=${order_shop_no}&orderflag=2`}>
                            <img src={pic_path}/>
                        </Link>
                    </div>
                    <div className="list-body-ctt">
                        <div className="order-info-detail">
                            <div className="order-info-top">
                                <Link to={`/tradeDetail?tid=${order_shop_no}&orderflag=2`}
                                      className="order-info-title">{title}</Link>
                                <div className="order-info-type">{spec_nature_info}</div>
                            </div>
                            <div className="order-status-wrap">
                                <div className="order-status">{groupStatus[group_status]}</div>
                                {status === "拼团中" && <div className="order-status">差{required_person}人</div>}
                            </div>
                        </div>
                        <div className="order-total">
                            <span className="order-number">共{num}件商品</span> 实付款：<span
                            className="order-total-pay">{(+payment).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}


//订单控制
class OrderCtrl extends Component {
    render() {
        return (
            <div className="order-ctrl c-tr">
                <Link className="ctrl-red cancel-order" to={`/groupDetail?object_id=${this.props.tid}`}>邀请好友参团</Link>
            </div>
        )
    }
}


function tradeListState(state, props) {
    return {
        ...state.groupList,
        navList: state.groupList.navList,
        status: props.params.status
    }
}

function groupListDispatch(dispatch) {
    return {
        dispatch: dispatch,
        resetData: () => {
            dispatch(createActions('resetData'));
        }
    }
}

export default connect(tradeListState, groupListDispatch)(GroupList);