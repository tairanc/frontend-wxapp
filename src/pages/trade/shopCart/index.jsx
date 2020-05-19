import React, {Component} from 'react';
import {Link, browserHistory} from 'react-router';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import Navigator from 'component/modules/navigation/index';
import {PureComponent, SwipeCtrlWidget} from 'component/modules/HOC';
import {loadMask} from 'component/modules/popup/mask/mask';
import {modalA} from 'component/modules/popup/modal/modal';
import {tip} from 'component/modules/popup/tip/tip';
import AnimateLoad from 'component/modules/popup/loading/AnimateLoad';
import EmptyPage from 'component/modules/empty/EmptyPage';
import ErrorPage from 'component/modules/empty/ErrorPage';
import {Shady} from 'component/modules/shady';
import ReturnTop from 'component/utils/returnTop';
import {connect} from 'react-redux';
import {delay} from 'js/common/utils';
import StoreHeader from './StoreHeader';
import MarketHeader, {ExchangeRow} from './MarketHeader';
import CheckIcon from './CheckIcon';
import OneItem, {SpecItem} from './OneItem';
import InvalidItem from './InvalidItem';
import ItemSwipe from './ItemSwipe';
import CouponPopup from './CouponPopup';
import SaleAttr from './SaleAttr'
import axios from 'js/util/axios';
import './index.scss';
import {WXAPI,DIR} from 'config/index'

const createActions = concatPageAndType('shopCart');
const createExchangeActions = concatPageAndType('exchangeItem');

const pageApi = {
    init: {url: `${WXAPI}/cart/getCartInfo`, method: "get"},
    coupon: {url: `${WXAPI}/cart/getCouponsSuitShop`, method: "get"},
    recommend:{ url:`${WXAPI}/cart/getRecommendItems`, method:"get"},
    collect: {url: `${WXAPI}/cart/moveToCollect`, method: "post"},
    update: {url: `${WXAPI}/cart/modify`, method: "post"},
    remove: {url: `${WXAPI}/cart/remove`, method: "post"},
    receiveCoupon: {url: `${WXAPI}/promotion/obtainCoupon`, method: "post"},
    clear: {url: `${WXAPI}/cart/clearTrash`, method: "post"},
    saleAttributes: {url: `${WXAPI}/cart/getSaleAttributes`, method: "get"},
    replaceSku: {url: `${WXAPI}/cart/replaceSku`, method: "post"}
};

