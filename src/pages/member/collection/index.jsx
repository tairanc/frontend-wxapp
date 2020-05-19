import React, { Component } from 'react';
import { Link,browserHistory } from 'react-router';
import { LoadingRound,EmptyPage } from 'component/common';
import Popup from 'component/modal2';
import axios from '../../../js/util/axios';
import {miniProgramLogin} from 'js/util/miniProgramLogin';
import {WXAPI} from 'config/index'
import './index.scss';
import { error } from 'util';
import {miniProgramShopCart} from 'js/util/miniProgramLogin';

const pageApi = {
	shopCollectionRemove:{url:`${WXAPI}/user/removeShopCollection`}
}

//我的收藏
export default class myCollection extends Component {
	componentWillMount(){
		this.setState({
			cover1: false,
			cover2: false,
			edit: false,
			dataList: [],
			update: false,
			page: 2,
			hasMore: true,
			sending: false,
			delCount: 1,
			isUsed: 'all',
			isChooseAll: false,
			selectGoods: true
		});
		document.title="我的收藏"
	};
	componentDidMount(){
		$(this.refs.collection).css({minHeight: $(window).height(), background: '#f4f4f4'});
		this.getData('all');
	};
	//首次请求
	getData=(type)=>{
		let self = this;
		this.setState({
	  		update: false,
	  		page: 2
	    });
		$.ajax({
			url: '/wxapi/collection.api',
			type: 'GET',
			data: {
				pages: 1,
				is_used: type
			},
			success: function(data){
				if( data.biz_code === 401 ){
					browserHistory.replace('/login?redirect_uri=%2FmyCollectlion');
					return;
				}
				if(data.code===200&&data.status===true){
					self.setState({
						dataList: data.data.item_list,
						update: true,
						hasMore: data.data.item_list.length>=18
					});
				} else {
					Popup.MsgTip({msg: data.msg});
				}
			},
			error: function(err){
				Popup.MsgTip({msg: '服务器繁忙'});
			}
		});
	};
	//分页请求
	addData=(type)=>{
		let self = this;
		this.setState({
	  		sending: true
	    });
		$.ajax({
			url: '/wxapi/collection.api',
			type: 'GET',
			data: {
				pages: this.state.page,
				is_used: type
			},
			success: function(data){
				if(data.code===200&&data.status===true){
					if(data.data){
						self.setState({
							dataList: self.state.dataList.concat(data.data.item_list),
							page: self.state.page+1,
							hasMore: data.data.item_list.length>=18,
							sending: false
						});
					} else {
						self.setState({
							hasMore: false,
							sending: false
						});
					}
					
				} else {
					Popup.MsgTip({msg: data.msg});
					self.setState({
				  		sending: false
				    });
				}
			},
			error: function(err){
				Popup.MsgTip({msg: '服务器繁忙'});
				self.setState({
			  		sending: false
			    });
			}
		})
	}
	changeCover1=()=>{
		this.setState({
			cover1: !this.state.cover1
		})
	};
	changeCover2=()=>{ 
		this.setState({
			cover2: false
		})
	};
	//切换分类
	changeType=(type)=>{
		this.setState({
			isUsed: type,
		});
		this.getData(type);
	};
	changeEdit=()=>{
		this.setState({
			edit: !this.state.edit,
			cover1: false,
			isChooseAll: false
		})
	};
	del=()=>{
		let dels = $('.del-choose');
		if(dels.length){
			this.setState({
				cover2: true,
				delCount: dels.length
			})
		} else {
			Popup.MsgTip({msg: '请选择要移除的商品'});
		}
	};
	changeChooseAll=()=>{
		this.setState({
			isChooseAll: !this.state.isChooseAll
		});
		if(this.state.isChooseAll){
			$('.del').removeClass('del-choose');
		} else {
			$('.del').addClass('del-choose');
		}
	};
	chooseAllFalse=()=>{
		this.setState({
			isChooseAll: false
		});
	}
	changeChooseAll2=(tof)=>{
		this.setState({
			isChooseAll: tof
		})
	}

    //选择商品收藏
    commodityHandle = ()=> {
        this.setState({ selectGoods: true });
    }

    //选择店铺关注
    shopHandle = ()=> {
        this.setState({ selectGoods: false });
    }

