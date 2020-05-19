import React, {Component} from 'react';
import {browserHistory, Link} from 'react-router';
import {render} from 'react-dom';
import {LoadingRound} from 'component/common';
import {compress} from 'js/common/compressImage';
import Popup from 'component/modal2';
import {WXAPI} from 'config/index';
import {addImageSuffix} from "js/util/index";
import {miniProgramLogin} from 'js/util/miniProgramLogin';
import axios from 'js/util/axios';
import '../../item/evaluate.scss';


const pageApi = {
    init: {url: `${WXAPI}/rate/order`, method: "get"},   //订单评价信息
    createRate: {url: `${WXAPI}/rate/createRate`, method: "post"},//创建评价接口
    recommendItem: {url: `${WXAPI}/rate/recommendItem`, method: "get"}, //推荐接口
    compressPhoto: {url: `${WXAPI}/uploadImage`, method: "post"}
};
//监听返回
let flag;
let handler = function (e) {
    if (!flag) {
        window.history.pushState(null, null, document.URL);
        Popup.Modal({
            isOpen: true,
            msg: "确认取消发布吗？"
        }, () => {
            history.go(--flag);
        });
    }
    else {
        history.go(-1)
    }
};

//评价控制
export default class EvaluateControl extends Component {
    constructor(props, context) {
        super(props);
        let {tid} = props.location.query;
        this.state = {
            tid: tid,
            dataList: [],
            evaluateAlready: 'evaluate',
            update: false
        }
    };

    submiteEva = () => {
        this.setState({
            evaluateAlready: 'success'
        })
    };
    static contextTypes = {
        store: React.PropTypes.object,
        router: React.PropTypes.object
    };

    componentWillUnmount() {
        $('.reloads').remove();
    }

    componentDidMount() {
        $('<meta class="reloads" name="reload-enbaled" content="false">').appendTo('head');
        let self = this;
        if (!this.state.tid) {
            browserHistory.push("/");
        }
        axios.request({...pageApi.init, params: {no: self.state.tid}}).then(({data}) => {
            flag = 0;
            window.history.pushState(null, null, document.URL);
            window.addEventListener("popstate", handler, false);
            if (data.code === 0) {
                self.setState({
                    dataList: data.data,
                    update: true
                });
            } else {
                flag = -1;
                $('.more-click').css({display: 'none'});
                history.go(-1);
            }
        }).catch((err) => {
            console.log(err);
            flag = -1;
            Popup.MsgTip({msg: err.response.data.message || "服务器繁忙"});
            history.go(-1);
        })
    };

    componentWillMount() {
        document.title = '发表评论';
    };

    componentWillUnmount() {
        window.removeEventListener("popstate", handler, false);
    }

    render() {
        let {dataList} = this.state;
        return (
            this.state.update ?
                <div data-page="evaluate-list">
                    <section ref="evaluate-suc">
                        {this.state.evaluateAlready === 'success' ? <EvaluateSuccess/> :
                            <EvaluateIput dataList={dataList} fn={this.submiteEva}/>}
                        <div id="tips" className="c-fs14 c-lh30 c-tc c-bg000 c-cfff c-pf" style={{
                            top: '150px',
                            left: '50%',
                            marginLeft: '-80px',
                            width: '160px',
                            height: '30px',
                            opacity: '0.8',
                            borderRadius: '15px',
                            zIndex: '200',
                            display: 'none'
                        }}>最多只能输入100字
                        </div>
                    </section>
                </div>
                : <LoadingRound/>
        )
    }
}


//success-评价成功页
class EvaluateSuccess extends Component {
    componentWillMount() {
        document.title = '感谢评价';
        this.setState({
            goodsData: [],
            update: false
        })
    }

    componentDidMount() {
        let self = this;
        axios.request({...pageApi.recommendItem}).then(({data}) => {
            if (data.code === 0) {
                self.setState({
                    goodsData: data.data,
                    update: true
                });
            } else {
                $('.more-click').css({display: 'none'});
                Popup.MsgTip({msg: "服务器繁忙"});
            }
        }).catch((err) => {
            console.log(err);
            Popup.MsgTip({msg: err.response.data.message || "服务器繁忙"});
        })
    };