const dateFormat = function(fmt) {
    let date = new Date()
    var o = {
        "M+" : date.getMonth()+1,                 //月份
        "d+" : date.getDate(),                    //日
        "h+" : date.getHours(),                   //小时
        "m+" : date.getMinutes(),                 //分
        "s+" : date.getSeconds(),                 //秒
        "q+" : Math.floor((date.getMonth()+3)/3), //季度
        "S"  : date.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt)) {
        fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
    for(var k in o) {
        if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
    return fmt;
}

const compare = function (prop, sort) {
    return function (obj1, obj2) {
        const val1 = parseFloat(obj1[prop]);
        const val2 = parseFloat(obj2[prop]);
        if (val1 < val2) {
            if(sort){
                return -1;
            } else {
                return 1
            }
        } else if (val1 > val2) {
            if(sort){
                return 1;
            } else {
                return -1
            }

        } else {
            return 0;
        }
    }
}


class ShopCart extends Component {
    componentWillMount() {
        if (this.props.isLogin) {
            this.props.initialData();
        }
        if( this.props.recommendList && this.props.recommendList.length <= 0 ){
            this.props.initRecommend();
        }
    }

    componentDidMount() {
        this.headerScrollEvent();
    }

    componentWillReceiveProps(newProps, oldProps) {
        if (newProps.isLogin && !this.props.isLogin) {
            this.props.initialData();
        }
    }

    componentDidUpdate() {
        this.headerScrollEvent();
    }

    componentWillUnmount() {
        loadMask.destroy();
        tip.destroy();
        modalA.destroy();
        this.props.dividePayClose();
        this.props.closeCoupon();
        $(window).unbind('scroll');
        // window.removeEventListener('scroll', this.headerScrollFixed);
    }

    headerScrollEvent=()=>{
        if(this.props.isLogin && !this.props.load){
            $(window).unbind('scroll');
            let headerArr = Array.from($(".header-wrap .header"));
            headerArr.map((dom,i)=>{
                $(dom).css({position:"relative", zIndex:3,top:""});
            });
            let offsetTopArr = headerArr.map((dom)=>{
                return $(dom).offset().top;
            });
            if(headerArr.length > 0 ){
                const headerScrollFixed = (e)=>{
                    let disTop = $(window).scrollTop();
                    let hasFixed = false;
                    for(let i = offsetTopArr.length-1; i >= 0; i-- ){
                        if(offsetTopArr[i] <= disTop && !hasFixed ){
                            if( i!== offsetTopArr.length-1 && offsetTopArr[i+1]-50 < disTop ){
                                $(headerArr[i]).css({position:"fixed",zIndex:3,top: offsetTopArr[i+1] - 50 -disTop });
                            }else{
                                $(headerArr[i]).css({position:"fixed",zIndex:3,top:0});
                            }
                            hasFixed = true;
                        }else{
                            $(headerArr[i]).css({position:"relative", zIndex:3,top:""});
                        }
                    }
                };
                window.addEventListener('scroll', headerScrollFixed);
                $(window).trigger('scroll');
            }
        }
    };


    handleCheck = () => {
        this.props.handleCheck(this.props.data, this.props.exchangeItem)
    };

    replaceSku = (cart_id, sku_id) => {
        let { replaceSku, closeSaleAttr, initialData } = this.props
        replaceSku({
            cart_id: cart_id,
            sku_id: sku_id
        }, () => {
            closeSaleAttr()
            initialData()
        })
    }

    render() {
        let {data, exchangeItem} = this.props;
        const hasData = data && ( data.shop_cart.length || data.shop_cart.length );
        return <div id='p-shop-cart' className="p-shop-cart" style={{minHeight: this.props.winHeight}} ref='shopCart'>
            { (() => {
                if (this.props.pending) {
                    return <AnimateLoad  isFixed />;
                } else if (!this.props.isLogin) {
                    return  <EmptyPage config={{
                        msg: "登录后将显示您之前加入的商品~",
                        btnText: "登录",
                        link: location.href,
                        imgUrl: "/src/img/shopCart/shop-cart-no-login.png",
                        imgWidth:137,
                        imgHeight:110
                    }}/>
                } else if (this.props.load) {
                    return <AnimateLoad isFixed />;
                }else if(this.props.error){
                    return <ErrorPage btnClick={this.props.pageReload}
                                      text="加载失败,点击重试~"
                                      imgUrl='/src/img/shopCart/face-cry.png'
                    />
                }else if(this.props.netError){
                    return <ErrorPage btnClick={this.props.pageReload}/>
                } else if (hasData) {
                    return <div>
                        <CartBody key="cart-body" { ...this.props }/>
                        <CartTotal data={ this.props.cartTotal }
                                   cartCheck={ data.cartCheck }
                                   editNum={ this.props.editNum }
                                   key="cart-total"
                                   handleCheck={ this.handleCheck }
                                   handleCollects={ this.props.handleCollects }
                                   handleRemoves={ this.props.handleRemoves }
                                   updateData={ this.props.updateData }
                                   formSubmit={ this.props.formSubmit }/>

                        { this.props.coupon.show && <CouponPopup close={this.props.closeCoupon}
                                                                 shopName={this.props.coupon.shopName}
                                                                 isBiz={this.props.coupon.isBiz}
                                                                 couponHandle={this.props.receiveCoupon}
                                                                 data={this.props.coupon.list}/> }
                        { this.props.saleAttr.show && <SaleAttr {...this.props.saleAttr}
                                                                close={this.props.closeSaleAttr}
                                                                saleAttrSelect={this.props.saleAttrSelect}
                                                                replaceSku={this.replaceSku}
                        />}

                        <ReturnTop style={{zIndex:11}}/>

                    </div>
                } else {
                    return <EmptyPage config={{
                        msg: "购物袋空荡荡，快去商城逛逛吧~",
                        btnText: "去首页",
                        link: "",  //小程序首页
                        imgUrl: "/src/img/shopCart/face-said.png",
                        imgWidth:137,
                        imgHeight:137
                    }}/>
                }
            })()}
            { !this.props.pending && !( this.props.load && this.props.isLogin ) &&
            !this.props.error && !this.props.netError &&
            this.props.recommendList && this.props.recommendList.length > 0 &&
            <div className="item-recom">
                <ItemSwipe data={this.props.recommendList}
                           updateData={this.props.initRecommend}/>
            </div>
            }
            <Navigator ref="navigator"/>
        </div>
    }
}

//购物车body
class CartBody extends Component {
    clearInvItem = () => {
        let { updateData, initialData } = this.props
        updateData("clear","", () => {
            initialData()
        })
    }
    render() {
        const {data} = this.props;
        const {shop_cart, unable, count_cart} = data;
        const valHtml = shop_cart.map((item, i) => {
            return <CartStore { ...this.props }
                              key={ i }
                              data={item}
                              invalid={ false } />;
        });
        return (
            <div className="cart-body">
                <div className="cart-val">
                    {valHtml}
                </div>
                { !!unable.length &&
                <div className="cart-inv">
                    <InvalidItemList data={unable}
                                     clearInvItem={this.clearInvItem}/>
                </div>
                }
            </div>
        )
    }
}

//购物车store
class CartStore extends Component {
    constructor(props) {
        super(props);
        this.state = {
            edit: false,
            data: props.data
        };
    }

    componentWillReceiveProps(props) {
        this.setState({data: props.data});
    }

    componentWillUnmount() {
        if (this.state.edit) {
            this.toggleEdit(false);
        }
    }

    //改变编辑状态
    toggleEdit = () => {
        this.setState({edit: !this.state.edit});
        this.props.computeEditNum(!this.state.edit);
    };
    //店铺check
    toggleCheck = () => {
        let {data, handleCheck, exchangeItem} = this.props;
        handleCheck(data, exchangeItem, data['shop_info'].shop_id)
    };

    render() {
        const {data} = this.state;
        return (
            <section className="cart-store c-mb10 c-bgfff">
                <div className="header-wrap">
                    <div className="header">
                        <StoreHeader data={data.shop_info}
                                     edit={ this.state.edit }
                                     popupCoupon={this.props.popupCoupon.bind(null,data.shop_info.alias || data.shop_info.name, data.shop_info.shop_icon === "icon_biz" ) }
                                     toggleEdit={ this.toggleEdit }
                                     handleCheck={ this.toggleCheck }
                                     initialData={ this.props.initialData }
                        />
                    </div>
                </div>
                <CartStoreBody {...this.props}
                               data={data.promotion_list }
                               edit={this.state.edit }
                               shopId={ data.shop_level_group_id }/>

                {/*<CartStoreTotal data={ data.totalCart }/>*/}
            </section>
        )
    }
}


//购物车store body
class CartStoreBody extends Component {
    render() {
        const {edit, data, shopId, exchangeItem, deleteExchangeItem} = this.props;
        const html = data.map((item, i) => {
            if(item.cart_list && item.cart_list.length > 0){
                return <StoreMarket edit={edit} key={i}
                                    data={item}
                                    shopId={ shopId }
                                    exchangeItem={exchangeItem}
                                    deleteExchangeItem={deleteExchangeItem}
                                    timeStamp={ item.timeStamp }/>;
            }
        });
        return (
            <div className="store-body">
                {html}
            </div>
        )
    }
}

//购物车store 营销
class StoreMarket extends Component {
    constructor(props) {
        super(props);
        this.state = {
            Num: 0,
            Price: 0
        }
    }

    componentDidMount() {
        let {data} = this.props;
        let {cart_list} = data
        let calPrice = this.calPrice(cart_list)
        let Num = calPrice.num
        let Price = calPrice.price
        this.setState({
            Num: Num,
            Price: Price
        })
    }
    componentWillReceiveProps(newProps) {
        //换购反选删除子商品
        let {data, exchangeItem, deleteExchangeItem} = newProps;
        let {cart_list, rules} = data
        cart_list = JSON.parse(JSON.stringify(cart_list))
        let exchange_full = 0
        if( rules && rules['ExchangeBuy'] ) {
            exchange_full = rules['ExchangeBuy']['exchange_full']
        }
        let promotion_id = data['group_promotion_id']
        let exchangeData = exchangeItem['data']
        let calPrice = this.calPrice(cart_list)
        let Num = calPrice.num
        let Price = calPrice.price
        this.setState({
            Num: Num,
            Price: Price
        })
        if(exchangeData && exchangeData[promotion_id] && calPrice.price < exchange_full){
            deleteExchangeItem(promotion_id)
        }
    }
    calPrice(cart_list) {
        let Num = 0
        let Price = 0
        if( cart_list && cart_list.length > 0 ) {
            cart_list.map((cart) => {
                let {promotion_single, quantity, sell_price, check, biz_rules} = cart
                let bizPrice = ''
                let cart_price = +sell_price;
                if( promotion_single && promotion_single.price && promotion_single.price >0 ) {
                    if(promotion_single.type === "SecKill"){
                        if( new Date(promotion_single.start_time).getTime() <= new Date().getTime() < new Date(promotion_single.end_time).getTime()){
                            cart_price = +promotion_single.price
                        }
                    } else {
                        cart_price = +promotion_single.price
                    }
                }
                let isSingle = promotion_single && ['FlashSale', 'DirectReduction', 'SecKill'].indexOf(promotion_single.type) > -1 ? true: false
                bizPrice = !isSingle && biz_rules && biz_rules.length > 0 ? (() => {
                    biz_rules.sort(compare('threshold', true))
                    let _p = cart_price
                    biz_rules.some((rules) => {
                        if( parseFloat(rules.threshold) > parseFloat(quantity)) {
                            return true
                        } else {
                            _p = +rules.sell_price
                            return false
                        }
                    })
                    return _p
                })():""
                if(check){
                    Num += quantity
                    if(promotion_single && promotion_single.price && promotion_single.price >0){
                        Price += parseFloat(quantity) * parseFloat(promotion_single.price)
                    } else {
                        if(bizPrice){
                            Price += parseFloat(bizPrice)* parseFloat(quantity)
                        } else {
                            Price += parseFloat(sell_price)* parseFloat(quantity)
                        }
                    }
                }
            })
        }
        return {
            num: Num,
            price: Price
        }

    }
    render() {
        let {Num, Price} = this.state
        let {data, edit, shopId, timeStamp, exchangeItem} = this.props;
        //计算组合商品的总价 （包括企业购，活动价，单价）
        let {cart_list, rules} = data
        cart_list = JSON.parse(JSON.stringify(cart_list))
        let exchange_full = 0
        if( rules && rules['ExchangeBuy'] ) {
            exchange_full = rules['ExchangeBuy']['exchange_full']
        }
        let promotion_id = data['group_promotion_id']
        let exchangeData = exchangeItem['data']
        let exchangeDataLength = 0
        const itemList = data.cart_list && data.cart_list.length > 0 && data.cart_list.map((item, i) => {
            if (!item) {
                return "";
            }
            if (item.promotion_gift_buy && item.promotion_gift_buy.gifts && item.promotion_gift_buy.gifts.length > 0) {
                return <div className="gift-list" key={i}>
                    <OneItemHOC edit={edit}
                                type={data.type}
                                data={item}
                                key={i}
                                timeStamp={ timeStamp }/>
                    {item.promotion_gift_buy.gifts.map((gift, j) => {
                        return <SpecItemHOC edit={edit}
                                            give={true}
                                            disCtrl={true}
                                            type={data.type}
                                            data={gift}
                                            mainQuantity={item.quantity}
                                            key={j}/>
                    })}
                </div>
            } else {
                return <OneItemHOC edit={edit}
                                   type={data.type}
                                   data={item}
                                   key={item.sku_id + "_" +i}
                                   timeStamp={ timeStamp }/>
            }
        });

        let hasExchange = false
        const specList = Price > 0 && Price >= exchange_full &&  exchangeData && exchangeData[promotion_id] && exchangeData[promotion_id].map((item, i) => {
            if(item.check){
                exchangeDataLength += 1
                hasExchange = true
                return <SpecItemHOC edit={edit}
                                    type={data.type}
                                    data={item}
                                    key={i}/>
            }
        })
        return (
            <section
                className={`store-market ${ data.type === "ExchangeBuy" ? "exchange" : data.type !== "Common" ? "activity" : "common"}`}>
                { data.type !== "Common" && <MarketHeader edit={edit} {...data} shopId={ shopId } Num={Num} Price={Price} exchangeDataLength={exchangeDataLength}/> }
                <div className="common-list">
                    {itemList}
                </div>
                {specList && <div className="spec-list">
                    {specList}
                </div>
                }
                {/*换购文案显示还有问题*/}
                { data.type === "ExchangeBuy" && !edit && <ExchangeRow {...data}
                                                              hasExchange={hasExchange}
                                                              Price={Price}
                                                              able={!edit}
                                                              shopId={ shopId }/> }
            </section>
        )
    }
}

//一个商品
class OneItemCtrl extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            statusTip: false,
            quantity: props.data.quantity,
            initQuantity: props.data.quantity,
            isOpen: false
        };
        this.delayNumUpdate = delay(props.updateData, 200);
    }

    componentWillMount() {
        this.initBuyLimit();
    }

    componentWillReceiveProps(newProps) {
        if( this.props.edit && !newProps.edit ){
            this.setState({isOpen:false});
        }
        if( this.props.edit && newProps.edit) {
            this.setState({
                quantity:newProps.data.quantity
            });
        }
    }

    //初始化商品可购买最大数量
    initBuyLimit = () => {
        const {data} = this.props;
        const {promotion, store} = data;
        let max = store.real;
        let real = max;
        if (promotion && promotion.real_store) {
            max = promotion.real_store;
            real = max;
        }
        if (promotion && promotion.promotion_type === "flashsale") {
            max = promotion.user_buy_limit - promotion.user_buy_count;
        }
        this.setState({
            buyLimit: max,
            realStore: real
        });
    };

    toggleTip = () => {
        this.setState({statusTip: !this.state.statusTip})
    };

    //切换check
    handleCheck = () => {
        let {data, handleCheck, exchangeItem} = this.props;
        handleCheck(data,exchangeItem)
    };

    //input数量 change 变化
    handleNum = (e) => {
        if (!Number.isInteger(+e.target.value) && e.target.value !=="") {
            return;
        }
        this.setState({
            quantity: +e.target.value || ""
        });
        this.updateItemNum(+e.target.value || "")
    }

    updateItemNum = (num) => {
        const { data, handleItemNum, exchangeItem } = this.props
        handleItemNum(data.cart_id, num, exchangeItem)
    }

    //input数量 blur 变化
    handleInputNum = (e) => {
        let dom = e.target,
            {data, initialData} = this.props,
            {initQuantity, quantity} = this.state;
        let min = +dom.getAttribute("min");
        let max = +dom.getAttribute("max");
        if (quantity === initQuantity) {
            return;
        }
        if (!Number.isInteger(quantity)) {
            tip.show({msg: "请输入正确的数量哦"});
            this.setState({
                quantity: initQuantity
            });
            this.updateItemNum(initQuantity)
            return;
        }
        if (quantity < min) {
            tip.show({msg: "至少需要1件哦"});
            this.setState({
                quantity: initQuantity
            });
            this.updateItemNum(initQuantity)
            return;
        }
        if (max && quantity > max) {
            tip.show({msg: "已超出可购数量"});
            this.setState({
                quantity: max
            });
            this.updateItemNum(max)
            return;
        }
        this.delayNumUpdate("update", {
            cart_id: data.cart_id,
            num: quantity
        });
    };

    //点击减少
    handleReduce = () => {
        let {data, initialData} = this.props
        let {cart_id} = data
        let {quantity} = this.state;
        this.setState({quantity: quantity - 1})
        this.updateItemNum(quantity - 1)
        this.delayNumUpdate("update", {
            cart_id: cart_id,
            num: quantity - 1
        });
    };

    //点击增加
    handlePlus = () => {
        let {data, initialData} = this.props
        let {cart_id} = data
        let {quantity} = this.state;
        this.setState({quantity: quantity + 1})
        this.updateItemNum(quantity + 1)
        this.delayNumUpdate("update", {
            cart_id: cart_id,
            num: quantity + 1
        });
    };

    //移入收藏夹
    handleCollect = (cb) => {
        let {data, initialData} = this.props;
        modalA.show({
            msg: "当前选中的商品移入收藏夹成功后，将从购物袋删除哦",
            sure: () => {
                this.props.updateData("collect", {
                    cart_ids: [data.cart_id]
                }, () => {
                    initialData()
                })
            }
        })
    };

    //点击删除
    handleDelete = (cb) => {
        let {data, initialData} = this.props;
        modalA.show({
            msg: "确定将这1件商品删除？",
            sure: () => {
                this.props.updateData("remove", {
                    cart_ids: [ data.cart_id ]
                }, () => {
                    initialData()
                })
            }
        })
    };

    closeSwipe = () => {
        this.setState({isOpen: false});
    }
    //获取打开状态
    getIsOpen = (status) => {
        this.setState({isOpen: status});
    };

    render() {
        return (
            <div className="one-item-grid">
                <SwipeCtrlWidget isOpen={this.state.isOpen}
                                 getIsOpen={this.getIsOpen}>
                    <OneItem  {...this.props} {...this.state}
                              hiddenDelete={this.state.isOpen}
                              toggleTip={this.toggleTip }
                              handleCheck={ this.handleCheck }
                              handleNum={ this.handleNum }
                              handleInputNum={ this.handleInputNum }
                              handleReduce={ this.handleReduce }
                              handlePlus={ this.handlePlus }
                              handleDelete={ this.handleDelete }
                              handleCollect={ this.handleCollect}/>

                    <SwipeCtrlWidget.ItemCtrl handleCollect={this.handleCollect}
                                              handleDelete={this.handleDelete}/>
                </SwipeCtrlWidget>
            </div>
        )
    }
}


