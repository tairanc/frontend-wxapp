import React, {Component} from 'react';
import CSSModules from 'react-css-modules'
import styles from './SaleAttr.scss';
import {Shady} from 'component/common';
import {PureComponent} from 'component/modules/HOC';
import {tip} from 'component/modules/popup/tip/tip';

//更改销售属性
@CSSModules(styles, {allowMultiple: true})
export default class SaleAttr extends Component {
    constructor(props) {
        super(props);
        this.state = {
            show: false,
            selectedSpecs: {}
        }
    }

    componentDidMount() {
        const specs = this.props.data && this.props.data.specs ? this.props.data.specs : null
        const { select } = this.props
        let selectedSpecs = {}
        specs.map((sp) => {
            let {spec_id} = sp
            selectedSpecs[spec_id] = select[spec_id] !== undefined ? select[spec_id]:""
        })
        this.setState({
            selectedSpecs
        })
        setTimeout(() => {
            this.setState({show: true});
        });
    }

    selectSingleAttr = (spec_id, spec_value_id, is_selected, cb) => {
        const { selectedSpecs } = this.state
        selectedSpecs[spec_id] = is_selected ? "" : spec_value_id
        this.setState({
            selectedSpecs
        }, () => {
            cb && cb(selectedSpecs)
        })
    }
    onSure = () => {
        this.setState({
            show: false
        });
        setTimeout(() => {
            this.props.close();
        }, 200)
    }
    submitSku = () => {
        let {data, cart_id, replaceSku} = this.props
        let {selectedSpecs} = this.state
        let _data = JSON.parse(JSON.stringify(data))
        let {skus} = _data
        let sku_id = ''
        let isempty = false
        skus.every((s) => {
            let isSku = true
            let originSkusArr = s['select_spec_id'].split("_")
            Object.values(selectedSpecs).every((v) => {
                if(!v && v !== 0 && v !== '0'){
                    isempty = true
                    return false
                } else {
                    if(originSkusArr.indexOf((""+v)) == -1){
                        isSku = false
                    }
                    return true
                }
            })
            if(isempty) {
                return false
            }
            if(isSku){
                sku_id = s.sku_id
            }
            return true
        })
        if(isempty){
            tip.show({msg: "请选择完整"});
        } else {
           replaceSku(cart_id,sku_id)
        }
    }
    render () {
        let {selectSingleAttr} = this
        let {selectedSpecs} = this.state
        let {data,img} = this.props
        let allAttr = []
        let _data = JSON.parse(JSON.stringify(data))
        let {skus, specs} = _data
        let selectSaleAttr = []
        let price = ""
        if(skus) {
            skus.map((s) => {
                const {select_spec_id, store} = s
                if(select_spec_id && store > 0){
                    allAttr.push(select_spec_id.split('_'))
                }
                let _select_spec_id = s['select_spec_id'].split("_")
                let getPrice = true
                Object.values(selectedSpecs).map((v) => {
                    if(_select_spec_id.indexOf((""+v)) <= -1){
                        getPrice = false
                    }
                })
                if(getPrice) {
                    price = s['price']
                }
            })
        }
        specs.map((sp) => {
            let {values,spec_id} = sp
            values.map((v) => {
                if(v.spec_value_id  == selectedSpecs[spec_id]){
                    selectSaleAttr.push(v.text)
                    if(v.image){
                        img = v.image
                    }
                }
            })
        })
        let attrItemList = specs.map((_specs, i) => {
            return <AttrItem {..._specs}
                             key={i}
                             saleAttrSelect={this.props.saleAttrSelect}
                             skus={skus}
                             specs={specs}
                             allAttr={allAttr}
                             selectedSpecs={selectedSpecs}
                             selectSingleAttr={selectSingleAttr}
            />
        })

        return (
            <div>
                <Shady/>
                <div className={`popupSaleAttr ${this.state.show ? "active" : ""}`}>
                    <div className="sale-modal-content">
                        <div className="sale-table-view">
                            <div className="sale-table-view-cell">
                                <span className="sale-close-btn" onClick={ this.onSure }></span>
                                <span className="sale-posit-img">
                                    <img className="sale-media-object sale-pull-left" src={img}/>
                                </span>
                                <div className="sale-media-body sale-window-head">
                                    <div className="sale-price-tag">
                                        <p className="sale-ellipsis sale-text-price sale-action-update-price">
                                            {price}</p>
                                        <p className="sale-text-price-sel" style={{display: "block"}}>已选
                                            {
                                                selectSaleAttr.map((s, i) => {
                                                    return <span key={i}> {s}</span>
                                                })
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sale-list-view">
                            {
                                attrItemList
                            }
                        </div>
                        <div className='sale-modal-bottom' onClick={() => {
                            this.submitSku()
                        }}>
                            <div>确定</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class AttrItem extends Component {
    //判断是否是单规格(无规格)
    judgeSingleSku = () => {
        let specs = this.props.specs;
        if(specs){
            if (specs.length === 1 && specs[0].values.length === 1) {
                return true;
            } else {
                return false
            }
        } else {
            return true
        }
    }
    judgeNoSku = (spec_value_id) => {
        const {allAttr, spec_id, selectedSpecs} = this.props
        let isNo = true
        let selectedSpecsKeys = Object.keys(selectedSpecs)
        let other_spec_value_id = []
        selectedSpecsKeys.map((s) => {
            if(s !== spec_id.toString()) {
                other_spec_value_id.push(selectedSpecs[s])
            }
        })
        allAttr.some((ar) => {
            let hasOther = true
            other_spec_value_id.some((other) => {
                if((other || other === 0 || other === '0') && ar.indexOf(other.toString()) < 0) {
                    hasOther = false
                    return true
                } else {
                    return false
                }
            })
            if(hasOther){
                if(ar.indexOf(spec_value_id.toString()) > -1){
                    isNo = false
                }
            }
            if(!isNo){
                return true
            } else {
                return false
            }
        })
        return isNo
    }
    judgeSelect = () => {
        let {spec_id, selectedSpecs} = this.props
        return selectedSpecs[spec_id]
    }
    AttrSelect = (spec_value_id, spec_id, className) => {
        const that = this;
        let isSelected  = className === 'on' ? true : false
        const {allAttr} = this.props
        this.setState({
            isSelected: isSelected
        }, () => {
            this.props.selectSingleAttr(spec_id, spec_value_id, isSelected)
        })
    }
    initList() {
        let ret = [];
        let {values, spec_id} = this.props
        let judgeSingleSku = this.judgeSingleSku()
        if(values && values.length > 0){
            values.map((value, i) => {
                let spec_value_id = value.spec_value_id
                let className = "off" //on no
                let judgeSelect = this.judgeSelect()
                let judgeNoSku = this.judgeNoSku(spec_value_id)
                if(judgeSingleSku){
                    className = "on"
                } else {
                    if(judgeSelect == spec_value_id){
                        className = "on"
                    }
                    if(judgeNoSku){
                        className = "no"
                    }
                }
                let hasStore = (className != "no") ? true : false
                ret.push(
                    <li key={i}
                        className={className}
                        onClick={(e) => {
                            !judgeSingleSku && hasStore && this.AttrSelect(spec_value_id, spec_id, className)
                        }}
                    >
                        {
                            value.image && <span>
                            <img src={value.image} width={25} height={25} style={ {'marginTop': '-3px', 'marginRight':'3px'}}/>
                        </span>
                        }
                        <span>{value.text}</span>
                    </li>
                )
            })
        }
        return ret
    }

    render (){
        let {name} = this.props
        return (
            <div className="sale-parameter">
                <span>{name}</span>
                <ul className="sale-size-ul">
                    {
                        this.initList()
                    }
                </ul>
            </div>
        )
    }
}