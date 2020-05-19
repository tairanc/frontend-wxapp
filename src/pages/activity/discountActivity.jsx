import React, { Component } from 'react';
import { LoadingRound, EmptyPageLink,TransShady } from 'component/common';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import { concatPageAndType, actionAxios, actionAxiosAll } from 'js/actions/actions'
import { PopupTip, PopupTipBig } from 'component/modal.jsx';
import { BuyModal } from "../itemNew/detail.jsx";
import { DropDownLoad } from 'component/HOC.jsx';
import echo from 'plugin/echo.js';
import axios from 'axios';

import './activity.scss';

const pageApi = {
    discountActivity: { url:"/wxapi/fullDiscount.api", method:"get"},//频道商品
    rule: { url:"/wxapi/promotionRule.api" , method:"get" },//频道规则
    shop: { url: "/wxapi/fullDiscountCart.api", method:"get" },//频道购物车
    addCart: { url:"/wxapi/cart-add.html", method:"post" },//商品加入购物车
    channelItem:{ url: "/wxapi/new/promotion.api", method: "get"},
    getCartCount:{ url: "/wxapi/getCartCount.api", method: "get"},//购物车数量
    itemData:{url: "/wxapi/detail.api", method: "get"}//商品数据
};

const createActions = concatPageAndType('minusActivity');
const axiosActions = actionAxios('minusActivity');
const axiosAllActions = actionAxiosAll('minusActivity');

const ItemNone =  <EmptyPageLink config={{ bgImgUrl:"/src/img/activity/item-none-page.png", msg:"暂时没有活动商品", btnText:"返回", btnClick:()=>{ history.go(-1) } }} />;
    
const ActivityEnd =  <EmptyPageLink config={{bgImgUrl:"/src/img/activity/activity-end-page.png", msg:"该活动已结束", btnText:"返回", btnClick:()=>{ history.go(-1) } }} />;

class DiscountActivity extends Component{
    constructor( props, context ){
        super( props );
        let { promotion_id,shop_id } = props.location.query;
        let urlInfo = {
            promotion_id: promotion_id,
            shop_id: shop_id
        }
        this.state = {
            urlInfo: urlInfo
        };

        document.title = "满折专场";
    }

    componentWillMount(){
        this.props.resetData();
        this.props.getData();
        if( this.props.isLogin ) this.props.getCartInfo();
    }
    componentWillReceiveProps( newProps ) {
        if( !this.props.isLogin && newProps.isLogin ){
            this.props.getCartInfo();
        }
    }
    componentDidMount() {
        echo.init({offset: 1500, throttle: 0});
    }
    
    componentDidUpdate() {
        echo.init({offset: 1500, throttle: 0});
    }

    dropDown =( me )=>{
        let { list,promotionId,dispatch } = this.props;
        if( list.page >= list.total ){
            me.lock();
            me.noData();
            me.resetload();
            return;
        }
        axios.request({ ...pageApi.discountActivity,
            params:{
                promotion_id: promotionId,
                page:list.page+1
            }
        }).then( result =>{
            if( !result.data.status ){
                dispatch( createActions('promptCtrl', {  prompt:{ show:true, msg:result.data.msg } }) );
                me.resetload();
                return;
            }
            dispatch( createActions('concatDataSuccess', { result: result.data }) );
            me.resetload();
        })
    }
    
    render(){
        if( this.props.load ) return <LoadingRound/>;
        if( !this.props.list.data ) return ItemNone;
        return <div data-page=" activity" style={{ minHeight:$(window).height(), background:"#f4f4f4" }}>
            <PageHead rules={ this.props.rule } cart={ this.props.cart } />
            <DropDownList scrollArea={ window } dropDown={ this.dropDown } isLogin={ this.props.isLogin } data={ this.props.list.data } 
                          itemData={this.props.itemData}  getChannelItem={ this.props.getChannelItem  } isApp={ this.context.isApp }
                          urlInfo = {this.state.urlInfo} />
            <PopupTip active={ this.props.prompt.show } msg={ this.props.prompt.msg } onClose={ this.props.promptClose } />
            <PopupTipBig active={ this.props.promptBig.show } msg={ this.props.promptBig.msg } onClose={ this.props.promptBigClose } />
            {/*加入购无车弹框*/}
            {this.props.modalCtrl.show ? <BuyModal {...this.props} buyModal={this.props.modalCtrl.show}  isNonPayment={this.props.isNonPayment}
                                        closeModal={this.props.closeModal} /> : null }
            {this.props.modalLoading && <TransShady />}
            <TotopAndCart data={this.props.countCart} />
        </div>
    }
}