//特殊商品
class SpecItemCtrl extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false
        }
    }

    componentWillReceiveProps(newProps) {
        if (this.props.edit && !newProps.edit) {
            this.setState({isOpen: false});
        }
    }

    //获取打开状态
    getIsOpen = (status) => {
        this.setState({isOpen: status});
    };

    //移入收藏夹
    handleCollect = (cb) => {
        let {data, dispatch, initialData} = this.props;
        modalA.show({
            msg: "当前选中的商品移入收藏夹成功后，将从购物袋删除哦",
            sure: () => {
                this.props.updateData("collect", {
                    cart_ids: [data.cart_id]
                }, () => {
                    initialData()
                })
            }
        })
    };

    //点击删除
    handleDelete = (cb) => {
        let {data, initialData} = this.props;
        modalA.show({
            msg: "确定将这1件商品删除？",
            sure: () => {
                this.props.updateData("remove", {
                    cart_ids: [ data.cart_id ]
                }, () => {
                    initialData()
                })
            }
        })
    };

    render() {
        let {data, disCtrl} = this.props;
        let formData = formItemData(data);
        return (
            <div className="one-item-grid">
                { disCtrl ?
                    <SpecItem  {...this.props}
                               data={formData}
                               handleDelete={ this.handleDelete }
                               handleCollect={ this.handleCollect }/> :
                    <SwipeCtrlWidget isOpen={this.state.isOpen}
                                     getIsOpen={this.getIsOpen}>
                        <SpecItem  {...this.props}
                                   data={formData}
                                   handleDelete={ this.handleDelete }
                                   handleCollect={ this.handleCollect }/>
                        <SwipeCtrlWidget.ItemCtrl handleDelete={ this.handleDelete }
                                                  handleCollect={ this.handleCollect}/>
                    </SwipeCtrlWidget>
                }
            </div>
        )
    }
}