    render() {
        let {goodsData} = this.state;
        return (
            this.state.update ?
                <div id="evaluate-success">
                    <SuccessInform/>
                    <MoreRecommend/>
                    <MoreGoods goodsData={goodsData}/>
                    <FindMore/>
                </div>
                : <LoadingRound/>
        )
    }
}

//success-成功提示
class SuccessInform extends Component {
    componentDidMount() {
        $('.suc-inform button').click(function (e) {
            history.go(--flag);
        })
    }

    render() {
        return (
            <div className="suc-inform">
                <img src="/src/img/evaluate/success.png"/>
                <h2 className="c-fs18 c-lh18 c-c35 c-tc c-mb14">评价成功哦，感谢您的评价!</h2>
                <p className="c-fs12 c-lh12 c-c666 c-tc c-mb25">您的评价将是其他用户选购的重要参考!</p>
                <button className="c-fs18 c-bgdred c-br4 c-mb14 c-cfff">继续评价</button>
            </div>
        )
    }
}

//success-更多推荐
class MoreRecommend extends Component {
    render() {
        return (
            <div className="more-recommend">
                <div className="line"></div>
                <div className="line-txt c-bgfff c-tc c-fs12 c-c666">更多商品推荐</div>
            </div>
        )
    }
}

//success-推荐的商品
class MoreGoods extends Component {
    render() {
        let {goodsData} = this.props;
        let allGoods = goodsData.map(function (item, i) {
            return <EachGoods data={item} key={i}/>
        })
        return (
            <div className="more-goods c-clrfix">
                {allGoods}
            </div>
        )
    }
}

//success-单个推荐商品
class EachGoods extends Component {
    render() {
        let {data} = this.props;
        return (
            <div className="each-goods">
                <div className="goods-position">
                    <Link to={'/item?item_id=' + data.item_id} className="goods-img"><img
                        src={data.image ? data.image + '_s.jpg' : '/src/img/evaluate/goodsbg.png'}/></Link>
                    <div className="goods-title c-fs12 c-c35 c-mb10">{data.title}</div>
                    <p className="c-fs12 c-fb c-cdred c-tl">￥{data.sell_price}</p>
                </div>
            </div>
        )
    }
}

//success-查看更多
class FindMore extends Component {
    render() {
        return (
            <div className="find-more">
                <a onClick={(e)=>{
					e.preventDefault();
					miniProgramLogin();
				}}className="c-c35 to-more">查看更多></a>
            </div>
        )
    }
}


//input-发表评论
class EvaluateIput extends Component {
    render() {
        let {dataList} = this.props;
        /* let shops = dataList.shop_orders.map(function (item, i) {
           return <ShopsEva dataList={item} key={i}/>
         });*/
        let shops = '';
        shops = <ShopsEva dataList={dataList}/>
        return (
            <div id="evaluate-input">
                {shops}
                <SubmitEvaluation dataList={dataList} fn={this.props.fn}/>
            </div>
        )
    }
}

//input-单个店铺的评价
class ShopsEva extends Component {
    render() {
        let {dataList} = this.props;
        let goods = "";
        if (dataList.order_goods) {
            goods = dataList.order_goods.map(function (item, i) {
                return <EachGoodsEva dataList={item} key={i}/>
            })
        }
        return (
            <div style={{width: '100%'}} className="shops-eva">
                {goods}
                {0 ? <ShopScore dataList={dataList}/> : ''}
            </div>
        )
    }
}

//input-单个商品的评价
class EachGoodsEva extends Component {
    render() {
        let {dataList} = this.props;
        return (
            <div style={{width: '100%'}} id={dataList.id} className="each-goods-eva">
                <input type="hidden" value={dataList.no}/>
                <Description imageUrl={dataList.primary_image} goodsID={dataList.item_id}/>
                <EvaluateTextarea/>
                <EvaluateImgs id={dataList.id}/>
            </div>
        )
    }
}