	render() {
		let {isUsed,edit,dataList,hasMore,sending,delCount,isChooseAll,cover1,cover2,update,selectGoods} = this.state;
		return ( 
			<div data-page="my-collection">
				<section id="my-collection" ref="collection">
			    	<div className="nav">
                        <div className="collect-type" onClick={this.commodityHandle}>
                            <span className={`${selectGoods?"selected":""}`}>商品收藏</span>
                        </div>
                        <div className="split-line"></div>
                        <div className="collect-type" onClick={this.shopHandle}>
                            <span className={`${selectGoods?"":"selected"}`}>店铺关注</span>
                        </div>
                    </div>
                    {selectGoods?
                    	update?
							<div>
								<div className="edit c-fs14">
									<div className="choose c-pr" onClick={edit?'':this.changeCover1}>
										{edit?
											<img onClick={this.changeChooseAll} className="chooseAll" 
												 src={'src/img/addressAndIdentityInfo/'+(isChooseAll?'trChoose':'trUnChoose')+'.png'} />
											:''
										}
										{edit?'批量删除宝贝':(isUsed==='all'?'全部宝贝':'失效宝贝')}
										{edit?'':<span className="open"></span>}
									</div>
									<div className={`edit-btn ${(edit||dataList.length)?"":"c-cc9"}`} onClick={(edit||dataList.length)?this.changeEdit:""}>
										{edit?'完成':'编辑'}
									</div>
								</div>
								{dataList.length?
									<List changeChooseAll2={this.changeChooseAll2} edit={edit} isUsed={isUsed} hasMore={hasMore} sending={sending} 
										  data={dataList} addData={this.addData} />
									:
									<Empty isUsed={isUsed} />
								}
								{edit&&dataList.length?<div onClick={this.del} className="del-btn c-fs16">移除收藏夹</div>:''}
								{cover1?<Cover1 isUsed={isUsed} fn1={this.changeCover1} fnT={this.changeType} />:''}
								{cover2?<Cover2 chooseAllFalse={this.chooseAllFalse} fn2={this.changeCover2} getData={this.getData} delCount={delCount} />:''}
								<TotopAndCart />
							</div>
							:
							<LoadingRound />
						:
						<ShopCollection />
                    }
				</section>
			</div>
		)
	}
}

class Empty extends Component{
	componentDidMount(){
		$(this.refs.empty).css({minHeight: $(window).height()});
	};
	render(){
		let {isUsed} = this.props;
		return(
			<div className="empty" ref="empty">
				<img src={isUsed==='all'?"src/img/logistics/empty.png":"src/img/logistics/empty2.png"} />
				<a onClick={(e)=>{
					e.preventDefault();
					miniProgramLogin()
				}}>去逛逛</a>
			</div>
		)
	}
}
//商品分类遮罩
class Cover1 extends Component {
	changeList=(e)=>{
		let {fn1,fnT} = this.props;
		let tar = e.target;
		if(!$(tar).children().length){
			let type = $(tar).attr('id');
			fnT(type);
		}
		fn1();
	};
	render(){
		let {isUsed} = this.props;
		return(
			<div className="cover1" onClick={this.changeList}>
				<ul className="choose-type c-fs14">
					<li id="all" className={isUsed==='all'?'chose':''}>全部宝贝</li>
					<li id="invalid" className={isUsed==='all'?'':'chose'}>失效宝贝</li>
				</ul>
			</div>
		)
	}
}
//移除商品收藏
class Cover2 extends Component {
	changeList=(e)=>{
		let {fn2,getData,chooseAllFalse} = this.props;
		let tar = e.target,
			len = $(tar).children().length;
		if(!len && ($(tar).attr('id')==='del')){
			let arr = [],goods = $('.del-choose'),gLen = goods.length;
			for(let i=0;i<gLen;i++){
				arr.push(goods.eq(i).attr('id'));
			}
			$.ajax({
				url: '/wxapi/collection-remove.api',
				data: {
					item_id: arr
				},
				type: 'GET',
				success: function(data){
					Popup.MsgTip({msg: data.msg});
					$(".del-choose").removeClass("del-choose");
					let type = $('.list').attr('id');
					chooseAllFalse();
					getData(type);
				},
				error: function(err){
					Popup.MsgTip({msg: '服务器繁忙'});
				}
			})
		}
		fn2();
	};
	render(){
		return(
			<div className="cover2" onClick={this.changeList}>
				<ul className="choose-todo c-fs16">
					<li id="del" className='chose'>确定移除{this.props.delCount}个宝贝</li>
					<li id="cancel">取消</li>
				</ul>
			</div>
		)
	}
}