//失效商品列表
class InvalidItemList extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            edit: false
        }
    }

    toggleEdit = () => {
        this.setState({edit: !this.state.edit});
    };

    render() {
        return <div className="invalid-list">
            <div className="header-wrap">
                <div className="header">
                    <div className="bl">
                        失效商品{this.props.data.length}件
                    </div>
                    <div className="br">
                        <span className="text" onClick={this.props.clearInvItem}>清空失效商品</span>
                        <span className="ctrl" onClick={this.toggleEdit}>{this.state.edit ? "完成" : "编辑"}</span>
                    </div>
                </div>
            </div>
            <div className="list">
                {this.props.data.map((item, i) => {
                    return <InvalidItemHOC data={item} key={i}
                                           edit={this.state.edit}
                                           invalid={true}/>
                })}
            </div>
        </div>
    }
}

//失效商品
class InvalidItemCtrl extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false
        }
    }

    componentWillReceiveProps(newProps) {
        if (this.props.edit && !newProps.edit) {
            this.setState({isOpen: false});
        }
    }

    handleCollect = (cb) => {
        let {data, initialData} = this.props;
        modalA.show({
            msg: "当前选中的商品移入收藏夹成功后，将从购物袋删除哦",
            sure: () => {
                this.props.updateData("collect", {
                    cart_ids: [data.cart_id]
                }, () => {
                    initialData()
                })
            }
        })
    };

    //点击删除
    handleDelete = (cb) => {
        let {data, initialData} = this.props;
        modalA.show({
            msg: "确定将这1件商品删除？",
            sure: () => {
                this.props.updateData("remove", {
                    cart_ids: [ data.cart_id ]
                }, () => {
                    initialData()
                })
            }
        })
    };

    //获取打开状态
    getIsOpen = (status) => {
        this.setState({isOpen: status});
    };

    render() {
        return <div className="one-item-grid">
            <SwipeCtrlWidget ctrlWidth={57}
                             isOpen={this.state.isOpen}
                             getIsOpen={this.getIsOpen}>
                <InvalidItem {...this.props}
                             hiddenDelete={this.state.isOpen}
                             handleDelete={this.handleDelete}
                             handleCollect={this.handleCollect}/>
                <SwipeCtrlWidget.ItemCtrl noCollect width={57}
                                          handleDelete={this.handleDelete}/>
            </SwipeCtrlWidget>
        </div>
    }

}


