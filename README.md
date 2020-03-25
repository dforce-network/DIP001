# DIP001
dForce Improvement Proposal for global interest.

### Contracts Deployed in Mainnet(2020-03-25)
<table>
	<tr>
   		<th>Contract Name</th>
    	<th>Contract Address</th>
	</tr>
	<tr>
		<td> DispatcherEntrance </td>
		<td> 0xeb269732ab75A6fD61Ea60b06fE994cD32a83549 </td>
	</tr>
	<tr>
		<td> DSGuard </td>
		<td> 0x7F0Ac31162b38Ab566e7552ab7b9A2b944d0A375 </td>
	</tr>
	<tr>
		<td> PAXDispatcher </td>
		<td> 0x6C11011130bf0C09aBb7364BE5a46507A1f30E91 </td>
	</tr>
	<tr>
		<td> PAXHandler </td>
		<td> 0x28ffC9A34557200Fca0Dcc3a3D2cD7c7f90d7c27 </td>
	</tr>
		<tr>
		<td> TUSDDispatcher </td>
		<td> 0x5738e22bACe1f51b50c140684c02DD604A49Bec6 </td>
	</tr>
	<tr>
		<td> TUSDHandler </td>
		<td> 0xC8C975A04DFAD52EeB399D7370b7d2c016DBA9Be </td>
	</tr>
    	<tr>
		<td> USDCDispatcher </td>
		<td> 0x6BAc35D67002d08b3a1a9573d127A24755d868fA </td>
	</tr>
	<tr>
		<td> USDCHandler </td>
		<td> 0x77153f5ea0d0a2A9B9658045256a7CD2baD97A89 </td>
	</tr>
</table>

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
