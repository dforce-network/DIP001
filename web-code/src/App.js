import React from 'react';
import './App.scss';
import './popup.scss';
import { Route, Switch } from "react-router-dom";
import HandlerItem from "./component/handlerItem";

import { Tabs, Modal, Input, notification } from 'antd';
import 'antd/dist/antd.css';
import USDC from './images/USDC.svg';
import Edit from './images/bianji.svg';
import logo from './images/logo.png';
import wrong from './images/wrong.svg';
import telegram from './images/telegram.svg';
import twitter from './images/twitter.svg';
import medium from './images/medium.svg';
import up from './images/up.svg';
import PAX from './images/pax.png';
import TUSD from './images/tusd.png';

import Web3 from 'web3';
import DispatcherEntranceABI from './abi/dispatcherentrance';
import DispatcherABI from './abi/dispatcher';
import USDCABI from './abi/USDC';
import platform_map from './abi/platform_map';

import {
  format_persentage,
  format_balance,
  format_str_to_K,
  format_persentage_tofixed
} from './utils';





export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      decimals_num: 6,
      decimals: {
        USDC: 6,
        PAX: 18,
        TUSD: 18
      },
      visible_add_handler: false,
      handler_ratio_arr: [],
      Upper_Limit_enable: true,
      Lower_Limit_enable: true,
      handler_ratio_enable: true,
      add_handler_enable: false,
      update_Beneficiary_enable: false,

      add_handler_num: 0,
      cur_tab_num: 1
    }

    this.address_USDC = '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b';
    this.address_USDxPool = '0xccf31dc9dcb6cb788d3c6b64f73efedfb7e9f20b';
    this.address_DispatcherEntrance = '0xD673ec2f901ab2140E08F38ea5F428a3e482e672';
    this.address_Dispatcher = '';

    this.new_web3 = window.new_web3 = new Web3(Web3.givenProvider || null);
    this.bn = this.new_web3.utils.toBN;
    this.isAddress = this.new_web3.utils.isAddress;

    this.get_cur_net();

    this.new_web3.givenProvider.enable().then(res_accounts => {
      console.log(res_accounts);
      this.setState({
        my_account: res_accounts[0]
      })
    })


    let DispatcherEntrance = new this.new_web3.eth.Contract(DispatcherEntranceABI, this.address_DispatcherEntrance);
    DispatcherEntrance.methods.getDispatcher(this.address_USDxPool, this.address_USDC).call().then(res_address => {
      this.address_Dispatcher = res_address;
      // console.log(res_address);
      let Dispatcher = new this.new_web3.eth.Contract(DispatcherABI, this.address_Dispatcher);

      this.setState({
        address_Dispatcher: this.address_Dispatcher,
        Dispatcher: Dispatcher
      })

      // get data
      Dispatcher.methods.getReserveRatio().call().then(res_ReserveRatio => {
        this.setState({ Current_Dispatcher_Ratio: res_ReserveRatio })
      })

      Dispatcher.methods.getReserveUpperLimit().call().then(res_ReserveUpperLimit => {
        Dispatcher.methods.getReserveLowerLimit().call().then(res_ReserveLowerLimit => {
          this.setState({
            Reserve_Upper_Limit: res_ReserveUpperLimit,
            Reserve_Lower_Limit: res_ReserveLowerLimit
          })
        })
      })

      Dispatcher.methods.getPrinciple().call().then(res_Principle => {
        Dispatcher.methods.getReserve().call().then(res_Reserve => {
          this.setState({
            Total_Principle: res_Principle,
            Pool_Reserve: res_Reserve,
            Gross_Amount: this.bn(res_Principle).add(this.bn(res_Reserve)).toString()
          })
        })
      })

      Dispatcher.methods.getTHStructures().call().then((res_THStructures) => {
        this.setState({
          arr_Propotion: res_THStructures[0],
          arr_handler_address: res_THStructures[1],
          arr_TargetHandlerAddress: res_THStructures[2]
        }, () => {
          this.get_handler_arr();
          this.timerID = setInterval(() => {
            this.get_handler_arr();
          }, 1000 * 15);
        })
      })

      Dispatcher.methods.getProfitBeneficiary().call().then((res_address) => {
        let USDC = new this.new_web3.eth.Contract(USDCABI, this.address_USDC);
        this.setState({
          USDC: USDC,
          ProfitBeneficiary_address: res_address
        })
        USDC.methods.balanceOf(res_address).call().then((res_balance) => {
          if (res_balance) {
            this.setState({
              my_balance: res_balance
            }, () => {
              console.log(this.state.my_balance)
            })
          }
        });
      })
    })
  }

  callback = (key) => {
    console.log(key);
    this.setState({
      address_Dispatcher: '',
      ProfitBeneficiary_address: '',
      Gross_Amount: '',
      Reserve_Lower_Limit: '',
      Reserve_Upper_Limit: '',
      Current_Dispatcher_Ratio: '',
      Pool_Reserve: '',
      Total_Principle: '',
      arr_Propotion: '',
      arr_handler: '',
      my_balance: '',
      cur_tab_num: Number(key)
    });
    this.get_new_token_status(Number(key));
  }

  // get new token status
  get_new_token_status = (key) => {
    clearInterval(this.timerID);

    var token_address;
    var token_ABI = USDCABI;
    var address_Dispatcher;

    if (key === 1) {
      token_address = '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b'; // USDC
      this.setState({ decimals_num: 6 });
    } else if (key === 2) {
      token_address = '0x722E6238335d89393A42e2cA316A5fb1b8B2EB55'; // PAX
      this.setState({ decimals_num: 18 });
    } else if (key === 3) {
      token_address = '0xe72a3181f69Eb21A19bd4Ce19Eb68FDb333d74c6'; // TUSD
      this.setState({ decimals_num: 18 });
    }

    let DispatcherEntrance = new this.new_web3.eth.Contract(DispatcherEntranceABI, this.address_DispatcherEntrance);
    DispatcherEntrance.methods.getDispatcher(this.address_USDxPool, token_address).call().then(res_address => {
      console.log(res_address);
      // var address_Dispatcher = res_address;
      address_Dispatcher = res_address;

      let Dispatcher = new this.new_web3.eth.Contract(DispatcherABI, address_Dispatcher);
      console.log(Dispatcher)

      this.setState({
        address_Dispatcher: address_Dispatcher,
        Dispatcher: Dispatcher
      })

      // get data
      Dispatcher.methods.getReserveRatio().call().then(res_ReserveRatio => {
        this.setState({ Current_Dispatcher_Ratio: res_ReserveRatio })
      })

      Dispatcher.methods.getReserveUpperLimit().call().then(res_ReserveUpperLimit => {
        Dispatcher.methods.getReserveLowerLimit().call().then(res_ReserveLowerLimit => {
          this.setState({
            Reserve_Upper_Limit: res_ReserveUpperLimit,
            Reserve_Lower_Limit: res_ReserveLowerLimit
          })
        })
      })

      Dispatcher.methods.getPrinciple().call().then(res_Principle => {
        Dispatcher.methods.getReserve().call().then(res_Reserve => {
          this.setState({
            Total_Principle: res_Principle,
            Pool_Reserve: res_Reserve,
            Gross_Amount: this.bn(res_Principle).add(this.bn(res_Reserve)).toString()
          })
        })
      })

      Dispatcher.methods.getTHStructures().call().then((res_THStructures) => {
        this.setState({
          arr_Propotion: res_THStructures[0],
          arr_handler_address: res_THStructures[1],
          arr_TargetHandlerAddress: res_THStructures[2]
        }, () => {
          this.get_handler_arr();
          this.timerID = setInterval(() => {
            this.get_handler_arr();
          }, 1000 * 15);
        })
      })

      Dispatcher.methods.getProfitBeneficiary().call().then((res_address) => {
        let token_contract = new this.new_web3.eth.Contract(token_ABI, token_address);
        token_contract.methods.balanceOf(res_address).call().then((res_balance) => {
          if (res_balance) {
            this.setState({
              my_balance: res_balance
            }, () => {
              console.log(this.state.my_balance)
            })
          }
        });
        if (key === 1) {
          this.setState({
            USDC: token_contract,
            ProfitBeneficiary_address: res_address
          })
        } else if (key === 2) {
          this.setState({
            PAX: token_contract,
            ProfitBeneficiary_address: res_address
          })
        } else if (key === 3) {
          this.setState({
            TUSD: token_contract,
            ProfitBeneficiary_address: res_address
          })
        }
      })
    })
  }


  get_handler_arr = (num, t_arr) => {
    console.log('get-handler-arr --- data');
    var t_arr = t_arr || [];
    var j = num || 0;
    console.log(j);

    if (this.state.arr_handler_address.length > 0 && j < this.state.arr_handler_address.length) {
      this.state.Dispatcher.methods.getTHData(j).call().then(res_Propotion => {
        t_arr[j] = res_Propotion;
        var t_num = j + 1;
        this.get_handler_arr(t_num, t_arr);
      })
    } else {
      this.setState({ arr_handler: t_arr });
    }
  }
  // btn Add-Handler
  addTargetHandler = () => {
    console.log('add-Target-Handler');
    var t_arr = [];
    for (var i = 0; i < this.state.arr_Propotion.length; i++) {
      t_arr[i] = this.state.arr_Propotion[i] / 10
    }
    this.setState({
      visible_add_handler: true,
      add_handler_address: '',
      handler_ratio_arr_p: t_arr
    });
  }



  showModal = () => {
    this.setState({
      visible_add_handler: true,
    });
  }
  showModal_TR_ratio = () => {
    this.setState({
      visible_TR_ratio: true,
      Reserve_Upper_Limit_cp: this.state.Reserve_Upper_Limit / 10,
      Reserve_Lower_Limit_cp: this.state.Reserve_Lower_Limit / 10
    })
  }
  showModal_Handler_ratio = () => {
    var t_arr = [];
    for (var i = 0; i < this.state.arr_Propotion.length; i++) {
      t_arr[i] = this.state.arr_Propotion[i] / 10
    }
    this.setState({
      visible_Handler_ratio: true,
      handler_ratio_arr: t_arr
    })
  }
  showModal_Beneficiary = () => {
    this.setState({
      visible_Beneficiary: true,
    });
  }
  handleCancel_add_handler = e => {
    this.setState({ visible_add_handler: false });
  }
  handleCancel_TR_ratio = e => {
    this.setState({ visible_TR_ratio: false });
  }
  handleCancel_Handler_ratio = e => {
    this.setState({ visible_Handler_ratio: false });
  }
  handleCancel_Beneficiary = () => {
    this.setState({ visible_Beneficiary: false });
  }
  handleCancel_click_action = () => {
    this.setState({ visible_click_action: false });
  }



  add_handler_change = (val) => {
    console.log(this.isAddress(val));
    if (this.isAddress(val)) {
      this.setState({
        add_handler_address: val,
        add_handler_enable: true
      });
    } else {
      this.setState({
        add_handler_address: val,
        add_handler_enable: false
      });
    }
  }
  handler_ratio_change = (val, index) => {
    console.log(val, index);
    var t_arr = this.state.handler_ratio_arr;
    t_arr[index] = val;
    this.setState({
      handler_ratio_arr: t_arr
    }, () => {
      // console.log(this.state.handler_ratio_arr);
      var t_total = 0;
      for (var i = 0; i < this.state.handler_ratio_arr.length; i++) {
        t_total = Number(t_total) + Number(this.state.handler_ratio_arr[i]);
      }
      console.log(t_total);
      if (t_total === 100) {
        this.setState({ handler_ratio_enable: true })
      } else {
        this.setState({ handler_ratio_enable: false })
      }
    })
  }
  handler_ratio_change_p = (val, index) => {
    console.log(val, index);
    var t_arr = this.state.handler_ratio_arr_p;
    t_arr[index] = val;
    this.setState({
      handler_ratio_arr_p: t_arr
    })
  }
  handler_ratio_change_d = (val, index) => {
    console.log(val, index);
    var t_arr = this.state.handler_ratio_arr_d;
    t_arr[index] = val;
    this.setState({
      handler_ratio_arr_d: t_arr
    })
  }


  input_Upper_change = (val) => {
    // console.log(typeof(val)) // val string
    console.log(val, this.state.Reserve_Lower_Limit_cp);
    if (val < this.state.Reserve_Lower_Limit_cp || val > 100 || val < 0) {
      this.setState({
        Upper_Limit_enable: false,
        Reserve_Upper_Limit_cp: val
      });
      return false;
    }

    this.setState({
      Upper_Limit_enable: true,
      Reserve_Upper_Limit_cp: val
    })
  }
  input_Lower_change = (val) => {
    // console.log(typeof(val)) // val string
    console.log(val, this.state.Reserve_Upper_Limit_cp);
    if (val > this.state.Reserve_Upper_Limit_cp || val > 100 || val < 0) {
      this.setState({
        Lower_Limit_enable: false,
        Reserve_Lower_Limit_cp: val
      });
      return false;
    }

    this.setState({
      Lower_Limit_enable: true,
      Reserve_Lower_Limit_cp: val
    })
  }

  add_handler_num_change = (val) => {
    console.log(val);
    this.setState({ add_handler_num: val })
  }




  // Add Handler
  add_handler_click = () => {
    // console.log('addTargetHandler: ', this.state.Dispatcher);
    // console.log(this.state.add_handler_num, this.state.handler_ratio_arr_p);
    var t_arr = [];
    t_arr = this.state.handler_ratio_arr_p;
    t_arr.push(this.state.add_handler_num);

    for (var i = 0; i < t_arr.length; i++) {
      t_arr[i] = t_arr[i] * 10;
    }
    console.log(t_arr);
    // return;

    this.state.Dispatcher.methods.addTargetHandler(this.state.add_handler_address, t_arr).estimateGas(
      {
        from: this.state.my_account
      }, (err, gasLimit) => {
        this.new_web3.eth.getGasPrice((err, gasPrice) => {
          this.state.Dispatcher.methods.addTargetHandler(this.state.add_handler_address, t_arr).send(
            {
              from: this.state.my_account,
              gas: Math.ceil(gasLimit * 1.3),
              gasPrice: gasPrice
            }, (reject, res_hash) => {
              if (reject) {
                console.log(reject);
                this.setState({
                  visible_add_handler: false
                })
              }
              if (res_hash) {
                console.log(res_hash);
                this.setState({
                  visible_add_handler: false
                })

                var timerOBJ = {};
                var tempRnum = Math.random();
                timerOBJ[tempRnum] = setInterval(() => {
                  console.log('checking getTransactionReceipt... (Add Handler) ');
                  this.new_web3.eth.getTransactionReceipt(res_hash, (res_fail, res_success) => {
                    if (res_success) {
                      // console.log(JSON.stringify(res_success));
                      console.log(' *** i got getTransactionReceipt... *** ');
                      clearInterval(timerOBJ[tempRnum]);
                      this.get_handler_ratio_arr('from add handler.');
                      this.openNotification('Success', 'Add Handler Success.');
                    }
                    if (res_fail) {
                      console.log(res_fail);
                      clearInterval(timerOBJ[tempRnum]);
                      this.openNotification('Fail', 'Add Handler Fail.');
                    }
                  })
                }, 2000)
              }
            }
          )
        })
      })
  }
  // Withdraw-Profit
  withdrawProfit = () => {
    console.log('withdraw-Profit', this.state.Dispatcher);
    this.state.Dispatcher.methods.withdrawProfit().estimateGas(
      {
        from: this.state.my_account
      }, (err, gasLimit) => {
        this.new_web3.eth.getGasPrice((err, gasPrice) => {
          this.state.Dispatcher.methods.withdrawProfit().send(
            {
              from: this.state.my_account,
              gas: Math.ceil(gasLimit * 1.3),
              gasPrice: gasPrice
            }, (reject, res_hash) => {
              if (reject) {
                console.log(reject)
              }
              if (res_hash) {
                console.log(res_hash);

                var timerOBJ = {};
                var tempRnum = Math.random();
                timerOBJ[tempRnum] = setInterval(() => {
                  console.log('checking getTransactionReceipt...');
                  this.new_web3.eth.getTransactionReceipt(res_hash, (res_fail, res_success) => {
                    if (res_success) {
                      // console.log(JSON.stringify(res_success));
                      console.log(' *** i got getTransactionReceipt... *** ');
                      clearInterval(timerOBJ[tempRnum]);
                      this.update_all();
                      this.openNotification('Success', 'Withdraw Profit Success.');
                    }
                    if (res_fail) {
                      console.log(res_fail);
                      clearInterval(timerOBJ[tempRnum]);
                      this.openNotification('Fail', 'Withdraw Profit Fail.');
                    }
                  })
                }, 2000)
              }
            }
          )
        })
      })
  }

  trigger = () => {
    console.log('trigger', this.state.Dispatcher);
    this.state.Dispatcher.methods.trigger().estimateGas({ from: this.state.my_account }, (err, gasLimit) => {
      this.new_web3.eth.getGasPrice((err, gasPrice) => {
        this.state.Dispatcher.methods.trigger().send(
          {
            from: this.state.my_account,
            gas: Math.ceil(gasLimit * 1.3),
            gasPrice: gasPrice
          }, (reject, res_hash) => {
            if (reject) {
              console.log(reject)
            }
            if (res_hash) {
              console.log(res_hash);

              var timerOBJ = {};
              var tempRnum = Math.random();
              timerOBJ[tempRnum] = setInterval(() => {
                console.log('checking getTransactionReceipt...');
                this.new_web3.eth.getTransactionReceipt(res_hash, (res_fail, res_success) => {
                  if (res_success) {
                    // console.log(JSON.stringify(res_success));
                    console.log(' *** i got getTransactionReceipt... *** ');
                    clearInterval(timerOBJ[tempRnum]);
                    this.update_all();
                    this.openNotification('Success', 'Trigger Success.');
                  }
                  if (res_fail) {
                    console.log(res_fail);
                    clearInterval(timerOBJ[tempRnum]);
                    this.openNotification('Fail', 'Trigger Fail.');
                  }
                })
              }, 2000)
            }
          }
        )
      })
    })
  }


  update_Beneficiary_change = (val) => {
    console.log(val);
    if (this.isAddress(val)) {
      this.setState({
        update_Beneficiary: val,
        update_Beneficiary_enable: true
      });
    } else {
      this.setState({
        update_Beneficiary: val,
        update_Beneficiary_enable: false
      });
    }
  }
  Upper_Limit_click = () => {
    console.log('Upper_Limit_click')
    if (!this.state.Upper_Limit_enable) {
      console.log('i return u')
      return false;
    }
    this.state.Dispatcher.methods.setReserveUpperLimit(this.state.Reserve_Upper_Limit_cp * 10).estimateGas({ from: this.state.my_account }, (err, gasLimit) => {
      this.new_web3.eth.getGasPrice((err, gasPrice) => {
        this.state.Dispatcher.methods.setReserveUpperLimit(this.state.Reserve_Upper_Limit_cp * 10).send(
          {
            from: this.state.my_account,
            gas: Math.ceil(gasLimit * 1.3),
            gasPrice: gasPrice
          }, (reject, res_hash) => {
            if (reject) {
              console.log(reject);
              this.setState({
                visible_TR_ratio: false
              })
            }
            if (res_hash) {
              console.log(res_hash);
              this.setState({
                visible_TR_ratio: false
              })

              var timerOBJ = {};
              var tempRnum = Math.random();
              timerOBJ[tempRnum] = setInterval(() => {
                console.log('checking getTransactionReceipt...');
                this.new_web3.eth.getTransactionReceipt(res_hash, (res_fail, res_success) => {
                  if (res_success) {
                    // console.log(JSON.stringify(res_success));
                    console.log(' *** i got getTransactionReceipt... *** ');
                    clearInterval(timerOBJ[tempRnum]);
                    this.get_Upper_Lower();
                    this.openNotification('Success', 'Set Upper Limit Success.');
                  }
                  if (res_fail) {
                    console.log(res_fail);
                    clearInterval(timerOBJ[tempRnum]);
                    this.openNotification('Fail', 'Set Upper Limit Fail.');
                  }
                })
              }, 2000)
            }
          }
        )
      })
    })
  }
  Lower_Limit_click = () => {
    console.log('Lower_Limit_click')
    if (!this.state.Lower_Limit_enable) {
      console.log('i return u')
      return false;
    }
    this.state.Dispatcher.methods.setReserveLowerLimit(this.state.Reserve_Lower_Limit_cp * 10).estimateGas({ from: this.state.my_account }, (err, gasLimit) => {
      this.new_web3.eth.getGasPrice((err, gasPrice) => {
        this.state.Dispatcher.methods.setReserveLowerLimit(this.state.Reserve_Lower_Limit_cp * 10).send(
          {
            from: this.state.my_account,
            gas: Math.ceil(gasLimit * 1.3),
            gasPrice: gasPrice
          }, (reject, res_hash) => {
            if (reject) {
              console.log(reject);
              this.setState({
                visible_TR_ratio: false
              })
            }
            if (res_hash) {
              console.log(res_hash);
              this.setState({
                visible_TR_ratio: false
              })

              var timerOBJ = {};
              var tempRnum = Math.random();
              timerOBJ[tempRnum] = setInterval(() => {
                console.log('checking getTransactionReceipt...');
                this.new_web3.eth.getTransactionReceipt(res_hash, (res_fail, res_success) => {
                  if (res_success) {
                    // console.log(JSON.stringify(res_success));
                    console.log(' *** i got getTransactionReceipt... *** ');
                    clearInterval(timerOBJ[tempRnum]);
                    this.get_Upper_Lower();
                    this.openNotification('Success', 'Set Lower Limit Success.');
                  }
                  if (res_fail) {
                    console.log(res_fail);
                    clearInterval(timerOBJ[tempRnum]);
                    this.openNotification('Fail', 'Set Lower Limit Fail.');
                  }
                })
              }, 2000)
            }
          }
        )
      })
    })
  }
  handler_ratio_click = () => {
    var t_arr = [];
    for (var i = 0; i < this.state.handler_ratio_arr.length; i++) {
      t_arr[i] = this.state.handler_ratio_arr[i] * 10
    }
    this.state.Dispatcher.methods.setAimedPropotion(t_arr).estimateGas(
      {
        from: this.state.my_account
      }, (err, gasLimit) => {
        this.new_web3.eth.getGasPrice((err, gasPrice) => {
          this.state.Dispatcher.methods.setAimedPropotion(t_arr).send(
            {
              from: this.state.my_account,
              gas: Math.ceil(gasLimit * 1.3),
              gasPrice: gasPrice
            }, (reject, res_hash) => {
              if (reject) {
                console.log(reject);
                this.setState({
                  visible_Handler_ratio: false
                })
              }
              if (res_hash) {
                console.log(res_hash);
                this.setState({
                  visible_Handler_ratio: false
                })

                var timerOBJ = {};
                var tempRnum = Math.random();
                timerOBJ[tempRnum] = setInterval(() => {
                  console.log('checking getTransactionReceipt...');
                  this.new_web3.eth.getTransactionReceipt(res_hash, (res_fail, res_success) => {
                    if (res_success) {
                      // console.log(JSON.stringify(res_success));
                      console.log(' *** i got getTransactionReceipt... *** ');
                      clearInterval(timerOBJ[tempRnum]);
                      this.get_handler_ratio_arr();
                      this.openNotification('Success', 'Update Handler Ratio Success.');
                    }
                    if (res_fail) {
                      console.log(res_fail);
                      clearInterval(timerOBJ[tempRnum]);
                      this.openNotification('Fail', 'Update Handler Ratio Fail.');
                    }
                  })
                }, 2000)
              }
            }
          )
        })
      })
  }
  update_Beneficiary_click = () => {
    console.log(this.state.update_Beneficiary);
    if (!this.state.update_Beneficiary_enable) {
      console.log('i return u.');
      return false;
    }
    this.state.Dispatcher.methods.setProfitBeneficiary(this.state.update_Beneficiary).estimateGas({ from: this.state.my_account }, (err, gasLimit) => {
      this.new_web3.eth.getGasPrice((err, gasPrice) => {
        this.state.Dispatcher.methods.setProfitBeneficiary(this.state.update_Beneficiary).send(
          {
            from: this.state.my_account,
            gas: Math.ceil(gasLimit * 1.3),
            gasPrice: gasPrice
          }, (reject, res_hash) => {
            if (reject) {
              console.log(reject);
              this.setState({
                visible_Beneficiary: false
              });
            }
            if (res_hash) {
              console.log(res_hash);
              this.setState({
                visible_Beneficiary: false
              });

              var timerOBJ = {};
              var tempRnum = Math.random();
              timerOBJ[tempRnum] = setInterval(() => {
                console.log('checking getTransactionReceipt...');
                this.new_web3.eth.getTransactionReceipt(res_hash, (res_fail, res_success) => {
                  if (res_success) {
                    // console.log(JSON.stringify(res_success));
                    console.log(' *** i got getTransactionReceipt... *** ');
                    clearInterval(timerOBJ[tempRnum]);
                    this.update_ProfitBeneficiary();
                    this.openNotification('Success', 'Update ProfitBeneficiary Success.');
                  }
                  if (res_fail) {
                    console.log(res_fail);
                    clearInterval(timerOBJ[tempRnum]);
                    this.openNotification('Fail', 'Update ProfitBeneficiary Fail.');
                  }
                })
              }, 2000)
            }
          }
        )
      })
    })
  }

  // clear or remove
  update_click_action_click = () => {
    console.log('clear or del: ', this.state.click_action);
    if (this.state.click_action === 'clear') {
      this.state.Dispatcher.methods.drainFunds(this.state.clear_item_index).estimateGas({ from: this.state.my_account }, (err, gasLimit) => {
        this.new_web3.eth.getGasPrice((err, gasPrice) => {
          this.state.Dispatcher.methods.drainFunds(this.state.clear_item_index).send(
            {
              from: this.state.my_account,
              gas: Math.ceil(gasLimit * 1.3),
              gasPrice: gasPrice
            }, (reject, res_hash) => {
              if (reject) {
                console.log(reject);
                this.setState({
                  visible_click_action: false
                })
              }
              if (res_hash) {
                console.log(res_hash);
                this.setState({
                  visible_click_action: false
                })

                var timerOBJ = {};
                var tempRnum = Math.random();
                timerOBJ[tempRnum] = setInterval(() => {
                  console.log('checking getTransactionReceipt...');
                  this.new_web3.eth.getTransactionReceipt(res_hash, (res_fail, res_success) => {
                    if (res_success) {
                      // console.log(JSON.stringify(res_success));
                      console.log(' *** i got getTransactionReceipt... *** ');
                      clearInterval(timerOBJ[tempRnum]);
                      this.get_handler_ratio_arr();
                      this.openNotification('Success', 'Clear Handler Success.');
                    }
                    if (res_fail) {
                      console.log(res_fail);
                      clearInterval(timerOBJ[tempRnum]);
                      this.openNotification('Fail', 'Clear Handler Fail.');
                    }
                  })
                }, 2000)
              }
            }
          )
        })
      })
    } else if (this.state.click_action === 'remove') {
      // handler_ratio_arr_d
      // console.log(this.state.arr_handler_address[this.state.del_item_index], this.state.del_item_index);
      console.log(this.state.del_item_index, this.state.handler_ratio_arr_d);
      var t_arr = this.state.handler_ratio_arr_d;
      var t_arr2 = t_arr.splice(this.state.del_item_index, 1);
      // console.log(t_arr);
      // return;

      for (var i = 0; i < t_arr.length; i++) {
        t_arr[i] = t_arr[i] * 10;
      }
      console.log(t_arr);
      // return;

      this.state.Dispatcher.methods.removeTargetHandler(
        this.state.arr_handler_address[this.state.del_item_index],
        this.state.del_item_index,
        t_arr
      ).estimateGas(
        {
          from: this.state.my_account
        }, (err, gasLimit) => {
          this.new_web3.eth.getGasPrice((err, gasPrice) => {
            this.state.Dispatcher.methods.removeTargetHandler(
              this.state.arr_handler_address[this.state.del_item_index],
              this.state.del_item_index,
              t_arr
            ).send(
              {
                from: this.state.my_account,
                gas: Math.ceil(gasLimit * 1.3),
                gasPrice: gasPrice
              }, (reject, res_hash) => {
                if (reject) {
                  console.log(reject);
                  this.setState({
                    visible_click_action: false
                  })
                }
                if (res_hash) {
                  console.log(res_hash);
                  this.setState({
                    visible_click_action: false
                  })

                  var timerOBJ = {};
                  var tempRnum = Math.random();
                  timerOBJ[tempRnum] = setInterval(() => {
                    console.log('checking getTransactionReceipt...');
                    this.new_web3.eth.getTransactionReceipt(res_hash, (res_fail, res_success) => {
                      if (res_success) {
                        // console.log(JSON.stringify(res_success));
                        console.log(' *** i got getTransactionReceipt... *** ');
                        clearInterval(timerOBJ[tempRnum]);
                        this.get_handler_ratio_arr('from Remove Handler');
                        this.openNotification('Success', 'Remove Handler Success.');
                      }
                      if (res_fail) {
                        console.log(res_fail);
                        clearInterval(timerOBJ[tempRnum]);
                        this.openNotification('Fail', 'Remove Handler Fail.');
                      }
                    })
                  }, 2000)
                }
              }
            )
          })
        })
    }

  }



  update_ProfitBeneficiary = () => {
    this.state.Dispatcher.methods.getProfitBeneficiary().call().then((res_address) => {
      let USDC = new this.new_web3.eth.Contract(USDCABI, this.address_USDC);
      this.setState({
        USDC: USDC,
        ProfitBeneficiary_address: res_address
      })
      USDC.methods.balanceOf(res_address).call().then((res_balance) => {
        if (res_balance) {
          this.setState({
            my_balance: res_balance
          }, () => {
            console.log(this.state.my_balance)
          })
        }
      });
    })
  }
  get_Upper_Lower = () => {
    this.state.Dispatcher.methods.getReserveUpperLimit().call().then(res_ReserveUpperLimit => {
      this.state.Dispatcher.methods.getReserveLowerLimit().call().then(res_ReserveLowerLimit => {
        this.setState({
          Reserve_Upper_Limit: res_ReserveUpperLimit,
          Reserve_Lower_Limit: res_ReserveLowerLimit
        })
      })
    })
  }
  get_handler_ratio_arr = (str) => {
    if (str) {
      console.log(str);
      var t_num = this.state.arr_handler_address.length;
      var t_timer = setInterval(() => {
        this.state.Dispatcher.methods.getTHStructures().call().then((res_THStructures) => {
          if (t_num === res_THStructures[1].length) {
            console.log('handler num not changed');
            return;
          } else {
            clearInterval(t_timer);
            console.log('already changed');
            this.setState({
              arr_Propotion: res_THStructures[0],
              arr_handler_address: res_THStructures[1],
              arr_TargetHandlerAddress: res_THStructures[2]
            }, () => {
              this.get_handler_arr();
            })
          }
        })
      }, 5000)
    } else {
      this.state.Dispatcher.methods.getTHStructures().call().then((res_THStructures) => {
        this.setState({
          arr_Propotion: res_THStructures[0],
          arr_handler_address: res_THStructures[1],
          arr_TargetHandlerAddress: res_THStructures[2]
        }, () => {
          this.get_handler_arr();
        })
      })
    }
  }



  del_item = (index) => {
    console.log(index)
    //handler_ratio_arr_d
    var t_arr = [];
    for (var i = 0; i < this.state.arr_Propotion.length; i++) {
      t_arr[i] = this.state.arr_Propotion[i] / 10
    }
    this.setState({
      del_item_index: index,
      click_action: 'remove',
      visible_click_action: true,
      handler_ratio_arr_d: t_arr
    })
  }
  clear_item = (index) => {
    console.log(index)
    this.setState({
      clear_item_index: index,
      click_action: 'clear',
      visible_click_action: true
    })
  }


  update_all = () => {
    var token_address;
    if (this.state.cur_tab_num === 1) {
      token_address = '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b'; // USDC
    } else if (this.state.cur_tab_num === 2) {
      token_address = '0x722E6238335d89393A42e2cA316A5fb1b8B2EB55'; // PAX
    } else if (this.state.cur_tab_num === 3) {
      token_address = '0xe72a3181f69Eb21A19bd4Ce19Eb68FDb333d74c6'; // TUSD
    }

    let DispatcherEntrance = new this.new_web3.eth.Contract(DispatcherEntranceABI, this.address_DispatcherEntrance);
    DispatcherEntrance.methods.getDispatcher(this.address_USDxPool, token_address).call().then(res_address => {
      this.address_Dispatcher = res_address;
      let Dispatcher = new this.new_web3.eth.Contract(DispatcherABI, this.address_Dispatcher);

      this.setState({
        address_Dispatcher: this.address_Dispatcher,
        Dispatcher: Dispatcher
      })

      // get data
      Dispatcher.methods.getReserveRatio().call().then(res_ReserveRatio => {
        this.setState({ Current_Dispatcher_Ratio: res_ReserveRatio })
      })

      Dispatcher.methods.getReserveUpperLimit().call().then(res_ReserveUpperLimit => {
        Dispatcher.methods.getReserveLowerLimit().call().then(res_ReserveLowerLimit => {
          this.setState({
            Reserve_Upper_Limit: res_ReserveUpperLimit,
            Reserve_Lower_Limit: res_ReserveLowerLimit
          })
        })
      })

      Dispatcher.methods.getPrinciple().call().then(res_Principle => {
        Dispatcher.methods.getReserve().call().then(res_Reserve => {
          this.setState({
            Total_Principle: res_Principle,
            Pool_Reserve: res_Reserve,
            Gross_Amount: this.bn(res_Principle).add(this.bn(res_Reserve)).toString()
          })
        })
      })

      Dispatcher.methods.getTHStructures().call().then((res_THStructures) => {
        this.setState({
          arr_Propotion: res_THStructures[0],
          arr_handler_address: res_THStructures[1],
          arr_TargetHandlerAddress: res_THStructures[2]
        }, () => {
          this.get_handler_arr();
        })
      })

      Dispatcher.methods.getProfitBeneficiary().call().then((res_address) => {
        let USDC = new this.new_web3.eth.Contract(USDCABI, token_address);
        this.setState({
          USDC: USDC,
          ProfitBeneficiary_address: res_address
        })
        USDC.methods.balanceOf(res_address).call().then((res_balance) => {
          if (res_balance) {
            this.setState({
              my_balance: res_balance
            }, () => {
              console.log(this.state.my_balance)
            })
          }
        });
      })
    })
  }

  update_all_timer = () => {
    if (!this.state.Dispatcher) {
      return;
    }
    // get data
    this.state.Dispatcher.methods.getReserveRatio().call().then(res_ReserveRatio => {
      this.setState({ Current_Dispatcher_Ratio: res_ReserveRatio })
    })

    this.state.Dispatcher.methods.getReserveUpperLimit().call().then(res_ReserveUpperLimit => {
      this.state.Dispatcher.methods.getReserveLowerLimit().call().then(res_ReserveLowerLimit => {
        this.setState({
          Reserve_Upper_Limit: res_ReserveUpperLimit,
          Reserve_Lower_Limit: res_ReserveLowerLimit
        })
      })
    })

    this.state.Dispatcher.methods.getPrinciple().call().then(res_Principle => {
      this.state.Dispatcher.methods.getReserve().call().then(res_Reserve => {
        this.setState({
          Total_Principle: res_Principle,
          Pool_Reserve: res_Reserve,
          Gross_Amount: this.bn(res_Principle).add(this.bn(res_Reserve)).toString()
        })
      })
    })

    this.state.Dispatcher.methods.getTHStructures().call().then((res_THStructures) => {
      this.setState({
        arr_Propotion: res_THStructures[0],
        arr_handler_address: res_THStructures[1],
        arr_TargetHandlerAddress: res_THStructures[2]
      }, () => {
        this.get_handler_arr();
      })
    })

    // this.state.Dispatcher.methods.getProfitBeneficiary().call().then((res_address) => {
    //   let USDC = new this.new_web3.eth.Contract(USDCABI, token_address);
    //   this.setState({
    //     USDC: USDC,
    //     ProfitBeneficiary_address: res_address
    //   })
    //   USDC.methods.balanceOf(res_address).call().then((res_balance) => {
    //     if (res_balance) {
    //       this.setState({
    //         my_balance: res_balance
    //       }, () => {
    //         console.log(this.state.my_balance)
    //       })
    //     }
    //   });
    // })
  }


  openNotification = (arg_title, arg_description) => {
    notification.open({
      message: arg_title,
      description: arg_description,
      onClick: () => {
        console.log("Notification Clicked!");
      }
    });
  }
  openOnEtherscan = (addr) => {
    console.log(addr);
    if (!addr) {
      return false;
    }

    this.new_web3.eth.net.getNetworkType().then(nettype => {
      console.log(nettype)
      if (nettype === 'rinkeby') {
        window.open('https://rinkeby.etherscan.io/address/' + addr, "_blank");
      }
      if (nettype === 'main') {
        window.open('https://etherscan.io/address/' + addr, "_blank");
      }
    })
  }
  to_ethscan_with_account = (that, account) => {
    var url;

    if (that.state.net_type === 'main') {
      url = 'https://etherscan.io/address/' + account
    } else if (that.state.net_type === 'rinkeby') {
      url = 'https://rinkeby.etherscan.io/address/' + account
    }

    window.open(url, "_blank");
  }

  get_cur_net = () => {
    this.new_web3.eth.net.getNetworkType().then(nettype => {
      this.setState({
        net_type: nettype
      })
    })
  }

  clickFAQ = () => {
    window.open('https://docs.lendf.me/faq', '_blank');
    return false;
    // console.log('aaaaa');
    if (this.state.cur_language === '中文') {
      window.open('https://docs.lendf.me/faqcn', '_blank');
    } else {
      window.open('https://docs.lendf.me/faq', '_blank');
    }
  }

  componentDidMount = () => {
    setInterval(() => {
      this.update_all_timer();
    }, 1000 * 15)
  }

  render() {
    return (
      <>
        <div className='top'>
          <div className='top-left'>
            <a href='https://dforce.network/' target='_blank' rel="noopener noreferrer">
              <img src={logo} alt='' />
            </a>
          </div>
          <div className='top-right'>
            {
              !this.state.my_account &&
              <div className='top-right-btn'>
                {/* <FormattedMessage id='Connect' /> */}
                Connect
              </div>
            }
            {
              (this.state.net_type && this.state.net_type !== 'main') &&
              <div className='Wrong'>
                <span className={'wrong-wrap'}>
                  <img src={wrong} alt='' />
                </span>
                <span className='net-name net-name-wrong'>
                  {this.state.net_type.substring(0, 1).toUpperCase() + this.state.net_type.substring(1)}
                </span>
              </div>
            }
            {
              (this.state.my_account && this.state.net_type === 'main') &&
              <div className='top-right-account'>
                <div className='account' onClick={() => { this.to_ethscan_with_account(this, this.state.my_account) }}>
                  <span className={'spot ' + this.state.net_type}></span>
                  <span className={'account-address'}>
                    {this.state.my_account.slice(0, 4) + '...' + this.state.my_account.slice(-4)}
                  </span>
                </div>
              </div>
            }
          </div>
          <div className='clear'></div>
        </div>




        <div className="App">
          {/* Add Handler */}
          <Modal
            keyboard={false}
            maskClosable={false}
            title="Add Handler"
            visible={this.state.visible_add_handler}
            onOk={this.handleOk}
            onCancel={this.handleCancel_add_handler}
            centered={true}
            cancelText={'quxiao'}
            footer={false}
          >
            <div className='popup-add-handler'>
              <div className='popup-add-handler-wrap'>
                <div className='popup-add-handler-left'>Handler: </div>
                <div className='popup-add-handler-right'>
                  <Input
                    value={this.state.add_handler_address}
                    onChange={(e) => { this.add_handler_change(e.target.value) }}
                  />
                </div>
              </div>

              <div className='handler-wrap'>
                <Input
                  type='number'
                  onChange={(e) => { this.add_handler_num_change(e.target.value) }}
                  value={this.state.add_handler_num}
                />%
              </div>

              <div className='ratio-arr'>
                {
                  this.state.arr_Propotion &&
                  this.state.arr_Propotion.map((item, index) => {
                    return (
                      <div className='ratio-arr-item'>
                        <span className='ratio-arr-item-title'>
                          Handler: {this.state.arr_handler_address[index]}
                        </span>
                        <span className='ratio-arr-item-input'>
                          {
                            this.state.handler_ratio_arr_p &&
                            <>
                              <Input
                                type='number'
                                onChange={(e) => { this.handler_ratio_change_p(e.target.value, index) }}
                                value={this.state.handler_ratio_arr_p[index]}
                              />%
                          </>
                          }
                        </span>
                      </div>
                    )
                  })
                }
              </div>

              <div className='popup-add-handler-confirm'>
                <span className={this.state.add_handler_enable ? 'confirm-btn active' : 'confirm-btn'} onClick={() => { this.add_handler_click() }}>Confirm</span>
              </div>
            </div>
          </Modal>

          {/* Target Reserve Ratio */}
          <Modal
            keyboard={false}
            maskClosable={false}
            title="Target Reserve Ratio"
            visible={this.state.visible_TR_ratio}
            onCancel={this.handleCancel_TR_ratio}
            centered={true}
            cancelText={'quxiao'}
            footer={false}
          >
            <div className='popup-TR-retio'>
              <div className='popup-TR-item'>
                <div className='popup-TR-1'>Upper Limit:</div>
                <div className='popup-TR-2'>
                  <Input
                    type='number'
                    value={this.state.Reserve_Upper_Limit_cp}
                    onChange={(e) => { this.input_Upper_change(e.target.value) }}
                  />%
              </div>
                <div className='popup-TR-3'>
                  <span className={this.state.Upper_Limit_enable ? 'confirm-btn active' : 'confirm-btn'} onClick={() => { this.Upper_Limit_click() }}>Confirm</span>
                </div>
              </div>
              <div className='popup-TR-item'>
                <div className='popup-TR-1'>Lower Limit:</div>
                <div className='popup-TR-2'>
                  <Input
                    type='number'
                    value={this.state.Reserve_Lower_Limit_cp}
                    onChange={(e) => { this.input_Lower_change(e.target.value) }}
                  />%
              </div>
                <div className='popup-TR-3'>
                  <span className={this.state.Lower_Limit_enable ? 'confirm-btn active' : 'confirm-btn'} onClick={() => { this.Lower_Limit_click() }}>Confirm</span>
                </div>
              </div>
            </div>
          </Modal>

          {/* Handler_ratio */}
          <Modal
            keyboard={false}
            maskClosable={false}
            title="Handler Ratio"
            visible={this.state.visible_Handler_ratio}
            onCancel={this.handleCancel_Handler_ratio}
            centered={true}
            cancelText={'quxiao'}
            footer={false}
          >
            <div className='popup-handler-ratio'>
              {
                this.state.arr_handler_address &&
                this.state.arr_handler_address.map((item, index) => {
                  return (
                    <div className='popup-handler-item' key={index}>
                      <div className='popup-handler-item-top'>
                        <span className='item-top-title'>Handler: </span>
                        <span className='item-top-address'>{item}</span>
                      </div>
                      <div className='popup-handler-item-bottom'>
                        <Input
                          type='number'
                          onChange={(e) => { this.handler_ratio_change(e.target.value, index) }}
                          value={this.state.handler_ratio_arr[index]}
                        />%
                    </div>
                    </div>
                  )
                })
              }
              <div className='popup-handler-confirm'>
                <span className={this.state.handler_ratio_enable ? 'confirm-btn active' : 'confirm-btn'} onClick={() => { this.handler_ratio_click() }}>Confirm</span>
              </div>
            </div>
          </Modal>

          {/* Update ProfitBeneficiary */}
          <Modal
            keyboard={false}
            maskClosable={false}
            title="Update ProfitBeneficiary"
            visible={this.state.visible_Beneficiary}
            onOk={this.handleOk}
            onCancel={this.handleCancel_Beneficiary}
            centered={true}
            cancelText={'quxiao'}
            footer={false}
          >
            <div className='popup-add-handler'>
              <div className='popup-add-handler-wrap'>
                <div className='popup-add-handler-left popup-add-handler-left-change'>Changed to: </div>
                <div className='popup-add-handler-right'>
                  <Input
                    value={this.state.update_Beneficiary}
                    onChange={(e) => { this.update_Beneficiary_change(e.target.value) }}
                  />
                </div>
              </div>

              <div className='popup-add-handler-confirm'>
                <span className={this.state.update_Beneficiary_enable ? 'confirm-btn active' : 'confirm-btn'} onClick={() => { this.update_Beneficiary_click() }}>Confirm</span>
              </div>
            </div>
          </Modal>

          {/* clear or delete */}
          <Modal
            keyboard={false}
            maskClosable={false}
            title={this.state.click_action + ' Tips'}
            visible={this.state.visible_click_action}
            onOk={this.handleOk}
            onCancel={this.handleCancel_click_action}
            centered={true}
            cancelText={'quxiao'}
            footer={false}
          >
            <div className='popup-tips'>
              <div className='popup-tips-wrap'>
                Please make sure you want to {this.state.click_action} this TargetHandler?
              </div>

              {
                this.state.click_action === 'remove' &&
                <div className='del-arr'>
                  {
                    this.state.arr_Propotion &&
                    this.state.arr_Propotion.map((item, index) => {
                      return (
                        <div className={this.state.del_item_index === index ? 'ratio-arr-item active' : 'ratio-arr-item'}>
                          <span className='ratio-arr-item-title'>
                            Handler: {this.state.arr_handler_address[index]}
                          </span>
                          <span className='ratio-arr-item-input'>
                            <Input
                              type='number'
                              disabled={this.state.del_item_index === index ? true : false}
                              onChange={(e) => { this.handler_ratio_change_d(e.target.value, index) }}
                              value={this.state.handler_ratio_arr_d[index]}
                            />%
                          </span>
                        </div>
                      )
                    })
                  }
                </div>
              }


              <div className='popup-tips-confirm'>
                <span className='confirm-btn' onClick={() => { this.update_click_action_click() }}>Confirm</span>
              </div>
            </div>
          </Modal>



          <div className="app-left">
            <span className='platform-name'>USDx Protocol</span>
            {/* <span className='platform-name'>StableSwap</span> */}
            {/* <span className='platform-name'>Xswap</span> */}
          </div>
          <div className="app-right">
            <div className='dispatcher'>
              <div className='dispatcher-left'>
                Dispatcher
            </div>
              <div className='dispatcher-right'>
                <span className='dispatcher-right-edit'>
                  <img src={Edit} alt='' onClick={this.showModal_Beneficiary} />
                </span>
                <span className='dispatcher-right-account' onClick={() => { this.openOnEtherscan(this.state.ProfitBeneficiary_address) }}>
                  {
                    this.state.ProfitBeneficiary_address ?
                      this.state.ProfitBeneficiary_address.slice(0, 4) + '...' + this.state.ProfitBeneficiary_address.slice(-4) : '···'
                  }
                </span>
                <span className='dispatcher-right-text'>ProfitBeneficiary</span>
                <div className='dispatcher-right-balance'>
                  {
                    this.state.my_balance ?
                      format_str_to_K(format_balance(this.state.my_balance, this.state.decimals_num, 2)) : '···'
                  }
                </div>
              </div>
            </div>
            <div className='content-wrap'>
              <div className="dispatcher-content">
                <Tabs onChange={(e) => { this.callback(e) }} type="card">
                  <Tabs.TabPane tab="USDC" key="1">
                    <div className='content-top'>
                      <div className='content-top-left'>
                        <img src={USDC} alt='' />
                        <span className='token-name'>USDC</span>
                        <div className='dispatcher-address'>
                          Dispatcher:
                        <span onClick={() => { this.openOnEtherscan(this.state.address_Dispatcher) }}>
                            {
                              this.state.address_Dispatcher ?
                                ' ' + this.state.address_Dispatcher.slice(0, 8) + '...' + this.state.address_Dispatcher.slice(-8) : '···'
                            }
                          </span>
                        </div>
                      </div>
                      <div className='content-top-right'>
                        <span className='gross-title'>Gross Amount</span>
                        <span className='gross-num'>
                          {this.state.Gross_Amount ? format_str_to_K(format_balance(this.state.Gross_Amount, this.state.decimals_num, 2)) : '···'}
                        </span>
                      </div>
                    </div>
                    <div className='content-center'>
                      <div className='content-center-left'>
                        <div className='item'>
                          <div className='item-title'>
                            Target Reserve Ratio
                          <span className='img-wrap'>
                              <img src={Edit} alt='' onClick={this.showModal_TR_ratio} />
                            </span>
                          </div>
                          <div className='item-num'>
                            {
                              (this.state.Reserve_Upper_Limit && this.state.Reserve_Lower_Limit) ?
                                format_persentage(this.state.Reserve_Lower_Limit) + ' ~ ' + format_persentage(this.state.Reserve_Upper_Limit) : '···'
                            }
                          </div>
                        </div>
                        <div className='item'>
                          <div className='item-title'>Pool Reserve</div>
                          <div className='item-num'>
                            {this.state.Pool_Reserve ? format_str_to_K(format_balance(this.state.Pool_Reserve, this.state.decimals_num, 2)) : '···'}
                          </div>
                        </div>
                        <div className='item'>
                          <div className='item-title'>
                            Handler Ratio
                          <span className='img-wrap'>
                              <img src={Edit} alt='' onClick={this.showModal_Handler_ratio} />
                            </span>
                          </div>
                          <div className='item-num'>
                            {this.state.arr_Propotion && this.state.arr_Propotion.map((item, index) => {
                              if (index === this.state.arr_Propotion.length - 1) {
                                return (
                                  <span key={index}>{format_persentage(item)}</span>
                                )
                              } else {
                                return (
                                  <span key={index}>{format_persentage(item) + ' / '}</span>
                                )
                              }
                            })}
                            {!this.state.arr_Propotion && '···'}
                          </div>
                        </div>
                      </div>
                      <div className='content-center-right'>
                        <div className='item'>
                          <div className='item-title'>Current Reserve Ratio</div>
                          <div className='item-num'>
                            {
                              this.state.Current_Dispatcher_Ratio ?
                                format_persentage_tofixed(this.state.Current_Dispatcher_Ratio) : '···'
                            }
                          </div>
                        </div>
                        <div className='item'>
                          <div className='item-title'>Total Principle</div>
                          <div className='item-num'>
                            {this.state.Total_Principle ? format_str_to_K(format_balance(this.state.Total_Principle, this.state.decimals_num, 2)) : '···'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='content-bottom'>
                      <div className='content-bottom-top'>
                        <div className='btn-wrap'>
                          <span className='btn' onClick={() => { this.addTargetHandler() }}>Add Handler</span>
                        </div>
                        <div className='btn-wrap noborder'>
                          <span className='btn' onClick={() => { this.withdrawProfit() }}>Withdraw Profit</span>
                        </div>
                      </div>
                      <div className='content-bottom-bottom'>
                        <span className='btn' onClick={() => { this.trigger() }}>Trigger</span>
                      </div>
                    </div>
                  </Tabs.TabPane>


                  <Tabs.TabPane tab="PAX" key="2">
                    <div className='content-top'>
                      <div className='content-top-left'>
                        <img src={PAX} alt='' />
                        <span className='token-name'>PAX</span>
                        <div className='dispatcher-address'>
                          Dispatcher:
                        <span onClick={() => { this.openOnEtherscan(this.state.address_Dispatcher) }}>
                            {
                              this.state.address_Dispatcher ?
                                ' ' + this.state.address_Dispatcher.slice(0, 8) + '...' + this.state.address_Dispatcher.slice(-8) : '···'
                            }
                          </span>
                        </div>
                      </div>
                      <div className='content-top-right'>
                        <span className='gross-title'>Gross Amount</span>
                        <span className='gross-num'>
                          {this.state.Gross_Amount ? format_str_to_K(format_balance(this.state.Gross_Amount, this.state.decimals_num, 2)) : '···'}
                        </span>
                      </div>
                    </div>
                    <div className='content-center'>
                      <div className='content-center-left'>
                        <div className='item'>
                          <div className='item-title'>
                            Target Reserve Ratio
                          <span className='img-wrap'>
                              <img src={Edit} alt='' onClick={this.showModal_TR_ratio} />
                            </span>
                          </div>
                          <div className='item-num'>
                            {
                              (this.state.Reserve_Upper_Limit && this.state.Reserve_Lower_Limit) ?
                                format_persentage(this.state.Reserve_Lower_Limit) + ' ~ ' + format_persentage(this.state.Reserve_Upper_Limit) : '···'
                            }
                          </div>
                        </div>
                        <div className='item'>
                          <div className='item-title'>Pool Reserve</div>
                          <div className='item-num'>
                            {this.state.Pool_Reserve ? format_str_to_K(format_balance(this.state.Pool_Reserve, this.state.decimals_num, 2)) : '···'}
                          </div>
                        </div>
                        <div className='item'>
                          <div className='item-title'>
                            Handler Ratio
                          <span className='img-wrap'>
                              <img src={Edit} alt='' onClick={this.showModal_Handler_ratio} />
                            </span>
                          </div>
                          <div className='item-num'>
                            {this.state.arr_Propotion && this.state.arr_Propotion.map((item, index) => {
                              if (index === this.state.arr_Propotion.length - 1) {
                                return (
                                  <span key={index}>{format_persentage(item)}</span>
                                )
                              } else {
                                return (
                                  <span key={index}>{format_persentage(item) + ' / '}</span>
                                )
                              }
                            })}
                            {!this.state.arr_Propotion && '···'}
                          </div>
                        </div>
                      </div>
                      <div className='content-center-right'>
                        <div className='item'>
                          <div className='item-title'>Current Reserve Ratio</div>
                          <div className='item-num'>
                            {
                              this.state.Current_Dispatcher_Ratio ?
                                format_persentage_tofixed(this.state.Current_Dispatcher_Ratio) : '···'
                            }
                          </div>
                        </div>
                        <div className='item'>
                          <div className='item-title'>Total Principle</div>
                          <div className='item-num'>
                            {this.state.Total_Principle ? format_str_to_K(format_balance(this.state.Total_Principle, this.state.decimals_num, 2)) : '···'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='content-bottom'>
                      <div className='content-bottom-top'>
                        <div className='btn-wrap'>
                          <span className='btn' onClick={() => { this.addTargetHandler() }}>Add Handler</span>
                        </div>
                        <div className='btn-wrap noborder'>
                          <span className='btn' onClick={() => { this.withdrawProfit() }}>Withdraw Profit</span>
                        </div>
                      </div>
                      <div className='content-bottom-bottom'>
                        <span className='btn' onClick={() => { this.trigger() }}>Trigger</span>
                      </div>
                    </div>
                  </Tabs.TabPane>


                  <Tabs.TabPane tab="TUSD" key="3">
                    <div className='content-top'>
                      <div className='content-top-left'>
                        <img src={TUSD} alt='' />
                        <span className='token-name'>TUSD</span>
                        <div className='dispatcher-address'>
                          Dispatcher:
                          <span onClick={() => { this.openOnEtherscan(this.state.address_Dispatcher) }}>
                            {
                              this.state.address_Dispatcher ?
                                ' ' + this.state.address_Dispatcher.slice(0, 8) + '...' + this.state.address_Dispatcher.slice(-8) : '···'
                            }
                          </span>
                        </div>
                      </div>
                      <div className='content-top-right'>
                        <span className='gross-title'>Gross Amount</span>
                        <span className='gross-num'>
                          {this.state.Gross_Amount ? format_str_to_K(format_balance(this.state.Gross_Amount, this.state.decimals_num, 2)) : '···'}
                        </span>
                      </div>
                    </div>
                    <div className='content-center'>
                      <div className='content-center-left'>
                        <div className='item'>
                          <div className='item-title'>
                            Target Reserve Ratio
                            <span className='img-wrap'>
                              <img src={Edit} alt='' onClick={this.showModal_TR_ratio} />
                            </span>
                          </div>
                          <div className='item-num'>
                            {
                              (this.state.Reserve_Upper_Limit && this.state.Reserve_Lower_Limit) ?
                                format_persentage(this.state.Reserve_Lower_Limit) + ' ~ ' + format_persentage(this.state.Reserve_Upper_Limit) : '···'
                            }
                          </div>
                        </div>
                        <div className='item'>
                          <div className='item-title'>Pool Reserve</div>
                          <div className='item-num'>
                            {this.state.Pool_Reserve ? format_str_to_K(format_balance(this.state.Pool_Reserve, this.state.decimals_num, 2)) : '···'}
                          </div>
                        </div>
                        <div className='item'>
                          <div className='item-title'>
                            Handler Ratio
                            <span className='img-wrap'>
                              <img src={Edit} alt='' onClick={this.showModal_Handler_ratio} />
                            </span>
                          </div>
                          <div className='item-num'>
                            {this.state.arr_Propotion && this.state.arr_Propotion.map((item, index) => {
                              if (index === this.state.arr_Propotion.length - 1) {
                                return (
                                  <span key={index}>{format_persentage(item)}</span>
                                )
                              } else {
                                return (
                                  <span key={index}>{format_persentage(item) + ' / '}</span>
                                )
                              }
                            })}
                            {!this.state.arr_Propotion && '···'}
                          </div>
                        </div>
                      </div>
                      <div className='content-center-right'>
                        <div className='item'>
                          <div className='item-title'>Current Reserve Ratio</div>
                          <div className='item-num'>
                            {
                              this.state.Current_Dispatcher_Ratio ?
                                format_persentage_tofixed(this.state.Current_Dispatcher_Ratio) : '···'
                            }
                          </div>
                        </div>
                        <div className='item'>
                          <div className='item-title'>Total Principle</div>
                          <div className='item-num'>
                            {this.state.Total_Principle ? format_str_to_K(format_balance(this.state.Total_Principle, this.state.decimals_num, 2)) : '···'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='content-bottom'>
                      <div className='content-bottom-top'>
                        <div className='btn-wrap'>
                          <span className='btn' onClick={() => { this.addTargetHandler() }}>Add Handler</span>
                        </div>
                        <div className='btn-wrap noborder'>
                          <span className='btn' onClick={() => { this.withdrawProfit() }}>Withdraw Profit</span>
                        </div>
                      </div>
                      <div className='content-bottom-bottom'>
                        <span className='btn' onClick={() => { this.trigger() }}>Trigger</span>
                      </div>
                    </div>
                  </Tabs.TabPane>
                </Tabs>
              </div>
              <div className='content-right'>
                <span className='handler'>Handler</span>
                {
                  this.state.arr_handler &&
                  this.state.arr_handler.map((item, index) => {
                    return (
                      <HandlerItem
                        key={index}
                        index={index}
                        data={item}
                        ratio={this.state.arr_Propotion[index]}
                        decimals={this.state.decimals_num}
                        del_item={() => { this.del_item(index) }}
                        clear_item={() => { this.clear_item(index) }}
                        TargetHandlerAddress={this.state.arr_TargetHandlerAddress[index]}
                        length={this.state.arr_TargetHandlerAddress.length}
                      />
                    )
                  })
                }
              </div>
            </div>

          </div>
        </div>





        {/* <div className='footer'>
          <div className='footer-left'>
            <div className='footer-left-res'>
              <span className='title'>
                Resource
              </span>
              <span className='content'>
                <a href='https://github.com/dforce-network/DIP001/' target='_blank' rel="noopener noreferrer">GitHub</a>
              </span>
              <span className='content'>
                <a onClick={() => { this.clickFAQ() }}>FAQ</a>
              </span>
            </div>

            <div className='footer-left-pro'>
              <span className='title'>
                Products
              </span>
              <span className='content'>
                <a href='https://www.lendf.me/' target='_blank' rel="noopener noreferrer">Lendf.me</a>
              </span>
              <span className='content'>
                <a href='https://markets.lendf.me/' target='_blank' rel="noopener noreferrer">Markets</a>
              </span>
            </div>
          </div>

          <div className='footer-right'>
            <a href='https://twitter.com/LendfMe' target='_blank' rel="noopener noreferrer">
              <img src={twitter} alt='' />
            </a>
            <a href='https://medium.com/dforcenet' target='_blank' rel="noopener noreferrer">
              <img src={medium} alt='' />
            </a>
            <a href='https://t.me/dforcenet' target='_blank' rel="noopener noreferrer">
              <img src={telegram} alt='' />
            </a>
            <div className='clear'></div>

            <div className='footer-right-fixed'>
              <div className='fixed1'>
                {
                  this.state.cur_language
                }
              </div>
              <span className='fixed-img'>
                <img src={up} alt='' />
              </span>
              <div className='fixed2'>
                <ul>
                  <li onClick={() => { this.setState({ cur_language: '中文' }) }}>{'中文'}</li>
                  <li onClick={() => { this.setState({ cur_language: 'English' }) }}>{'English'}</li>
                </ul>
              </div>
            </div>
          </div>
          <div className='clear'></div>
        </div> */}
      </>
    )
  }
}