//input-描述相符+五星
class Description extends Component {
    render() {
        let starTxt = ['差评', '中评', '中评', '好评', '好评'],
            {imageUrl, goodsID} = this.props;
        return (
            <div className="description">
                <div className="goods-img c-fl"><Link to={'/item?item_id=' + goodsID}><img
                    src={imageUrl ? addImageSuffix(imageUrl, "_s") : require('../../../img/icon/loading/default-no-item.png')}/></Link>
                </div>
                <div className="c-fl" style={{width: '76%'}}><Stars data="描述相符" starTxt={starTxt} starClass="star-a"
                                                                    spanClass="description-txt"/></div>
            </div>
        )
    }
}

//五星
class Stars extends Component {
    componentDidMount() {
        let tar = "." + this.props.starClass + " li";
        let arr = this.props.starTxt;
        $(tar).click(function (e) {
            var cindex = $(this).index();
            $(this).parent().attr({'eva-number': cindex});
            //先恢复初始状态
            $(this).parent().find('li').css({'background-position': '12px -22px'});
            //使用循环,给当前索引及前面的星星换背景
            for (var i = 0; i <= cindex; i++) {
                $(this).parent().find('li').eq(i).css({'background-position': '12px 4px'});
            }
            //改变文字内容
            let msg = "";
            switch (cindex) {
                case 0:
                    msg = arr[0];
                    break;
                case 1:
                    msg = arr[1];
                    break;
                case 2:
                    msg = arr[2];
                    break;
                case 3:
                    msg = arr[3];
                    break;
                case 4:
                    msg = arr[4];
                    break;
                default:
                    break;
            }
            $(this).parent().find('span').html(msg).css({display: 'block'});
        });
    };

    render() {
        let classes = this.props.spanClass + " c-cdred c-fs14";
        let starClass = this.props.starClass + " c-fl stars";
        let arr = this.props.starTxt;
        return (
            <div className="c-mb5" style={{width: '100%'}}>
                <span className="c-c666 c-lh24 c-fl c-fs14" style={{marginRight: "12.5px"}}>{this.props.data}</span>
                <ul className={starClass}>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <span className={classes}>{arr[4]}</span>
                </ul>
            </div>
        )
    }
}

//input-输入框
class EvaluateTextarea extends Component {
    componentDidMount() {
        let timer = null;
        $("#evaluate-input .evaluate-textarea textarea").bind('input propertychange', function () {
            let txtLength = $(this).val().length;
            if (txtLength > 100) {
                clearTimeout(timer);
                $(this).val($(this).val().substring(0, 100));
                $('#tips').show();
                let self = $(this);
                timer = setTimeout(function (e) {
                    $('#tips').hide();
                }, 1000)
            }
        });
    };

    render() {
        return (
            <div className="evaluate-textarea">
                <textarea className="c-fs14 c-c35 c-lh25" placeholder="您的评价对其他买家很有帮助哦"></textarea>
            </div>
        )
    }
}

//input-上传图片
class EvaluateImgs extends Component {
    componentWillMount() {
        //subimgUrl为提交的url数组（服务端要求格式）;imgUrl为完整的展示url数组
        this.setState({
            imgUrl: [],
            subimgUrl: [],
            dataLength: 0
        })
    };

    addImg = (id, urls, suburls) => {
        let arr = this.state.imgUrl;
        let subarr = this.state.subimgUrl;
        let pid = this.props.id;
        if (id === pid) {
            arr.push(urls);
            subarr.push(suburls);
            this.setState({
                imgUrl: arr,
                dataLength: arr.length,
                subimgUrl: subarr
            })
        }
    };
    removeImg = (id, index) => {
        let arr = this.state.imgUrl;
        let subarr = this.state.subimgUrl;
        let pid = this.props.id;
        if (id === pid) {
            arr.splice(index, 1);
            subarr.splice(index, 1);
            this.setState({
                imgUrl: arr,
                dataLength: arr.length,
                subimgUrl: subarr
            })
        }
    };