function itemState(state) {
    return {
        curTime:state.shopCart.curTime,
        exchangeItem: {...state.exchangeItem}
    }
}

function itemDispatch(dispatch) {
    return {
        dispatch,
        initialData(){
            dispatch((dispatch, getState) => {
                let _exchangeItem = getState().exchangeItem
                axios.request(pageApi.init).then(result => {
                    if(result.data.code === 0){
                        let data = {...result.data, status: result.status}
                        dispatch(createActions('initialData', {result: data, exchangeItem: _exchangeItem}));
                    } else {
                        dispatch( createActions('initialError') );
                        // tip.show({msg: result.data.message});
                        return;
                    }

                }).catch(error => {
                    console.log(error);
                    try{
                        if( error.response.status === 504){
                            dispatch( createActions('netError') );
                        }else{
                            dispatch( createActions('initialError') );
                        }
                    }catch(e){
                        console.log(e);
                    }
                })
            })
        },
        updateData(api, data, cb){
            loadMask.show();
            axios.request({
                ...pageApi[api],
                data: data
            }).then(result => {
                loadMask.destroy();
                if(result.data.message){
                    tip.show({msg: result.data.msg});
                }
                if (cb && typeof cb === "function") cb();

            }).catch(error => {
                loadMask.destroy();
                tip.show({msg: error.message || error.response.data.message||'小泰发生错误，请稍后再试~'});
                console.error(error);
            })
        },
        handleCheck(data, exchangeItem){
            dispatch(createActions('updateSingleCheck', {id: data.cart_id, exchangeItem }))
        },
        handleItemNum(id, num, exchangeItem){
            dispatch(createActions('handleItemNum', {id: id , num, exchangeItem }))
        },
        handleDelete(id, exchangeItem){
            dispatch(createActions('handleDelete', {id: id , exchangeItem }))
        },
        // 销售属性弹窗
        popupSaleAttr(item_id, img, sku_id, cart_id) {
            let scrollTop=0;
            if(document.documentElement&&document.documentElement.scrollTop){
                scrollTop=document.documentElement.scrollTop;
            }else if(document.body){
                scrollTop=document.body.scrollTop;
            }
            const shopCart = document.getElementById('p-shop-cart')
            shopCart.style.position = 'fixed'
            shopCart.style.top = -scrollTop + 'px'
            loadMask.show();
            axios.request({
                ...pageApi.saleAttributes,
                params: {
                    item_id: item_id
                }
            }).then(result => {
                loadMask.destroy();
                if (!result.data.code === 0) {
                    tip.show({msg: result.data.message});
                    return;
                }
                let {specs, skus} = result.data.data
                let selectList = []
                let select = {}
                skus.map((s) => {
                    if(s.sku_id == sku_id){
                        selectList = s.select_spec_id.split('_')
                    }
                })
                specs.map((sp) => {
                    let values = sp.values
                    values.map((v) => {
                        if(selectList.indexOf((v.spec_value_id+"")) > -1){
                            select[sp['spec_id']] = v['spec_value_id']
                        }
                    })
                })
                dispatch(createActions('ctrlSaleAttr', {data: result.data.data , show: true, img:img, sku_id, select, cart_id }))
            }).catch(error => {
                loadMask.destroy();
                tip.show({msg: "小泰发生错误，请稍后再试~"});
                console.log(error);
            });


        }
    }
}

