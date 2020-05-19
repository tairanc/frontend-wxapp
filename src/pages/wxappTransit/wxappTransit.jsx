import React, {Component} from "react";
import { LoadingRound } from 'component/common';
import { miniProgramVip, miniProgramMall } from 'js/util/miniProgramLogin'

// H5 到 泰然城小程序的中转页
class WxappTransit extends Component {
  componentWillMount() {
    switch (this.props.location.query.turn) {
      case 'backVip':   // 返回vip页面, 传递inviter
        miniProgramVip(this.props.location.query.inviter)
        break;
      default:
        miniProgramMall()
        return
    }
  }
  render () {
    return (
      <LoadingRound />
    )
  }
}

export default WxappTransit