class List extends Component {
	componentWillUnmount() {
		$(window).unbind('scroll.get');
	}
	componentDidMount(){
		let {addData} = this.props;
		let self = this;
		$(window).bind('scroll.get',function(){
			let $this = $(this);
			let scrollH = $this.scrollTop();
			let scrollHeight = $(".list").height()-$(window).height();
			if (scrollH >= scrollHeight) {
				if($('.more').html()==="下拉加载更多"){
					let type = $('.list').attr('id');
					addData(type);
				}
			}
		});
	}
	render(){
		let {edit,data,hasMore,sending,changeChooseAll2} = this.props;
		let goods = data.map(function (item,i) {
			return <Goods key={i} data={item} edit={edit} changeChooseAll2={changeChooseAll2} />
		});
		return(
			<div className="list" id={this.props.isUsed}>
				{goods}
				<div className="more">{hasMore?(sending?'加载中...':'下拉加载更多'):'别拉了，我是有底线的~'}</div>
			</div>
		)
	}
}

class Goods extends Component {
	changeChoose=(e)=>{
		let {changeChooseAll2} = this.props;
		let tar = $(e.target);
		if(tar.hasClass("del-choose")){
			tar.removeClass("del-choose");
		} else {
			tar.addClass("del-choose");
		}
		let len = $('.del').length;
		let chooseLen = $('.del-choose').length;
		if(len === chooseLen){
			changeChooseAll2(true);
		} else {
			changeChooseAll2(false);
		}
	}
	render(){
		let {edit,data} = this.props;
		let label = {
			'Bonded': '跨境保税',
			'Direct': '海外直邮'
		},labelBg = {
			'Bonded': '#27a1e5',
			'Direct': '#fbb80f'
		}
		return(
			<div className="goods">
				{edit?<div id={data.item_id} onClick={this.changeChoose} className="del c-fl" ></div>:''}
				<Link to={"/item?item_id="+data.item_id}><div className="goods-img c-pr">
					<img src={data.image_default_id?data.image_default_id:'src/img/evaluate/goodsbg.png'} />
					{data.is_used?'':<div className="Invalid c-fs12 c-lh20 c-cfff c-tc">失效</div>}
				</div></Link>
				<div className={"goods-msg c-fl "+(edit?'goods-msg2':'')}>
					<div className="title">
						<ul className="label c-clrfix">
							{data.is_company?<li>企业购</li>:''}
							{label[data.trade_type]?<li style={{background:labelBg[data.trade_type]}}>{label[data.trade_type]}</li>:''}
						</ul>
						<Link to={"/item?item_id="+data.item_id}><div className="goods-title c-fs14">{data.goods_name}</div></Link>
					</div>
					<p className="price c-cdred c-fs12">¥<span className="c-fs15 c-fb">{data.goods_price}</span></p>
				</div>
			</div>
		)
	}
}

//回到顶部+跳到购物车
export class TotopAndCart extends Component {
	componentWillUnmount() {
		$(window).unbind('scroll.top');
	}
	componentWillMount(){
		this.setState({
			count: 0
		})
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
				h -= 20;
				$window.scrollTop(h);
				if (h <= 0) {
					clearInterval(time)
				}
			}, 1)

		});
		$(window).bind('scroll.top',function(){
			let $this = $(this);
			let scrollH = $this.scrollTop();
			if (scrollH > 35) {
				$toTop.show()
			} else {
				$toTop.hide()
			}
		});
		let self = this;
		$.ajax({
			url: '/wxapi/getCartCount.api',
			type: 'GET',
			success: function(data){
				if(data.code===200&&data.status===true){
					self.setState({
						count: data.data.cart_num
					})
				} else {
					Popup.MsgTip({msg: data.msg});
				}
			}
		});
	}

	render() {
		let {count} = this.state;
		return (
			<div className="cart-toTop">
				<ul>
					<a onClick={(e)=>{
						e.preventDefault();
						miniProgramShopCart()
					}}><li className="cart">{count?<span className="cart-count">{count}</span>:''}</li></a>
					<li className="toTop"></li>
				</ul>
			</div>
		)
	}
}

//店铺关注
export class ShopCollection extends Component{
	constructor(props){
		super(props);
		this.state = {
			update: false,
			count: 0,
			shopEdit: false,
			isChooseAll: false,
			shopList: [],
			coverDel: false,
			page: 2,
			hasMore: true,
			sending: false
		}
	}

	componentWillMount(){
		this.getShopData();
	}

	componentWillUnmount(){
		$(window).unbind("scroll.get");
	}

	componentDidMount(){
		let self = this;
		$(window).bind('scroll.get',function(){
			let $this = $(this);
			let scrollH = $this.scrollTop();
			let scrollHeight = $(".list").height()-$(window).height();
			if (scrollH >= scrollHeight) {
				if($('.no-more-shop').html()==="下拉加载更多"){
					self.addShopData();
				}
			}
		});
	}