const OneItemHOC = connect(itemState, itemDispatch)(OneItemCtrl);
const SpecItemHOC = connect(itemState, itemDispatch)(SpecItemCtrl);
const InvalidItemHOC = connect(itemState, itemDispatch)(InvalidItemCtrl);


//购物车总和
class CartTotal extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let {data, cartCheck, exchangeData} = this.props;
        let exchangePrice = 0  //换购物品总价格
        return (
            <section className="cart-total">
                <div className="select-all" onClick={ this.props.handleCheck }><CheckIcon isCheck={ cartCheck }/>全选
                </div>
                {  this.props.editNum ?
                    <div className="cart-collect"
                         onClick={  this.props.handleCollects.bind(null, data.strip) }>
                        <div className="black-btn btn">移入收藏夹</div>
                    </div> :
                    <div className="cart-total-dtl">
                        <p className="c-fs12">
                            合计(不含税)：<span className="c-fs15 c-cf00"><i>¥</i>{+data.disPrice.toFixed(2)}</span>
                        </p>
                        {
                            +(+data.discount).toFixed(2) > 0 ? <p className="c-fs10 c-c999">
                                <span>总额：¥{+data.price.toFixed(2)}</span> 优惠：<i>¥</i>{+(+data.discount).toFixed(2)}</p>: ''
                        }
                    </div>
                }
                { this.props.editNum ?
                    <div className="cart-delete"
                         onClick={ this.props.handleRemoves.bind(null) }>
                        <div className="red-btn btn">删除商品</div>
                    </div> :
                    ( data.num ?
                            <div className="cart-submit btn c-bgdred" onClick={ this.props.formSubmit }>
                                <span>结算({ data.num })</span>
                            </div> :
                            <div className="cart-submit btn c-bgc9">
                                <span>结算{ data.num ? `(${ data.num })` : ""}</span>
                            </div>
                    )
                }
            </section>
        )
    }
}

function noUndefined(str) {
    return str !== undefined;
}

function getCheckData(data, keyArr) {
    if (!( data && data.length )) {
        return {};
    }
    let result = {};

    const typeData = function (arr, data) {
        arr.forEach((key) => {
            if (!result[key]) {
                result[key] = [];
            }
            result[key].push(data[key]);
        })
    };
    data.forEach((sotre) => {
        sotre.activity.forEach((act) => {
            act.items.forEach((item) => {
                if (item.is_checked) {
                    typeData(keyArr, item);
                }
            });
        });
    });
    return result;
}

function formItemData(data) {
    return {
        ...data,
        // image_default_id: noUndefined(data.image_default_id) ? data.image_default_id : data.primary_image,
        price: noUndefined(data.price) ? data.price : data.sell_price,
        // quantity: noUndefined(data.quantity) ? data.quantity : data.gift_num,
    }
}

//connect state
function shopCartState(state, props) {
    return {
        ...state.global,
        ...state.shopCart,
        exchangeItem: {...state.exchangeItem}
    }
}