    render() {
        let data1 = false,
            data2 = true,
            arr = this.state.imgUrl;
        let self = this;
        let imgs = arr.map(function (item, i) {
            return <EachImg data={data2} id={'img' + self.props.id + i} pid={self.props.id} urls={item}
                            suburls={self.state.subimgUrl[i]}
                            fn2={self.removeImg}
                            key={i}/>
        })
        return (
            <div className="evaluate-imgs c-clrfix c-mb10">
                {imgs}
                {this.state.dataLength > 4 ? '' :
                    <EachImg data={data1} pid={self.props.id} dataLength={this.state.dataLength} fn={this.addImg}/>}
            </div>
        )
    }
}

//input-单张图片
class EachImg extends Component {
    componentDidMount() {
        let {fn2, pid, id} = this.props;
        $('#img' + id + ' .del-img').click(function (e) {
            let index = $(this).parent().index();
            fn2(pid, index);
        })
    };

    render() {
        let {id, dataLength, pid, suburls} = this.props;
        return (
            <div id={id ? 'img' + id : ''} className="each-img c-fl c-mr10"
                 style={this.props.data ? {border: "none"} : {}}>
                {(this.props.data) ? <HasImg urls={this.props.urls} suburls={suburls}/> :
                    <HasNotImg dataLength={dataLength} fn={this.props.fn} pid={pid}/>}
                {this.props.data ? <div className="del-img">
                    <div className="del"></div>
                </div> : ""}
            </div>
        )
    }
}


//input-无图片
class HasNotImg extends Component {
    componentWillMount() {
        this.setState({
            upLoading: false
        });
    }

    getImg = async (e) => {
        let {pid} = this.props;
        let self = this, maxsize = 100 * 1024;
        // let formData = new FormData($(e.target).parent()[0]);
        let file = $(e.target).parent()[0].firstChild.files["0"];
        if (!/^image\/(jpg|png|jpeg|bmp)$/.test(file.type)) {
            Popup.MsgTip({msg: "亲，请上传jpg/png/jpeg/bmp格式的图片哦~"});
        } else {
            let photoData = await compress(file);
            this.setState({
                upLoading: true
            });
            axios.request({...pageApi.compressPhoto, data: {img: photoData}}).then(({data}) => {
                if (data.code === 0) {
                    let urls = data.data.file.complete_url;
                    let suburls = data.data.file.url;
                    self.props.fn(pid, urls, suburls);
                    $(".each-img input").val('');
                } else {
                    Popup.MsgTip({msg: "图片上传失败"});
                }
                self.setState({
                    upLoading: false
                });
            }).catch((err) => {
                console.log(err);
                Popup.MsgTip({msg: err.response.data.message || "服务器繁忙"});
            })
        }
    };

    render() {
        let dl = this.props.dataLength;
        return (
            <div className="no-img c-fs12 c-tc c-pr">
                {dl ? (dl + ' / 5') : '上传照片'}
                <form id="uploadForm" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
                    <input style={{width: '100%', height: '100%', opacity: 0}} onChange={this.getImg} type="file"
                           name="file"
                           accept="image/gif,image/jpeg,image/jpg,image/png" className="upLoadImg"/>
                </form>
                {this.state.upLoading ? <div className="cover">图片上传中</div> : ''}
            </div>
        )
    }
}

//input-有图片
class HasImg extends Component {
    render() {
        let {suburls} = this.props;
        return <div style={{width: '80px', height: '80px', overflow: 'hidden'}}><img style={{width: "80px"}}
                                                                                     src={this.props.urls}
                                                                                     data-subsrc={suburls}/></div>
    }
}

