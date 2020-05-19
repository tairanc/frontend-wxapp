import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import * as api from '../../api/api';
import * as apiTest from '../../api/test';
import { SearchBarA, LoadingRound, Shady, SearchNone, NetError, EmptyPage, FilterNone } from 'component/common';
import { actionAxios, concatPageAndType } from 'js/actions/actions';
import { DropDownLoad } from 'component/HOC';
import { PopupTip } from 'component/modal';
import Immutable from 'immutable';
import './goodCollection.scss';
import echo from 'plugin/echo';
import { scrollTo } from 'js/util/index';
import { trimZero } from 'js/common/utils'
import { ModalBComp } from 'component/modal';
import Popup from 'component/modal2';
import {DIR} from 'config/index'
import { ShopCollection, ShopList, EachShop, CoverDel} from '../member/collection/index'

const createActions = concatPageAndType('goodCollection');
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

class GoodCollection extends Component {
    constructor(props, context) {
        super(props);
        document.title = "我的收藏";
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
        let { key, category_id } = this.props.location.query;
        key = key !== undefined ? decodeURIComponent(key) : "";
        let searchData = {
            searchKey: key,
            category_id: category_id !== undefined ? Number(category_id) : "",
            condition: "",
            page: 1
        };
        this.props.dispatch(createActions('setSearch', { searchData: searchData }));
    }