function addInfoTosession(subscribe, promotion_list, _exchangeItem) {
    promotion_list.map((promotion) => {
        let {cart_list, group_promotion_id,type} = promotion
        let promotion_cart_id = promotion.cart_id
        let isGift = false
        let single_promotion_id = null
        cart_list.map((cart) => {
            let {check, quantity, cart_id, item_id, sku_id, extra, promotion_single, promotion_gift_buy} = cart
            isGift = (promotion_gift_buy && promotion_gift_buy.type ==="GiftBuy") ? true: false
            single_promotion_id = (promotion_gift_buy && promotion_gift_buy.type ==="GiftBuy") ? promotion_gift_buy.single_promotion_id: null
            let commission_user_id = null
            if(extra && extra['commission_user_id']){
                commission_user_id = extra['commission_user_id']
            }
            let _promotion = []
            let _extra = {}
            _extra['promotion'] = _promotion
            if(commission_user_id){
                _extra['commission_user_id'] = commission_user_id
            }
            let isSecKill = false
            if(promotion_single && promotion_single.type === "SecKill"){
                isSecKill = true
            }
            if (check && !isSecKill) {
                if (type === 'ExchangeBuy' || isGift) {
                    _extra['promotion'] = [{
                        "promotion_id": isGift ? single_promotion_id : group_promotion_id,
                        "role": "main_good",
                        "type": isGift ? 'GiftBuy': 'ExchangeBuy'
                    }]
                    subscribe.push({
                        quantity: quantity,
                        cart_id: cart_id,
                        item_id: item_id,
                        sku_id: sku_id,
                        extra: _extra,
                        created_at: dateFormat('yyyy-MM-dd hh:mm:ss')
                    })
                } else {
                    subscribe.push({
                        quantity: quantity,
                        cart_id: cart_id,
                        item_id: item_id,
                        sku_id: sku_id,
                        extra: _extra,
                        created_at: dateFormat('yyyy-MM-dd hh:mm:ss')
                    })
                }
            }
            if (extra && extra['promotion']) {
                _promotion = [].concat(extra['promotion'])
            }
        })
        if(_exchangeItem.data){
            let _exchangeData = JSON.parse(JSON.stringify(_exchangeItem.data))
            if(_exchangeData[group_promotion_id]){
                _exchangeData[group_promotion_id].map((ex) => {
                    if(ex.check){
                        if(type === 'ExchangeBuy'){
                            subscribe.push({
                                quantity: 1,
                                cart_id: 0,
                                item_id: ex.item_id,
                                sku_id: ex.sku_id,
                                extra: {
                                    promotion: [{
                                        "promotion_id": group_promotion_id,
                                        "role": "exchange_good",
                                        "type": "ExchangeBuy"
                                    }]
                                },
                                created_at: dateFormat('yyyy-MM-dd hh:mm:ss')
                            })
                        }
                    }
                })
            }
        }
    })
}

//connect dispatch
function shopCartDispatch(dispatch, props) {
    return {
        dispatch,
        dividePayClose: () => {
            dispatch(createActions('dividePrompt', {status: false}));
        },
        deleteExchangeItem: (promotionId) => {
            dispatch(createExchangeActions('itemDelete', {result: {promotionId: promotionId}}));
        },
        //初始化购物袋
        initialData(reload){
            dispatch((dispatch, getState) => {
                let _exchangeItem = getState().exchangeItem
                axios.request(pageApi.init).then(result => {
                    if(result.data.code === 0){
                        let data = {...result.data, status: result.status}
                        dispatch(createActions('initialData', {result: data, exchangeItem: _exchangeItem}));
                    } else {
                        dispatch( createActions('initialError') );
                        // tip.show({msg: result.data.message});
                        return;
                    }

                }).catch(error => {
                    console.log(error);
                    try{
                        if( error.response.status === 504){
                            dispatch( createActions('netError') );
                        }else{
                            dispatch( createActions('initialError') );
                        }
                    }catch(e){
                        console.log(e);
                    }
                })
            })
        },
        //初始化推荐
        initRecommend(cb){
            axios.request(pageApi.recommend)
                .then( result =>{
                    if(cb) cb();
                    if( result.data.code != 0 ){
                        if(cb) tip.show({msg: result.data.message});
                        return;
                    }
                    dispatch( createActions('initRecommend',{ data: result.data.data }));
                }).catch(error=>{
                tip.show({msg: error.response.data.message||'小泰发生错误，请稍后再试~'});
                if(cb){
                    cb();
                }
                console.log(error);
            })
        },
        computeEditNum(status){
            dispatch(createActions('computeEdit', {status: status}))
        },

        handleCheck(data, exchangeItem, id){
            let imData = JSON.parse(JSON.stringify(data));
            if(id){
                dispatch(createActions('updateShopCheck', {id: id, exchangeItem: exchangeItem}))
            } else {
                dispatch(createActions('updateCartCheck', {data: imData, exchangeItem: exchangeItem}))
            }
        },

        updateData(api, data, cb){
            loadMask.show();
            axios.request({
                ...pageApi[api],
                data: data
            }).then(result => {
                loadMask.destroy();
                result.data.message && tip.show({msg: result.data.message});
                if (cb && typeof cb === "function") cb();
            }).catch(error => {
                loadMask.destroy();
                tip.show({msg: error.message || error.response.data.message||'小泰发生错误，请稍后再试~'});
                console.log(error);
            })
        },
        replaceSku(data, cb){
            loadMask.show();
            axios.request({
                ...pageApi["replaceSku"],
                data: data
            }).then(result => {
                loadMask.destroy();
                // tip.show({msg: result.data.message})
                if (cb && typeof cb === "function") cb();
            }).catch(error => {
                loadMask.destroy();
                tip.show({msg: error.response.data.message||'小泰发生错误，请稍后再试~'});
                console.log(error);
            })
        },
        //获取优惠券弹窗
        popupCoupon( shopName, isBiz, shopId){
            loadMask.show();
            axios.request({
                ...pageApi.coupon,
                params: {
                    shop_id: shopId
                }
            }).then(result => {
                loadMask.destroy();
                if (!result.data.code === 0) {
                    tip.show({msg: result.data.message});
                    return;
                }
                dispatch(createActions('ctrlCoupon',
                    {
                        data: result.data.data,
                        show: true,
                        shopName:shopName
                    }));

            }).catch(error => {
                loadMask.destroy();
                tip.show({msg: error.response.data.message||'小泰发生错误，请稍后再试~'});
                console.log(error);
            });
        },

        receiveCoupon(data, cb){
            loadMask.show();
            axios.request({...pageApi.receiveCoupon,
                data: {
                    coupon_id: data.coupon_id,
                    source: "other"
                }}).then( result =>{
                loadMask.destroy();
                tip.show({msg:result.data.message || '领取成功'});
                typeof cb === "function" && cb();
            }).catch( error =>{
                loadMask.destroy();
                tip.show({msg: error.response.data.message||'小泰发生错误，请稍后再试~'});
                console.log(error);
            })
        },

        //关闭优惠券弹窗
        closeCoupon(){
            dispatch(createActions('ctrlCoupon', {data: [], show: false}));
        },
        closeSaleAttr() {
            let scrollTop=0;
            const shopCart = document.getElementById('p-shop-cart')
            shopCart.style.position = 'relative'
            scrollTop = shopCart.style.top
            let _scrollTop = scrollTop.replace('px', '')
            shopCart.style.top = ''
            dispatch(createActions('ctrlSaleAttr', {data: [], show: false}));
            window.scrollTo(0, -_scrollTop)
        },
        saleAttrSelect(spec_id, spec_value_id){
            let _select = {}
            _select[spec_id] = spec_value_id
            dispatch(createActions('saleAttrSelect', {spec_id: spec_id,  spec_value_id: spec_value_id}))
        },
        divideFormSubmit(type){
            dispatch((dispatch, getState) => {
                let _state = getState().shopCart
                let _exchangeItem = getState().exchangeItem
                let {cartTotal} = _state;
                let shop_cart = _state.data.shop_cart
                let subscribe = []
                shop_cart.map((shop) => {
                    let {promotion_list, shop_info} = shop
                    if (type === 1) { // 企业购
                        if( shop_info['shop_icon'] === 'icon_biz'){
                            addInfoTosession(subscribe, promotion_list, _exchangeItem)
                        }
                    } else {
                        if( shop_info['shop_icon'] !== 'icon_biz'){
                            addInfoTosession(subscribe, promotion_list, _exchangeItem)
                        }
                    }
                })

                if (type === 1) { //company
                    let orderInfo = {
                        buyMode: 'cart_buy',
                        bizMode: 'online',
                        bizAttr: 'company',
                        address: {},
                        subscribe: subscribe
                    }
                    sessionStorage.removeItem("cart_buy")
                    sessionStorage.setItem("cart_buy", JSON.stringify(orderInfo))
                    browserHistory.push(`${DIR}/orderConfirm?mode=cart_buy&buy_type=1`);
                } else {
                    let orderInfo = {
                        buyMode: 'cart_buy',
                        bizMode: 'online',
                        bizAttr: 'trmall',
                        address: {},
                        subscribe: subscribe
                    }
                    sessionStorage.removeItem("cart_buy")
                    sessionStorage.setItem("cart_buy", JSON.stringify(orderInfo))
                    browserHistory.push(`${DIR}/orderConfirm?mode=cart_buy&buy_type=0`);
                }
            });
        },
        formSubmit(){
            dispatch((dispatch, getState) => {
                let _state = getState().shopCart
                let _exchangeItem = getState().exchangeItem
                let {cartTotal} = _state;
              let shop_cart = _state.data.shop_cart
              let subscribe = []
              let shopIcon = 'icon_business'
              shop_cart.map((shop) => {
                let {promotion_list, shop_info} = shop
                shopIcon = shop_info.shop_icon
                addInfoTosession(subscribe, promotion_list, _exchangeItem)
              })
              let orderInfo = {
                buyMode:'cart_buy',
                bizMode:'online',
                bizAttr: 'trmall',
                address: {},
                subscribe: subscribe
              }
              sessionStorage.removeItem("cart_buy")
              sessionStorage.setItem("cart_buy", JSON.stringify(orderInfo))
              browserHistory.push(`${DIR}/orderConfirm?mode=cart_buy&buy_type=0`);
            });
        }
    }
}