//input-店铺评分
class ShopScore extends Component {
    render() {
        let starTxt = ['差', '不推荐', '一般', '很好', '非常好'],
            {dataList} = this.props;
        return (
            <div className="shop-score" id={dataList.id}>
                <img className="shop-icon" src="/src/img/icon/store-icon.png"/>
                <div className="score c-fs14 c-c35 c-mb14">{dataList.shop_name}</div>
                <div className="c-clrfix" style={{width: '90%'}}><Stars className="c-mb14" data={"描述相符"}
                                                                        starTxt={starTxt}
                                                                        starClass="star-b" spanClass={"shop-stara"}/>
                </div>
                <div className="c-clrfix" style={{width: '90%'}}><Stars className="c-mb14" data={"服务态度"}
                                                                        starTxt={starTxt}
                                                                        starClass="star-c" spanClass={"shop-starb"}/>
                </div>
                <div className="c-clrfix" style={{width: '90%'}}><Stars className="c-mb14" data={"发货速度"}
                                                                        starTxt={starTxt}
                                                                        starClass="star-d" spanClass={"shop-starc"}/>
                </div>
                <div className="c-clrfix" style={{width: '90%'}}><Stars className="c-mb14" data={"物流速度"}
                                                                        starTxt={starTxt}
                                                                        starClass="star-e" spanClass={"shop-stard"}/>
                </div>
            </div>
        )
    }
}

//提交评价
class SubmitEvaluation extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isAnonymous: true,
            subClick: false
        }
    };

    static contextTypes = {
        store: React.PropTypes.object,
        router: React.PropTypes.object
    };
    changeAnonymous = () => {
        this.setState({
            isAnonymous: !this.state.isAnonymous
        })
    };

    componentDidMount() {
        let self = this;
        $('.submite-all').click(function (e) {
            if (!self.state.subClick) {
                self.setState({
                    subClick: true
                });
                let goods = $('.each-goods-eva'),
                    shop_no = self.props.dataList.no,
                    anonymous = self.state.isAnonymous ? 1 : 0,
                    rates = [];
                for (let i = 0, len = goods.length; i < len; i++) {
                    let rate = {},
                        item = $(goods[i]);
                    rate.order_good_no = item.children('input').val();
                    rate.content = item.find('textarea').val();
                    let imgs = item.find('.each-img img'), imgArr = [];
                    for (let i = 0, len = imgs.length; i < len; i++) {
                        //imgArr.push($(imgs[i]).attr('src'));
                        imgArr.push($(imgs[i]).attr('data-subsrc'));
                    }
                    ;
                    rate.images = imgArr;
                    rate.grade = item.find('.description-txt').html();
                    switch (rate.grade) {
                        case '好评':
                            rate.grade = 30;
                            break;
                        case '中评':
                            rate.grade = 20;
                            break;
                        case '差评':
                            rate.grade = 10;
                            break;
                        default:
                            rate.grade = 30;
                            break;
                    }
                    ;
                    rates.push(rate);
                }
                ;
                let msg = {
                    shop_no: shop_no,
                    anonymous: anonymous,
                    rates: rates
                };
                self.submitEach(msg);
            }
        });
    };

    submitEach = (msg) => {
        let {dataList} = this.props;
        let self = this;
        axios.request({...pageApi.createRate, data: msg}).then(({data}) => {
            self.props.fn();
        }).catch((err) => {
            console.log(err);
            flag = -1;
            self.setState({
                subClick: false
            });
            Popup.MsgTip({msg: err.response.data.message || "服务器繁忙"});
            history.go(-1);
        })
    };

    render() {
        let {isAnonymous} = this.state;
        return (
            <div className="submit-evaluation">
                <p className={isAnonymous ? "anonymous c-fl c-c35 c-fs12" : "anonymous c-fl c-c35 c-fs12 anonymous-cbg"}
                   onClick={this.changeAnonymous}>匿名</p>
                <p className="anonymous-txt c-fr c-cc9 c-fs12">{isAnonymous ? "您的评论会以匿名形式展现" : "您的评价能帮助其他小伙伴哟"}</p>
                <button className="c-fs14 c-bgdred c-br4 c-mb14 c-cfff submite-all">提交评价</button>
            </div>
        )
    };
}