class PageHead extends Component{
    parseRule(){
        let rules = JSON.parse( this.props.rules.rules);
        return rules.map(( list, i )=>{
					return list.full +"件" + list.discount/10 + "折";
				}).join("，");
    }
    render(){
      return <div className="page-head">
            <div className="main-text">以下商品{ this.parseRule() }</div>
            { this.props.cart && <div className="next-text"> { this.props.cart.display_text } </div> }
        </div>
    }
}

class PageMain extends Component{
	componentDidMount(){
		$('.page-main').css({minHeight: $(window).height()-95});
	}
    getHtml(){
        let { getChannelItem,itemData,isApp,isLogin,urlInfo } = this.props;
        return this.props.data.map( ( list, i )=>{
            return <OneItem key={ i } data={ list } getChannelItem ={getChannelItem} id={list.item_id}  
                            itemData={itemData} isApp={isApp} isLogin={isLogin} urlInfo={urlInfo}/>
        });
    }
    render(){
        return <div className="page-main">
            { this.getHtml() }
        </div>
    }
}

const DropDownList = DropDownLoad( PageMain );

class OneItem extends Component{
    itemCtrl( id, itemData ){
        let { promotion_id,shop_id } = this.props.urlInfo;
        let redirect = encodeURIComponent(`/discountActivity?promotion_id=${promotion_id}&shop_id=${shop_id}`);
        if( !this.props.isLogin ){
            browserHistory.push(`${DIR}/login?redirect_uri=${redirect}`);
            return;
        }
        this.props.getChannelItem();
    };

    render(){
        let { data, itemData } = this.props;
        return <div className="one-item-grid c-pr">
				{data.tags&&data.tags.H5_pic ? <img className='act-tag' src={data.tags.H5_pic} /> :(data.is_new?<span className='new-tag'>新品</span>:'')}
				<Link className="one-item" to={ `/item?item_id=${ data.item_id }`} >
				<div className="item-img">
					<img data-echo={data.primary_image?(data.primary_image+"_m.jpg"):"/src/img/search/no-goods-image.png"} src="/src/img/icon/loading/default-watermark.png" />
					{ data.store <= 0 && <div className="float-label"><img src="/src/img/search/sold-out-activity.png" /></div> }
					<div className="item-label">{ data.promotion_tag.join("|")}</div>
				</div>
				</Link>
				<div className="item-info">
					<Link className="one-item" to={ `/item?item_id=${ data.item_id }`} >
					<div className="item-title">
						{ data.title }
					</div>
					</Link>
					<div className="item-price">
						<span className="price">¥{ data.price }</span> { !!data.market_price && <del>¥{ data.market_price} </del> }
					</div>
				</div>
			<div className="item-ctrl c-pa"  onClick={ this.itemCtrl.bind( this, data.item_id, itemData ) }></div>
		</div>
    }
}

//回到顶部+跳到购物车
export class TotopAndCart extends Component {
	componentWillUnmount() {
		$(window).unbind('scroll.top');
	}

