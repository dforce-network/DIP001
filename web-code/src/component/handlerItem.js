import React from 'react';
import {
    format_persentage,
    format_balance,
    format_str_to_K
} from '../utils';
import platform_map from '../abi/platform_map';

export default class HandlerItem extends React.Component {
    constructor(props) {
        super(props);

    }


    render() {
        return (
            <div className='handler-item'>
                <div className='handler-title'>
                    {
                        this.props.TargetHandlerAddress
                        &&
                        platform_map[(this.props.TargetHandlerAddress).toLocaleLowerCase()]
                    }
                    {/* {this.props.TargetHandlerAddress} */}
                    <span className='btn-clear'>
                        {
                            Number(this.props.data[0]) === 0 ?
                                Number(this.props.length) > 1 ?
                                    <span onClick={() => { this.props.del_item(this.props.index) }}>Remove</span> : null
                                :
                                <span onClick={() => { this.props.clear_item(this.props.index) }}>Clear</span>
                        }
                    </span>
                </div>
                <div className='item-wrap'>
                    <div className='handler-item-left'>
                        <div className='item'>
                            <span className='item-title'>Supply</span>
                            <span className='item-num'>{format_str_to_K(format_balance(this.props.data[1], this.props.decimals, 2))}</span>
                        </div>
                        <div className='item'>
                            <span className='item-title'>Profit</span>
                            <span className='item-num'>{format_str_to_K(format_balance(this.props.data[2], this.props.decimals, 2))}</span>
                        </div>
                        <div className='item'>
                            <span className='item-title'>Cash</span>
                            <span className='item-num'>{format_str_to_K(format_balance(this.props.data[3], this.props.decimals, 2))}</span>
                        </div>
                    </div>

                    <div className='handler-item-right'>
                        <div className='item'>
                            <span className='item-title'>Principle</span>
                            <span className='item-num'>{format_str_to_K(format_balance(this.props.data[0], this.props.decimals, 2))}</span>
                        </div>
                        <div className='item'>
                            <span className='item-title'>Ratio</span>
                            <span className='item-num'>{format_persentage(this.props.ratio)}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}