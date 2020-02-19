# DIP001
dForce Improvement Proposal for global interest.

### run ganache

```
./ganache-cli --port=7545 --gasLimit=8000000 --accounts=10 --defaultBalanceEther=100000
```

### run test
```
truffle test
truffle test test/test_noProfit.js
truffle test test/test_withProfit.js
```

### deploy step

step 1: deploy usdxSaver 

step 2: deploy lendFMeHandler 

step 3: deploy usdx dispatcher

step 4: set dispatcher in handler

step 5: set authority in dispatcher, handler

step 6: call function *permitx* in DSGuard, src: dispatcher, dst: handler

step 7: call function *permitx* in DSGuard, src: admin, dst: dispatcher, handler
