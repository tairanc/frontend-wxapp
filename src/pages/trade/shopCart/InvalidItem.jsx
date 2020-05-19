import React, {Component} from 'react';
import CSSModules from 'react-css-modules'
import styles from './InvalidItem.scss';
import {PureComponent} from 'component/modules/HOC';
import CheckIcon from './CheckIcon';
import {Link} from 'react-router';
import {DIR} from 'config/index'
import {timeUtils} from 'js/common/utils';

@CSSModules(styles, {allowMultiple: true})
export default class InvalidItem extends PureComponent {
    activityTime(){
        let { promotion_single } = this.props.data;
        if( !promotion_single ){
            return "";
        }
        let isStart =  new Date().getTime() > new Date(promotion_single.start_time).getTime();
        return timeUtils.cnFormat( isStart ? new Date(promotion_single.end_time).getTime(): new Date(promotion_single.start_time).getTime()) + promotion_single.name + (isStart?"结束":"开始");
    }
    render() {
        const {edit, data, invalid,hiddenDelete } = this.props;
        const {promotion_single, item_id} = data;

        return <div styleName="invalidItem">
            <div styleName="checkbox">
                <CheckIcon handleCheck={ this.props.handleCheck }
                           invalid={invalid}
                           isCheck={data.is_checked }
                           disable={ data.obj_type === "exchange" }/>
            </div>
            {/*商品信息*/}
            <div styleName="itemInfo" data-item-info>
                {/*商品图片*/}
                <Link styleName="itemImg"
                      to={`${DIR}/item?item_id=${item_id}`}
                      onClick={(e) => edit && e.preventDefault()}>
                    <img src={data.image ? data.image : require('../../../img/icon/loading/default-no-item.png')}
                         width="70" height="70"/>
                </Link>
                {/*商品详细信息*/}
                <div styleName="itemDetail">
                    <div styleName="title" >
						<span style={{verticalAlign: "top"}}>
							{data.title}
						</span>
                    </div>
                    <div styleName="itemCtrl">
                        <div styleName="text">
                            <div styleName="textDetail">
                                {data.unable_text}
                            </div>
                        </div>
                        <div>
                            {edit ?
                                hiddenDelete ? "":
                                    <div styleName="delete" onClick={this.props.handleDelete}>
                                        <img src={require('../../../img/icon/delete-box-icon.png')}/>
                                    </div>:
                                <div styleName="collect" onClick={this.props.handleCollect}>移入收藏</div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}