function shopCartProps(stateProps, dispatchProps, props) {
    let {dispatch} = dispatchProps;
    return {
        ...stateProps,
        ...dispatchProps,
        ...props,
        //页面重新加载
        pageReload:()=>{
            dispatch(createActions('resetState'));
            dispatchProps.initialData();
        },
        //批量移入收藏夹
        handleCollects(num, cb){
            let {data} = stateProps
            let _num = false
            let {shop_cart} = data
            let cart_ids = []
            shop_cart.map((shop) => {
                let {promotion_list} = shop
                promotion_list.map((promotion) => {
                    let {cart_list} = promotion
                    cart_list.map((cart) => {
                        if(cart.check){
                            _num = true
                            cart_ids.push(cart.cart_id)
                        }
                    })
                })
            })
            if (!_num) {
                tip.show({msg: "您还没有选择商品哦"});
                return;
            }
            modalA.show({
                msg: "当前选中的商品移入收藏夹成功后，将从购物袋删除哦",
                sure: () => {
                    dispatchProps.updateData("collect", {
                        cart_ids: cart_ids
                    }, () => {
                        dispatchProps.initialData()
                    })
                }
            })
        },
        //批量删除
        handleRemoves(num, cb){
            let {data} = stateProps
            let _num = 0
            let {shop_cart} = data
            let cart_ids = []
            shop_cart.map((shop) => {
                let {promotion_list} = shop
                promotion_list.map((promotion) => {
                    let {cart_list} = promotion
                    cart_list.map((cart) => {
                        if(cart.check){
                            _num += cart.quantity
                            cart_ids.push(cart.cart_id)
                        }
                    })
                })
            })
            if (!_num) {
                tip.show({msg: "您还没有选择商品哦"});
                return;
            }
            modalA.show({
                msg: `确定将这${ _num }件商品删除？`,
                sure: () => {
                    dispatchProps.updateData("remove", {
                        cart_ids: cart_ids
                    }, () => {
                        dispatchProps.initialData()
                    })
                }
            });
        },
    }
}

export default connect(shopCartState, shopCartDispatch, shopCartProps)(ShopCart);