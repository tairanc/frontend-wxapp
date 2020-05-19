import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import * as api from '../../api/api';
import * as apiTest from '../../api/test';
import { SearchBarA, LoadingRound, Shady, SearchNone, FilterNone, NetError, EmptyPage } from 'component/common';
import { actionAxios, concatPageAndType } from 'js/actions/actions';
import { DropDownLoad } from 'component/HOC';
import { PopupTip } from 'component/modal';
import Immutable from 'immutable';
import './goodCollection.scss';
import echo from 'plugin/echo';
import Popup from 'component/modal2';
import { scrollTo } from 'js/util/index';
import { trimZero } from 'js/common/utils'
import { ManageGoods } from './goodCollection'

const createActions = concatPageAndType('goodOverdue');
const currentApi = api;

const apiToUrl = {
    searchKey: 'key',
    category_id: 'category_id',
    page: 'page',
    condition: 'condition'
};
const urlToApi = {
    key: 'searchKey',
    category: 'category',
    page: 'pages',
    condition: 'condition'
};

class GoodOverdue extends Component {
    constructor(props, context) {
        super(props);
        if (!props.storeHomeRequest) {
            document.title = "失效商品";
        }
        this.state = {
            topButtonState: false
        };
    }
    componentWillMount() {
        this.props.setFilterUpdate(false);
        //若是从详情页返回的，不去请求接口，保留原数据
        if (this.props.from == 'item') {
            this.props.setFrom('');
            return;
        }
        //将地址中的参数传入搜索条件，进行搜索条件初始化
        let { key, category_id, condition } = this.props.location.query;
        key = key !== undefined ? decodeURIComponent(key) : "";
        let searchData = {
            searchKey: key,
            category_id: category_id !== undefined ? Number(category_id) : "",
            condition: condition || 'invalid',
            page: 1
        };
        this.props.dispatch(createActions('setSearch', { searchData: searchData }));
    }
    componentWillReceiveProps(nextProps) {
        //当且仅当搜索条件发生变化时进行搜索
        // if (this.props.searchData !== nextProps.searchData) {
        //     let data = Object.assign({}, nextProps.searchData, { searchKey: nextProps.searchData.searchKey }),
        //         init = nextProps.init;
        //     this.changeUrl(nextProps.searchData);
        //     this.props.setData(data, init);
        // }
        if (nextProps.goodListUpdate || this.props.searchData !== nextProps.searchData) {
            let data = Object.assign({}, nextProps.searchData, { searchKey: nextProps.searchData.searchKey }),
                init = nextProps.init,
                filterUpdate = this.props.filterUpdate;
            this.changeUrl(nextProps.searchData);
            this.props.setData(data, init, filterUpdate);
            this.props.setGoodListUpdate(false);
            this.props.dispatch(createActions('noSave', { noSave: false }));
        }
    }
    componentDidMount() {
        if (this.props.windowHeight < $(window).height()) {
            this.props.setWindowHeight($(window).height());
        }
    }
    componentDidUpdate() {
        //组件每次更新时都进行一次懒加载初始化
        echo.init({ offset: $(window).height(), throttle: 1000 });
    }
    componentWillUnmount() {
        this.props.setFilterUpdate(true);
        $("body").css(
            {
                overflowY: "",
                position: "static"
            }
        );
        $(window).unbind('scroll');
    }
    changeUrl(searchData) {
        let searchStr = "";
        let href = location.href.split('?')[0];
        for (let key in searchData) {
            if (searchData.hasOwnProperty(key)) {
                if (searchData[key]) {
                    searchStr += "&" + apiToUrl[key] + "=" + (key == 'service' ? this.formatSearchData(searchData[key]) : searchData[key]);
                }
            }
        }
        history.replaceState({}, null, href + "?" + searchStr.substr(1));
    }
    formatSearchData(data) {
        let str = "";
        let obj = {};
        if (typeof data == 'object') {
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    str += data[key] ? key + "," : ""
                }
            }
            return str.substr(0, str.length - 1);
        } else if (typeof data == 'string') {
            let array = data.split(',');
            for (let i = 0; i < array.length; i++) {
                obj[array[i]] = 1;
            }
            return obj;
        }
    }
    dropDown(me) {
        //用于dropLoad插件的dropDown方法，翻页时调用
        let { searchData, dispatch, currentPage, totalPage, load, goodsList } = this.props;
        if (!load || !goodsList || currentPage >= totalPage) {
            me.lock();
            me.noData();
            me.resetload();
            return;
        }
        searchData = Immutable.fromJS(searchData).toJS();
        searchData.page = currentPage + 1;
        currentApi.collection(searchData).then(result => {
            if (result.data.code != 0) {
                me.lock();
                me.noData();
                me.resetload();
                return;
            }
            dispatch(createActions('concatData', { result: result.data }));
            dispatch(createActions('setCurrentPage', { current: currentPage + 1 }));
            me.resetload();
            let { page } = result.data.data;
            if (page.current_page >= page.total_page) {
                me.lock();
                me.noData();
                me.resetload();
            }
        }).catch(error => {
            console.error(error);
            me.resetload();
        })
    }
    render() {
        let { errorState, load, init, noSave, goodsList, setFrom, prompt, shady, promptClose, manage, toggleManage, ifChooseAll, changeChooseAll,
            delCount, toggleshady, toggledelCount, setGoodListUpdate } = this.props;
        return (
            <div id="goodOverdue" data-page="good-collection-page" style={{ 'minHeight': this.props.windowHeight }}>
                {!errorState ? load ? !noSave ?
                    <div className="goodWrap">
                        <GoodsList goodsList={goodsList} setFrom={setFrom} scrollArea={window} dropDown={this.dropDown.bind(this)}
                            manage={manage} changeChooseAll={changeChooseAll} ifChooseAll={ifChooseAll} />
                        <ManageGoods manage={manage} toggleManage={toggleManage} ifChooseAll={ifChooseAll}
                            changeChooseAll={changeChooseAll} delCount={delCount} shady={shady}
                            toggleshady={toggleshady} toggledelCount={toggledelCount}
                            setGoodListUpdate={setGoodListUpdate} />
                    </div>
                    : <EmptyPage config={{
                        msg: "暂无失效商品哦~",
                        btnText: "返回我的收藏",
                        link: "/myCollection",
                        isH5:true,            //表示项目内部跳转
                        bgImgUrl: "/src/img/collect/trcNOcollection.png"
                    }} /> : <LoadingRound /> : <NetError />}
                <ControlButton topButtonState={this.state.topButtonState} />
                <PopupTip active={prompt.show} msg={prompt.msg} onClose={promptClose} />
            </div>
        );
    }
}
//筛选条件组件，包括关键字筛选，排序筛选，高级筛选，快捷筛选
class SearchFilter extends Component {
    render() {
        let { keyWord, setSearch, dispatch, setInit } = this.props;
        return (
            <div className='filter-condition' ref="filterCondition">
                <SearchInput setSearch={setSearch} value={keyWord} dispatch={dispatch} setInit={setInit} />
            </div>
        )
    }
}
//搜索条
export class SearchInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            innerValue: props.defaultValue
        };
    }
    //搜索提交
    searchSubmit = (key) => {
        key = key !== undefined ? key.trim() : "";
        if (!key) {
            this.props.dispatch(createActions('ctrlPrompt', { prompt: { show: true, msg: "请输入搜索词" } }));
            return;
        }
        this.props.setInit(true);
        this.props.setSearch({ searchKey: key })
    };
    clearHandle = (e) => {
        if (this.props.value) {
            this.props.onChange && this.props.onChange("");
        } else {
            this.setState({
                innerValue: ""
            })
        }
    };
    componentDidMount() {
        const { isMount } = this.props;
        isMount && isMount.call(this);
    };
    render() {
        const { value } = this.props,
            { innerValue } = this.state;
        return (
            <form data-comp="search-bar-a" className="g-row-flex" onSubmit={(e) => {
                e.preventDefault();
                this.searchSubmit(this.refs.search.value.trim())
            }}>
                <label className="g-col-1 search-label" ref="label">
                    <input ref="search" type="search" placeholder="商品名称/品牌" className="search-input" />
                    {(value !== undefined ? value : innerValue) !== "" && <i ref="clear" onTouchTap={this.clearHandle} className="close-x-icon"> </i>}
                    <i className="search-icon"> </i>
                </label>
                <button type="submit" className="search-btn">搜索</button>
            </form>
        )
    }
}
//商品列表 DropDownLoad以高阶组件的形式为商品列表添加下拉分页
@DropDownLoad
class GoodsList extends Component {
    setMinListHeight() {
        document.getElementsByClassName('goods-list')[0].style.minHeight = ($(window).height() - 85) + 'px';
        document.getElementsByClassName('goods-list')[0].minHeight = ($(window).height() - 85) + 'px';
    }
    componentDidMount() {
        this.setMinListHeight();
    }
    render() {
        let { goodsList, setFrom, manage, changeChooseAll, ifChooseAll } = this.props;
        let style = 'style2';
        return (
            <div className={`goods-list ${style}`}>
                {goodsList.map(function (item, index) {
                    return <GoodItem key={index} data={item} index={index} setFrom={setFrom}
                        manage={manage} changeChooseAll={changeChooseAll} ifChooseAll={ifChooseAll} />
                })}
            </div>
        )
    }
}
//单个商品
class GoodItem extends Component {
    constructor(props) {
        super(props);
        this.tradeTypeObj = {
            Domestic: { name: '国内贸易', style: 'hide-tag' },
            Overseas: { name: '海外直邮', style: 'yellow-tag' },
            Bonded: { name: '跨境保税', style: 'blue-tag' },
            Direct: { name: '海外直邮', style: 'yellow-tag' }
        };
    }
    componentDidMount() {
        let { manage, ifChooseAll } = this.props;
        if (manage && ifChooseAll) {
            $('.shadyUnselect').addClass('del-choose')
        } else {
            $('.shadyUnselect').removeClass('del-choose')
        }
    }
    //促销标签
    showPromotionDetail(list) {
        return list.map(function (item, index) {
            return <span className="promotion-tag" key={index}>{item}</span>
        })
    }
    //库存提醒
    showCountDetail(count) {
        return <span className="tips">仅剩{count}件</span>
    }
    //降价提醒
    showPriceDetail(price) {
        return <span className="tips">比收藏时降价￥{trimZero(price)}</span>
    }
    //按优先级展示左上角标签
    showTopTagsByLevel(list) {
        let text = '';
        if (list) {
            if (list.is_new_group) {
                text = '新人团';
            } else if (list.is_hot) {
                text = '热销';
            } else if (list.is_new) {
                text = '新品';
            } else {
                text = '';
            }
        } else {
            text = '';
        }
        return text ? <span className="new-hot-tag">{text}</span> : ""
    }
    //选中要移除的商品
    changeChoose = (e) => {
        let { changeChooseAll } = this.props;
        let $tar = $(e.target);
        let tarCircle = $tar.siblings('.shadyUnselect')
        if (tarCircle.hasClass("del-choose")) {
            tarCircle.removeClass("del-choose");
            $tar.removeClass("del-shady");
        } else {
            tarCircle.addClass("del-choose");
            $tar.addClass('del-shady')
        }
        let len = $('.good-item').length;
        let chooseLen = $('.del-choose').length;
        if (len === chooseLen) {
            changeChooseAll(true);
        } else {

            changeChooseAll(false);
        }
    }
    render() {
        let { item_id, primary_image, title, sell_price, old_price, trade_type, status, promotion_detail, store, price_diff, deleted_at } = this.props.data;
        let isGoodCount = status === 30 && store.real > 0;
        let inventory = store.real;
        let tradeType = trade_type == 10 ? "Domestic" : trade_type == 20 ? "Overseas" : trade_type == 30 ? "Bonded" : trade_type == 40 ? "Direct" : '';
        let promotionArray = promotion_detail.promotion_tags ? promotion_detail.promotion_tags : '';
        let show_price = promotion_detail.promotion_price ? promotion_detail.promotion_price : sell_price;
        let { manage } = this.props;
        return (
            <div className="good-item" onClick={this.props.setFrom.bind(this, 'item')} id={item_id}>
                <Link to={"/item?item_id=" + item_id}>
                    <div className="good-image">
                        <img className="primary-image" data-echo={primary_image ? (primary_image + "_m.jpg") : "/src/img/search/no-goods-image.png"} src="/src/img/icon/loading/default-watermark.png" />
                        {isGoodCount && !deleted_at ? "" : <img className="no-goods-count-image" src="/src/img/search/no-goods-count.png" />}
                        {isGoodCount && !deleted_at && price_diff > 0 ? (price_diff > 0 ? this.showPriceDetail(price_diff) : '')
                            : (isGoodCount && !deleted_at && inventory <= 5 ? this.showCountDetail(inventory) : '')}
                    </div>
                    <div className="good-content">
                        <div className="good-title">{title}</div>
                        <div className="good-price">
                            <span className="sell-price"><span className="money-icon">￥</span>{trimZero(show_price)}</span>
                        </div>
                        <div className="good-bottom-tag">
                            {tradeType ? (<span className={`trade-tag ${this.tradeTypeObj[tradeType].style}`}>{this.tradeTypeObj[tradeType].name}</span>) : ''}
                            {isGoodCount && !deleted_at && (promotionArray && promotionArray.length) ? this.showPromotionDetail(promotionArray) : ''}
                        </div>
                    </div>
                    {/* <div className="good-top-tag">{H5_pic?(<img src={H5_pic+"_m.jpg"}/>):""}</div> */}
                    {/* <div className="good-top-tag">{isGoodCount && activity_tag ? (<img src={activity_tag.H5_pic + "_m.jpg"} />) : ""}</div> */}
                </Link>
                {manage && <div className="shadyUnselect"></div>}
                {manage && <div className="manageShady" onClick={this.changeChoose}></div>}
            </div>
        )
    }
}
//所有控制按钮
class ControlButton extends Component {
    render() {
        return <div className="control-button">
            {this.props.topButtonState ? <JumpTopButton /> : ''}
        </div>
    }
}
//回到顶部的按钮
class JumpTopButton extends Component {
    jumpToTop() {
        scrollTo(0, 50);
    }
    render() {
        return <div className="jump-top-button" onClick={this.jumpToTop.bind(this)}>
            <i className="jump-top-icon"></i>
        </div>
    }
}
export function goodOverdueState(state) {
    return { ...state.goodOverdue }
}
export function goodOverdueDispatch(dispatch) {
    return {
        dispatch,
        promptClose: () => {
            dispatch(createActions('ctrlPrompt', { prompt: { show: false, msg: "" } }));
        },
        setFrom(str) {
            dispatch(createActions('setFrom', { from: str }));
        },
        setInit(init) {
            dispatch(createActions('setInit', { init: init }));
        },
        setFilterUpdate(filterUpdate) {
            dispatch(createActions('setFilterUpdate', { filterUpdate: filterUpdate }));
        },
        setGoodListUpdate(goodListUpdate) {
            dispatch(createActions('setGoodListUpdate', { goodListUpdate: goodListUpdate }));
        },
        setWindowHeight(height) {
            dispatch(createActions('windowHeight', { windowHeight: height }));
        },
        setSearch(data) {
            dispatch(createActions('setSearch', { searchData: data }));
        },
        setData(data, init, filterUpdate) {
            dispatch(createActions('isLoad', { load: false }));
            currentApi.collection(data).then(result => {
                if (result.data.code != 0) {
                    dispatch(createActions('setInit', { init: true }));
                    dispatch(createActions('isError', { errorState: true }));
                    return;
                } else {
                    dispatch(createActions('isError', { errorState: false }));
                }
                if (result.data.data.item_list.length == 0) { dispatch(createActions('noSave', { noSave: true })); }
                if (!init) {
                    dispatch(createActions('setInitItem', { result: result.data }));
                    dispatch(createActions('setInit', { init: true }));
                }
                dispatch(createActions('setCurrentPage', { current: result.data.data.page ? result.data.data.page.current_page : 1 }));
                dispatch(createActions('setTotalPage', { total: result.data.data.page ? result.data.data.page.total_page : 1 }));
                dispatch(createActions('setData', { result: result.data, filterUpdate: filterUpdate }));
                dispatch(createActions('isLoad', { load: true }));
            }).catch(error => {
                dispatch(createActions('setInit', { init: true }));
                // dispatch(createActions('isLoad', { load: true }));
                dispatch(createActions('isError', { errorState: true }));
                Popup.MsgTip({ msg: error.message || error.response.data.message || "服务器繁忙" })
                // console.error( error );
            });
        },
        toggleQuickSelect(isSelect) {
            dispatch(createActions('toggleQuickSelect', { isQuickSelect: isSelect }));
        },
        toggleManage(manage) {
            dispatch(createActions('toggleManage', { manage: manage }))
        },
        changeChooseAll(ifchooseAll) {
            dispatch(createActions('changeChooseAll', { ifchooseAll: ifchooseAll }))
        },
        toggledelCount(delCount) {
            dispatch(createActions('delCount', { delCount: delCount }))
        },
        toggleshady(shady) {
            dispatch(createActions('shady', { shady: shady }))
        },
    }
}
export default connect(goodOverdueState, goodOverdueDispatch)(GoodOverdue);