	getShopData = ()=> {
		let self = this;
		axios.request("/trxcx/user/getShopCollectionList?page=1").then(({data})=>{
			if(data.code===0){
				self.setState({
					update: true,
					count: data.data.count,
					shopList: data.data.data
				});
			}
		}).catch(error=>{
			console.log(error)
		})
		// $.ajax({
	    //     url: "/xcx/user/getShopCollectionList?page=1&limit=10",
	    //     type: "get",
	    //     success(data){
	    //     	if(data.code===0){
	    //     		self.setState({
	    //     			update: true,
		//         		count: data.data.count,
		//         		shopList: data.data.data
		//         	});
	    //     	}
	    //     },
	    //     error(err){
	    //     	console.log(err);
	    //     }
		// });		
	}

	//下拉加载数据
	addShopData = ()=>{
	    this.setState({
	  		sending: true
	    });
	    let {page,shopList} = this.state;
		let self = this;
		axios.request(`/trxcx/user/getShopCollectionList?page=${page++}`).then(({data})=>{
			if(data.code===0){
				if(data.data.data.length){
					self.setState({
						shopList: shopList.concat(data.data.data),
						page: page,
						hasMore: data.data.page.current_page<data.data.page.total_page,
						sending: false
					});
				} else {
					self.setState({
						hasMore: false,
						sending: false
					});
				}
			} else {
				Popup.MsgTip({msg: data.msg});
				self.setState({
					  sending: false
				});
			}
		}).catch(error=>{
			console.log(error);
			Popup.MsgTip({msg: '服务器繁忙'});
			self.setState({
				  sending: false
			});
		})
		// $.ajax({
		// 	url: `/xcx/getShopCollectionList?page=${page++}&limit=10`,
		// 	type: 'GET',
		// 	success: function(data){
		// 		if(data.code===0){
		// 			if(data.data.data.length){
		// 				self.setState({
		// 					shopList: shopList.concat(data.data.data),
		// 					page: page,
		// 					hasMore: data.data.data.length>=10,
		// 					sending: false
		// 				});
		// 			} else {
		// 				self.setState({
		// 					hasMore: false,
		// 					sending: false
		// 				});
		// 			}
		// 		} else {
		// 			Popup.MsgTip({msg: data.msg});
		// 			self.setState({
		// 		  		sending: false
		// 		    });
		// 		}
		// 	},
		// 	error: function(err){
		// 		Popup.MsgTip({msg: '服务器繁忙'});
		// 		self.setState({
		// 	  		sending: false
		// 	    });
		// 	}
		// })
	}

	changeChooseAll = ()=>{
		this.setState({
			isChooseAll: !this.state.isChooseAll
		});
		if(this.state.isChooseAll){
			$('.del').removeClass('del-choose');
		} else {
			$('.del').addClass('del-choose');
		}
	}

	chooseAllFalse = ()=>{
		this.setState({
			isChooseAll: false
		});
	}

	changeChooseAll2=(tof)=>{
		this.setState({
			isChooseAll: tof
		})
	}

	changeShopEdit = ()=>{
		this.setState({
			shopEdit: !this.state.shopEdit,
			isChooseAll: false
		});
	}
	
	changeCover2=()=>{
		this.setState({
			coverDel: false
		})
	}

	del=()=>{
		let dels = $('.del-choose');
		if(dels.length){
			this.setState({
				coverDel: true
			})
		} else {
			Popup.MsgTip({msg: '请选择要取消的店铺'});
		}
	}

	render(){
		let { update,count,shopList,shopEdit,coverDel,isChooseAll,hasMore,sending } = this.state;
		return(
			update?
				<div>
					<div className={`edit c-fs14 ${count?"":"c-dpno"}`}> 
						<div className="choose c-pr" onClick={shopEdit?'':this.changeCover1}>
							{shopEdit?
								<img onClick={this.changeChooseAll} className="chooseAll" 
									 src={'src/img/addressAndIdentityInfo/'+(isChooseAll?'trChoose':'trUnChoose')+'.png'} />
								:''
							}
							{shopEdit?'批量取消关注':`全部店铺(${count})`}
						</div>
						<div className="edit-btn" onClick={this.changeShopEdit}>
							{shopEdit?'完成':'编辑'}
						</div>
					</div>
					{shopList.length > 0?
						<ShopList shopList={shopList} shopEdit={shopEdit} changeChooseAll2={this.changeChooseAll2}/>
						:
						<EmptyPage config={{
							msg: "您还没有关注任何店铺~",
							btnText: "去商城逛逛",
							link: "",
							bgImgUrl: "/src/img/collect/no-shop.png"
						}} />
					}
					{shopList.length < 7? //不满一页（7条）的数据不显示
						""
						:
						<div className="no-more-shop">{hasMore?(sending?'加载中...':'下拉加载更多'):'别拉了，我是有底线的~'}</div>
					}
					{shopEdit&&count?<div className="del-btn c-fs16" onClick={this.del}>取消关注</div>:''}
					{coverDel?<CoverDel chooseAllFalse={this.chooseAllFalse} fn2={this.changeCover2} getShopData={this.getShopData}/>:''}			
				</div>
				:
				<LoadingRound />
		)
	}
}