    componentWillReceiveProps(nextProps) {
        //当且仅当搜索条件发生变化时进行搜索
        // debugger
        if (nextProps.goodListUpdate || this.props.searchData !== nextProps.searchData ) {
            let data = Object.assign({}, nextProps.searchData, { searchKey: nextProps.searchData.searchKey })
            let init = nextProps.init,
            filterUpdate = this.props.filterUpdate;
            this.changeUrl(nextProps.searchData);
            this.props.setData(data, init, true);
            this.props.setGoodListUpdate(false);
            this.props.dispatch(createActions('noSave', { noSave: false }));
            this.props.dispatch(createActions('defaultNoSave', { defaultNoSave: false }));
        }
        // if (nextProps.goodListUpdate || this.props.searchData !== nextProps.searchData) {
        //     let data = Object.assign({}, nextProps.searchData, { searchKey: nextProps.searchData.searchKey }),
        //         init = nextProps.init,
        //         filterUpdate = this.props.filterUpdate;
        //     this.changeUrl(nextProps.searchData);
        //     this.props.setData(data, init, filterUpdate);
        //     this.props.setGoodListUpdate(false);
        // }
    }
    componentDidMount() {
        let that = this;
        let windowHeight = Math.max(this.props.windowHeight, $(window).height());
        $(window).scroll(function () {
            let scrollTop = $(window).scrollTop();
            let oldState = that.state.topButtonState;
            let newState = scrollTop > windowHeight;
            if (oldState !== newState) {
                that.setState({ topButtonState: scrollTop > windowHeight });
            }
        });
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
        let { errorState, load, init, defaultNoSave, noSave, categoriesList, goodsList, setFrom, setNav, nav, manage, DisGoods, toggleManage, changeChooseAll,
            ifChooseAll, delCount, toggleshady, shady, toggledelCount, searchData, setGoodListUpdate} = this.props;
        return (
            init ? (
                nav == 'collection' ?
                    <div id="goodCollection" data-page="good-collection-page" style={{ 'minHeight': this.props.windowHeight }}>
                        <LeaderNav setNav={setNav} nav={nav} />
                        <SearchFilter {...this.props} />
                        {!errorState ? load ? !noSave ?
                            <div className="goodWrap">
                                <GoodsList goodsList={goodsList} setFrom={setFrom} scrollArea={window} dropDown={this.dropDown.bind(this)}
                                    manage={manage} changeChooseAll={changeChooseAll} ifChooseAll={ifChooseAll} />
                                <ManageGoods manage={manage} toggleManage={toggleManage} DisGoods={DisGoods} ifChooseAll={ifChooseAll}
                                    changeChooseAll={changeChooseAll} delCount={delCount} shady={shady}
                                    toggleshady={toggleshady} toggledelCount={toggledelCount}
                                    setGoodListUpdate={setGoodListUpdate} />
                            </div>
                            :
                            <div>
                                {defaultNoSave ? <EmptyPage config={{
                                    msg: "暂无收藏任何商品~",
                                    btnText: "去商城逛逛",
                                    link: "",
                                    bgImgUrl: "/src/img/collect/trcNOcollection.png"
                                }} /> : <FilterNone />}
                            </div>
                            : <LoadingRound /> : <NetError />}
                        <ControlButton topButtonState={this.state.topButtonState} />
                    </div> :
                    <div>
                        <div id="goodCollection" data-page="good-collection-page" style={{ 'minHeight': this.props.windowHeight }}>
                            <LeaderNav setNav={setNav} nav={nav} />
                            <ShopCollection />
                        </div>
                    </div>
            ) : <LoadingRound />
        );
    }
}
class LeaderNav extends Component {
    render() {
        let { setNav, nav } = this.props;
        return (
            <div className="leaderNav">
                <ul>
                    <li className={nav == 'collection' ? "activeNav" : ""} onClick={setNav.bind(this, 'collection')}><span>商品收藏</span></li>
                    <li className={nav == 'store' ? "activeNav" : ""} onClick={setNav.bind(this, 'store')}><span>店铺关注</span></li>
                </ul>
            </div>
        )
    }
}
//筛选条件组件，包括关键字筛选，排序筛选，高级筛选，快捷筛选
class SearchFilter extends Component {
    render() {
        let { setSearch, setData, toggleQuickSelect, searchData, categoriesList, errorState, isQuickSelect, toggleManage, changeChooseAll, defaultNoSave } = this.props;
        let isFilter = !errorState && categoriesList && categoriesList.length && !defaultNoSave;
        return (
            <div className='filter-condition' ref="filterCondition">
                {isFilter ? <QuickFilter setSearch={setSearch} setData={setData} toggleQuickSelect={toggleQuickSelect} searchData={searchData}
                    categoriesList={categoriesList} isQuickSelect={isQuickSelect} toggleManage={toggleManage} changeChooseAll={changeChooseAll} /> : ""}
            </div>
        )
    }
}
//快捷筛选
class QuickFilter extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.quickFilter = [
            { name: '默认', type: '', style: 'click' },
            { name: '促销', type: 'promotion', style: 'click' },
            { name: '有货', type: 'available', style: 'click' },
            { name: '分类', type: 'category_id', style: 'select' }
        ];
    }
    //收起下拉列表
    stopSelect() {
        this.props.toggleQuickSelect(false);
    }
    //快捷筛选点击事件
    filterClick(type, style) {
        if (style == 'click') {
            this.props.toggleQuickSelect(false);
            this.props.setSearch({ condition: type });
        } else if (style == 'select') {
            let select = this.props.isQuickSelect;
            if (this.state.type == type) {
                this.props.toggleQuickSelect(!select);
            } else {
                this.setState({
                    type: type
                });
                this.props.toggleQuickSelect(true);
            }
        }
    }
    //判断是否为选中状态
    isActive(type, style) {
        let flag = false;
        if (style == 'click') {
            flag = this.props.searchData.condition == type;
        } else if (style == 'select') {
            flag = this.props.searchData[type];
        }
        return !!flag;
    }
    //判断是否为下拉展开状态
    isSelect(type, style) {
        let flag = false;
        if (style == 'select' && type == this.state.type && this.props.isQuickSelect) {
            flag = true;
        }
        return flag;
    }
    //将选中的条目文本替换掉快捷筛选的文字
    showChooseItem(type) {
        let { searchData, categoriesList } = this.props;
        let idArray = searchData[type].toString().split(',');
        let nameArray = [];
        if (type == 'category_id') {
            for (let i = 0; i < categoriesList.length; i++) {
                let name = this.getNameById(categoriesList[i], idArray, type);
                name && nameArray.push(name);
            }
        } else {
            console.log('error');
            return 0;
        }
        return nameArray.join(',');
    }
    //通过快捷筛选的条目id获取快捷筛选条目名称
    getNameById(item, activeList, type) {
        for (let i = 0; i < activeList.length; i++) {
            if (type == 'category_id') {
                if (activeList[i] == item.category_id) {
                    return item.category_name;
                }
            } else {
                console.log('error');
                return '';
            }
        }
    }
    //获取快捷筛选内容
    getQuickFilter() {
        let self = this;
        return this.quickFilter.map(function (item, index) {
            let isActive = self.isActive(item.type, item.style);
            let isSelect = self.isSelect(item.type, item.style);
            return <li key={index} className={isSelect ? 'select' : (isActive ? item.style == 'click' ? 'active' : 'select-active' : '')}
                onClick={(e) => { self.filterClick(item.type, item.style); self.props.changeChooseAll(false); self.props.toggleManage(false) }}>
                <div><span>{(item.style == 'select' && (!isSelect && isActive)) ? self.showChooseItem(item.type) : item.name}</span>{(item.style == 'select' && (isSelect || (!isSelect && !isActive))) ? <i className={isSelect ? "arrow-top-black-icon" : "arrow-btm-black-icon"}></i> : ''}</div>
            </li>
        });
    }
    //下拉列表展开时避免整个屏幕滚动
    preventScroll(status) {
        if (status) {
            $("body").css({ overflowY: "hidden", position: "fixed" })
        } else {
            $("body").css({ overflowY: "", position: "static" })
        }
    }
    render() {
        let select = this.props.isQuickSelect;
        let { categoriesList, searchData, setSearch, toggleQuickSelect } = this.props;        
        this.preventScroll(select);
        return (
            <div className="quick-filter">
                <ul className="filter-list">
                    {this.getQuickFilter()}
                </ul>
                {select ? <QuickFilterSelect setSearch={setSearch} categoriesList={categoriesList} type={this.state.type} searchData={searchData} stopSelect={this.stopSelect.bind(this)} /> : ""}
                {select ? <Shady options={{ zIndex: -1 }} clickHandle={() => { toggleQuickSelect(false) }} /> : ""}
            </div>
        )
    }
}
//快捷筛选下拉列表组件
class QuickFilterSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            list: {}
        };
    }
    componentWillMount() {
        this.initSelect(this.props.type);
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.type != nextProps.type) {
            this.initSelect(nextProps.type);
        }
    }
    componentWillUnmount() {
        this.props.stopSelect();
    }
    //下拉列表条目点击事件
    selectFilter(id) {
        let list = this.state.list;
        list = list[id] ? list : {};
        list[id] = !list[id];
        this.setState({
            list: list
        }, function () {
            this.ensureSelect();
        })
    }
    //初始化下拉列表数据
    initSelect(type) {
        let list = {};
        let array = [];
        if (type == 'category_id' && this.props.searchData.category_id) {
            array = this.props.searchData.category_id.toString().split(',');
        }
        for (let i in array) {
            if (array.hasOwnProperty(i)) {
                list[array[i]] = true;
            }
        }
        this.setState({ list: list });
    }
    //清空下拉列表数据
    resetSelect() {
        this.setState({ list: {} })
    }
    //提交下拉列表数据
    ensureSelect() {
        let list = this.state.list;
        let { setSearch, type } = this.props;
        let idArray = [];
        let idText = '';
        for (let id in list) {
            if (list.hasOwnProperty(id) && list[id]) {
                idArray.push(id);
            }
        }
        idText = idArray.join(',');
        setSearch({ [type]: idText });
        this.props.stopSelect();
    }
    //获取下拉列表数据
    getFilterList() {
        let { categoriesList, type } = this.props;
        let self = this;
        let list = "";
        if (type == 'category_id') {
            list = categoriesList.map(function (item, index) {
                return <li key={index} onClick={self.selectFilter.bind(self, item.category_id, item.category_name)}><div className={self.state.list[item.category_id] ? 'choose' : ''}>{item.category_name}</div></li>
            })
        }
        return list;
    }
    render() {
        return (
            <div className="quick-filter-select">
                <ul className="select-list">
                    {this.getFilterList()}
                </ul>
            </div>
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
        // console.log(goodsList)
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
            "Domestic": { name: '国内贸易', style: 'hide-tag' },
            "Overseas": { name: '海外直邮', style: 'yellow-tag' },
            'Bonded': { name: '跨境保税', style: 'blue-tag' },
            'Direct': { name: '海外直邮', style: 'yellow-tag' }
        };
    }
    componentDidMount() {
        //全选判断
        let { manage, ifChooseAll } = this.props;
        if (manage && ifChooseAll) {
            $('.shadyUnselect').addClass('del-choose');
            $('.manageShady').addClass('del-shady')
        } else {
            $('.shadyUnselect').removeClass('del-choose');
            $('.manageShady').removeClass("del-shady");
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
        let { item_id, primary_image, title, sell_price, old_price, item_tag,trade_type, promotion_detail, status, store,price_diff,deleted_at } = this.props.data;
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
                        {/* {isGoodCount && activity_tag ? <img className='large-activity-label' src={activity_tag.H5_pic} /> : ''} */}
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
                    {/* <div className="good-top-tag">{isGoodCount && activity_tag ? (<img src={activity_tag.H5_pic + "_m.jpg"} />) : ""}</div> */}
					{item_tag&&<div className="good-top-tag"><img src={item_tag.images.mb_square_img} /></div> }
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
            <JumpSearchButton />
            {this.props.topButtonState ? <JumpTopButton /> : ''}
        </div>
    }
}
//搜索跳转按钮
class JumpSearchButton extends Component {
    render() {
        return <div className="jump-search-button">
            <a href="/goodCollectionSearch"><i className="jump-search-icon"></i></a>
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
// 管理商品
export class ManageGoods extends Component {
    selectAll = () => {
        let { manage, changeChooseAll, ifChooseAll } = this.props;
        let ifAll = !ifChooseAll;
        changeChooseAll(ifAll);
        $('.shadyUnselect').addClass('del-choose')
        if (manage && ifAll) {
            $('.shadyUnselect').addClass('del-choose')
            $('.manageShady').addClass('del-shady')
        } else {
            $('.shadyUnselect').removeClass('del-choose');
            $('.manageShady').removeClass("del-shady");
        }
    }
    del = () => {
        let { delCount, toggleManage, toggleshady, toggledelCount } = this.props;
        let dels = $('.del-choose');
        if (dels.length) {
            toggleshady(true);
            toggledelCount(dels.length)
            // $(".goodWrap").css({ overflow: "hidden", position: "fixed" })
        } else {
            Popup.MsgTip({ msg: '请先选择商品' });
        }
    };
    //移除商品收藏
    changeList = () => {
        let { toggleshady, toggleManage, setGoodListUpdate } = this.props;
        let tar = $(".good-item"),
            len = $(tar).length;
        if (len) {
            let arr = [],
                goods = $('.del-choose').parents(".good-item"),
                gLen = goods.length;
            for (let i = 0; i < gLen; i++) {
                arr.push((goods.eq(i).attr('id')));
            }
            let params = {};
            params.item_id = arr.join(',');
            // console.log(params)
            currentApi.del(params).then(({ data }) => {
                // Popup.MsgTip({ msg: data.collection });
                $(".del-choose").removeClass("del-choose");
                toggleshady(false);
                toggleManage(false);
                setGoodListUpdate(true);
            })
        }
    };
    render() {
        let { manage, DisGoods, toggleManage, changeChooseAll, ifChooseAll, delCount, shady, toggleshady, } = this.props;
        let that = this;
        return (
            <div className="manageGoods">
                {manage ?
                    (<div className="endManage">
                        {ifChooseAll ?
                            <img src="src/img/collect/trcChoose.png" className="unselect" />
                            : <img src="src/img/collect/trcNOchoose.png" className="unselect" />}
                        <span className="selectAll" onClick={this.selectAll}>全选</span>
                        {DisGoods && <Link className="checkDisabled" to="/goodOverdue">查看失效商品</Link>}
                        <span className="cancel" onClick={this.del}>取消收藏</span>
                        <span className="done" onClick={(e) => {
                            toggleManage(false);
                            changeChooseAll(false)
                        }}>完成</span>
                    </div>)
                    :
                    <div className="startManage" onClick={toggleManage.bind(this, true)}>管理</div>}
                <ModalBComp active={shady} title=''
                    msg={`确定取消 ${delCount} 个收藏商品吗？`}
                    btns={[
                        {
                            text: "取消", cb: () => {
                                toggleshady(false);
                                $(".goodWrap").css({ overflow: "", position: "static" })
                            }
                        },
                        {
                            text: '确定', cb: () => {
                                that.changeList();
                                $(".goodWrap").css({ overflow: "", position: "static" })
                            }
                        }
                    ]}

                />
            </div>

        )
    }
}
export function goodCollectionState(state) {
    return { ...state.goodCollection }
}
export function goodCollectionDispatch(dispatch) {
    return {
        dispatch,
        setFrom(str) {
            dispatch(createActions('setFrom', { from: str }));
        },
        setNav(str) {
            dispatch(createActions('setNav', { nav: str }));
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
                if (result.data.code === 0) {
                    dispatch(createActions('isError', { errorState: false }));
                } else {
                    dispatch(createActions('setInit', { init: true }));
                    dispatch(createActions('isError', { errorState: true }));
                    return;
                }
                if (!init) {
                    dispatch(createActions('setInitItem', { result: result.data }));
                    dispatch(createActions('setInit', { init: true }));
                }
                if (data.condition == "" && data.category_id == '' && result.data.data.item_list.length == 0) {
                    dispatch(createActions('defaultNoSave', { defaultNoSave: true }));
                }
                if (data.category_id != '' && result.data.data.item_list.length == 0) {
                    dispatch(createActions('noSave', { noSave: true }));
                    dispatch(createActions('setData', { result: result.data, filterUpdate: false }));
                }
                if (result.data.data.item_list.length != 0) {
                    dispatch(createActions('setCurrentPage', { current: result.data.data.page ? result.data.data.page.current_page : 1 }));
                    dispatch(createActions('setTotalPage', { total: result.data.data.page ? result.data.data.page.total_page : 1 }));
                    dispatch(createActions('setData', { result: result.data, filterUpdate: filterUpdate }));
                } else {
                    dispatch(createActions('noSave', { noSave: true }));
                }
                dispatch(createActions('isLoad', { load: true }));
            }).catch((error) => {
                dispatch(createActions('setInit', { init: true }));
                // dispatch(createActions('isLoad', { load: true }));
                dispatch(createActions('isError', { errorState: true }));
                Popup.MsgTip({ msg: error.message || error.response.data.message || "服务器繁忙" })
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
export default connect(goodCollectionState, goodCollectionDispatch)(GoodCollection);