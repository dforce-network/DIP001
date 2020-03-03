const DSGuard = artifacts.require('DSGuard.sol');

const Dispatcher = artifacts.require('Dispatcher.sol');
const DispatcherEntrance = artifacts.require('DispatcherEntrance.sol');

const CompoundHandler = artifacts.require('CompoundHandler.sol');
const lendFMeHandler = artifacts.require('lendFMeHandler.sol');

//Rinkeby
var DFPool = '0xccf31dc9dcb6cb788d3c6b64f73efedfb7e9f20b';

var tokens = {
    PAX:	'0x722E6238335d89393A42e2cA316A5fb1b8B2EB55',
    TUSD:	'0xe72a3181f69Eb21A19bd4Ce19Eb68FDb333d74c6',
    USDC:	'0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b'
};

var lendFMeAddress = '0xdcfd113789ef683f676435fff90b953a0cc76044';
var CompoundAddress = {
    USDC:'0x5b281a6dda0b271e91ae35de655ad301c976edb1'
};

var admin = '0xcC27B0206645aDbE5b5C8d212c2a98574090B68F';

//Mainnet

var decimals = {
    PAX: 18,
    TUSD: 18,
    USDC: 6
};

var propotionList = [1000];

var count = 0;
var result = {};

module.exports = async function (deployer, network, accounts) {

    await deployer.deploy(DSGuard);
    let contractDSGuard = await DSGuard.deployed();
    await deployer.deploy(DispatcherEntrance);
    let contractDispatcherEntrance = await DispatcherEntrance.deployed();

    result.DSGuard = DSGuard.address;
    result.DispatcherEntrance = DispatcherEntrance.address;
    
    var targetList = [];
    var contractLendFMeHandler;
    var contractCompoundHandler;
    var contractDispatcher;
    for (const key in tokens) {
        targetList = [];
        result[tokens[key]] = {};
        contractLendFMeHandler = await deployer.deploy(lendFMeHandler, lendFMeAddress, tokens[key]);
        // contractLendFMeHandler = await lendFMeHandler.deployed();
        targetList.push(lendFMeHandler.address);
        result[tokens[key]].LendFMeHandler = lendFMeHandler.address;

        if (CompoundAddress.hasOwnProperty(key)) {
            contractCompoundHandler = await deployer.deploy(CompoundHandler, CompoundAddress[key], tokens[key]);
            // contractCompoundHandler = await CompoundHandler.deployed();
            targetList.push(CompoundHandler.address);
            result[tokens[key]].CompoundHandler = CompoundHandler.address;
            propotionList = [700, 300];
        }
            
        contractDispatcher = await deployer.deploy(Dispatcher, tokens[key], DFPool, targetList, propotionList, decimals[key]);
        result[tokens[key]].Dispatcher = Dispatcher.address;

        await contractLendFMeHandler.setDispatcher.sendTransaction(Dispatcher.address).then(result => {
            print("contractLendFMeHandler.setDispatcher");
            printTx(result.tx);
        }).catch(error => {
            perror("contractLendFMeHandler.setDispatcher");
            console.log(error);
        })

        await contractLendFMeHandler.setAuthority.sendTransaction(DSGuard.address).then(result => {
            print("contractLendFMeHandler.setAuthority");
            printTx(result.tx);
        }).catch(error => {
            perror("contractLendFMeHandler.setAuthority");
            console.log(error);
        })

        await contractDSGuard.permitx.sendTransaction(Dispatcher.address, lendFMeHandler.address).then(result => {
            print("contractDSGuard.permitx Dispatcher call LendFMeHandler");
            printTx(result.tx);
        }).catch(error => {
            perror("contractDSGuard.permitx Dispatcher call LendFMeHandler");
            console.log(error);
        })

        if (CompoundAddress.hasOwnProperty(key)) {
            await contractCompoundHandler.setDispatcher.sendTransaction(Dispatcher.address).then(result => {
                print("contractCompoundHandler.setDispatcher");
                printTx(result.tx);
            }).catch(error => {
                perror("contractCompoundHandler.setDispatcher");
                console.log(error);
            })

            await contractCompoundHandler.setAuthority.sendTransaction(DSGuard.address).then(result => {
                print("contractCompoundHandler.setAuthority");
                printTx(result.tx);
            }).catch(error => {
                perror("contractCompoundHandler.setAuthority");
                console.log(error);
            })

            await contractDSGuard.permitx.sendTransaction(Dispatcher.address, CompoundHandler.address).then(result => {
                print("contractDSGuard.permitx Dispatcher call CompoundHandler");
                printTx(result.tx);
            }).catch(error => {
                perror("contractDSGuard.permitx Dispatcher call CompoundHandler");
                console.log(error);
            })
        }

        await contractDispatcher.setAuthority.sendTransaction(DSGuard.address).then(result => {
            print("contractDispatcher.setAuthority");
            printTx(result.tx);
        }).catch(error => {
            perror("contractDispatcher.setAuthority");
            console.log(error);
        })

        await contractDSGuard.permitx.sendTransaction(admin, Dispatcher.address).then(result => {
            print("contractDSGuard.permitx admin call Dispatcher");
            printTx(result.tx);
        }).catch(error => {
            perror("contractDSGuard.permitx admin call Dispatcher");
            console.log(error);
        })

        await contractDispatcherEntrance.registDispatcher.sendTransaction(DFPool, tokens[key], Dispatcher.address).then(result => {
            print("contractDispatcherEntrance.registDispatcher Pool Token Dispatcher");
            printTx(result.tx);
        }).catch(error => {
            perror("contractDispatcherEntrance.registDispatcher Pool Token Dispatcher");
            console.log(error);
        })
    }

    console.log(result);

    function print(str) {
        count++;
        console.log(`\n${count} #######`, str);
    }

    function printTx(str) {
        console.log(`\n-#######`, str);
    }

    function perror(str) {
        console.log(`\n!!!!!!!`, str);
    }
};