	componentDidMount() {
		let $window = $(window)
		let windowH = $window.height();
		let $toTop = $(".toTop");
		let time;
		$toTop.on("click",function(){
			clearInterval(time)
			let h = $window.scrollTop();
			time = setInterval(function () {
				h -= 10;
				$window.scrollTop(h);
				if (h <= 0) {
					clearInterval(time)
				}
			}, 1)

		});
		$(window).bind('scroll.top',function(){
			let $this = $(this);
			let scrollH = $this.scrollTop();
			let navTop = $(window).scrollTop() - $('.banner').height();
			if (scrollH > 35) {
				$toTop.show()
			} else {
				$toTop.hide()
			}
			if(navTop >= 0){
				$('.nav1').css({top: 0});
			}else {
				$('.nav1').css({top: -navTop});
			}
		})
	}
	render() {
		let {data} = this.props;
		return (
			<div className="cart-toTop">
				<ul>
					<Link to='/shopCart'><li className="cart">{data?<span className="cart-count">{data}</span>:''}</li></Link>
					<li className="toTop"></li>
				</ul>
			</div>
		)
	}
}

function discountActivityState ( state ) {
    return {
        ...state.minusActivity,
        ...state.global
    }
}

function discountActivityDispatch ( dispatch, props ) {
    let { promotion_id: promotionId, shop_id: shopId } = props.location.query;
    let request = false;
    let getCart = ()=>{
      dispatch( axiosActions('getShop',{
            ...pageApi.shop,
            params:{
                promotion_id:promotionId,
                shop_id :shopId
            }
        }));
    };
    let getCount = () =>{
    	dispatch( axiosActions('getCartCount',{
            ...pageApi.getCartCount,
        }));
    }
    return {
        dispatch,
        resetData:()=>{
            dispatch( createActions( 'resetData',{
                query:{
                    promotionId,
                    shopId
                }
            } ) );
        },
        getData:()=>{
            dispatch( axiosAllActions('getData',[
                {
                    ...pageApi.discountActivity,
                    params:{
                        promotion_id: promotionId,
                        page:1
                    }
                },
                {
                    ...pageApi.rule,
                    params:{
                        promotion_id:promotionId,
                        promotion_type:"fulldiscount"
                    }
                }
            ]));
            getCount();
        },
        getCartInfo: getCart ,
        promptClose:()=>{
            dispatch( createActions('promptCtrl', {  prompt:{ show:false, msg:"" } }) );
        },
        promptBigClose:()=>{
            dispatch( createActions('promptBigCtrl', {  prompt:{ show:false, msg:"" } }) );
        },
        closeModal() {
            dispatch(createActions('modalCtrl', {show:false}));
        },
        getChannelItem(){
            let  {id, itemData} = this;
			let oldId = itemData.data?itemData.data.store.item_id:0;
            if (id === oldId) {
                dispatch(createActions('modalCtrl', {show: true, activeItemData: itemData[id]}))
            } else {
                dispatch( axiosAllActions('getChannelItem',[
	                {
	                    ...pageApi.channelItem,
	                    params: {item_id: id}
	                },
	                {
	                    ...pageApi.itemData,
	                    params: {item_id: id}
	                }
	            ]));
            }
        },
        /*addCart:( data )=>{  //商品详情页有方法，该方法用不到
          if( request ){
                return;
            }
            request = true;
            axios.request({ ...pageApi.addCart, data:{
                mode:"cart_buy",
                item:{
                    item_id:data.item_id,
                    quantity:1,
                    sku_id:data.sku_id[0]
                }
            } }).then( result =>{
                if( !result.data.status ){
                    dispatch( createActions('promptCtrl', {  prompt:{ show:true, msg: result.data.msg  } }) );
                    setTimeout( ()=>{ request = false },1000 );
                    return;
                }
                dispatch( createActions('promptBigCtrl', {  prompt:{ show:true, msg: "已加入购物车" } }) );
                setTimeout( ()=>{ request = false },1000 );
                // getCart();
            })
        },*/
        InitState: (ret) => { //初始化弹框规格数据
					dispatch(createActions('initState', {ret: ret}));
			},
				UpdateCartInfo: (data) => { //更新购物车数据
					dispatch(createActions('updateCartInfo', data));
          getCart();
			}
    }
}

export default connect( discountActivityState, discountActivityDispatch )( DiscountActivity );