//店铺列表
export class ShopList extends Component{
	render(){
		let {shopList,shopEdit,changeChooseAll2} = this.props;
		return(
			<div className="shop-list">
			{shopList.map((item,index)=>{
				return <EachShop key={index} item={item} shopEdit={shopEdit} changeChooseAll2={changeChooseAll2} />
			})}
			</div>
		);
	}
}

//单个店铺
export class EachShop extends Component{
	changeChoose=(e)=>{
		let {changeChooseAll2} = this.props;
		let tar = $(e.target);
		if(tar.hasClass("del-choose")){
			tar.removeClass("del-choose");
		} else {
			tar.addClass("del-choose");
		}
		let len = $('.del').length;
		let chooseLen = $('.del-choose').length;
		if(len === chooseLen){
			changeChooseAll2(true);
		} else {
			changeChooseAll2(false);
		}
	}

	//未开放店铺不跳转
	linkTo = ()=>{
		let { item } = this.props;
		if(item.open_state === 1){
			browserHistory.push(`/store/home?shop=${item.shop_id}`);
		}else {
			return false;
		}
	}

	render(){
		let { item,shopEdit } = this.props;
		return(
			<div className="shop-info">
				{shopEdit&&<div id={item.shop_id} onClick={this.changeChoose} className="del c-fl"></div>}
				<Link onClick={this.linkTo}>
	                <div className={`shop-detail ${shopEdit?"shop-detail2":""}`}>
	                	<div className="shop-logo">
	                    	<img src={item.shop_logo?item.shop_logo:"src/img/evaluate/goodsbg.png"}/>
	                	</div>
	                    <div className="text-wrap">
	                        <p className="title">{item.shop_alias?item.shop_alias:item.shop_name}</p>
	                        <p className="sub-title">泰然城精选商家 服务保障</p>
	                    </div>
	                </div>
	                <img className="arrow-right" src="src/img/collect/arrow-right.png"/>
                </Link>
            </div>
		)
	}
}

//确认取消关注店铺蒙层
export class CoverDel extends Component {
	changeList=(e)=>{
		let {fn2,getShopData,chooseAllFalse} = this.props;
		let tar = e.target,
			len = $(tar).children().length;
		if(!len && ($(tar).attr('id')==='del')){
			let arr = [],goods = $('.del-choose'),gLen = goods.length,params={};
			for(let i=0;i<gLen;i++){
				arr.push(goods.eq(i).attr('id'));
			}
			axios.request({...pageApi.shopCollectionRemove,params:{shop_id:JSON.stringify(arr)}}).then(({data})=>{
				Popup.MsgTip({msg: "取消成功"});
				$(".del-choose").removeClass("del-choose");
				let type = $('.list').attr('id');
				chooseAllFalse();
				getShopData();
			}).catch(error=>{
				Popup.MsgTip({msg: '服务器繁忙'});
			})
			// $.ajax({
			// 	url: '/wxapi/user/removeShopCollection',
			// 	data: {
			// 		shop_id:JSON.stringify(arr)
			// 	},
			// 	type: 'get',
			// 	success(data){
			// 		Popup.MsgTip({msg: "取消成功"});
			// 		$(".del-choose").removeClass("del-choose");
			// 		let type = $('.list').attr('id');
			// 		chooseAllFalse();
			// 		getShopData();
			// 	},
			// 	error(err){
			// 		Popup.MsgTip({msg: '服务器繁忙'});
			// 	}
			// })
		}
		fn2();
	}

	render(){
		return(
			<div className="cover2" onClick={this.changeList}>
				<ul className="choose-todo c-fs16">
					<li id="del" className='chose'>取消关注</li>
					<li id="cancel">取消</li>
				</ul>
			</div>
		)
	}
}

